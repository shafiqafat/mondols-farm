create or replace function public.process_daily_log(
  p_events jsonb default '[]'::jsonb,
  p_expense jsonb default null::jsonb,
  p_content jsonb default null::jsonb
)
returns jsonb
language plpgsql
set search_path = public
as $function$
declare
  v_event jsonb;
  v_lot record;
  v_event_id uuid;
  v_item_id uuid;
  v_item_name text;
  v_needed numeric;
  v_taken numeric;
  v_shortfalls jsonb := '[]'::jsonb;
  v_expense_entity_id uuid;
  v_expense_date date;
  v_project_id uuid;
begin
  if jsonb_typeof(p_events) <> 'array' then
    raise exception 'p_events must be a JSON array';
  end if;

  /*
    Process each event inside the same database transaction.

    For feed_given events:
      1. Insert the event.
      2. Lock eligible inventory lots in FIFO order.
      3. Deduct stock.
      4. Record the exact lot allocation.
  */

  for v_event in
    select value
    from jsonb_array_elements(p_events)
  loop

    insert into entity_events (
      entity_id,
      type,
      payload,
      occurred_at
    )
    values (
      (v_event->>'entity_id')::uuid,
      v_event->>'type',
      coalesce(v_event->'payload', '{}'::jsonb),
      (v_event->>'occurred_at')::date
    )
    returning id into v_event_id;

    if v_event->>'type' <> 'feed_given'
       or nullif(v_event->'payload'->>'item_id', '') is null then
      continue;
    end if;

    v_item_id := (v_event->'payload'->>'item_id')::uuid;

    v_needed := greatest(
      coalesce(
        (v_event->'payload'->>'qty_kg')::numeric,
        0
      ),
      0
    );

    if v_needed = 0 then
      continue;
    end if;

    select name
    into v_item_name
    from inventory_items
    where id = v_item_id;

    for v_lot in
      select
        id,
        qty_remaining,
        cost_per_unit
      from inventory_lots
      where item_id = v_item_id
        and qty_remaining > 0
      order by purchased_at, id
      for update
    loop

      exit when v_needed <= 0;

      v_taken := least(
        v_lot.qty_remaining,
        v_needed
      );

      update inventory_lots
      set qty_remaining = qty_remaining - v_taken
      where id = v_lot.id;

      insert into inventory_consumptions (
        event_id,
        item_id,
        lot_id,
        quantity,
        unit_cost,
        total_cost
      )
      values (
        v_event_id,
        v_item_id,
        v_lot.id,
        v_taken,
        v_lot.cost_per_unit,
        v_taken * v_lot.cost_per_unit
      );

      v_needed := v_needed - v_taken;

    end loop;

    if v_needed > 0 then
      v_shortfalls := v_shortfalls || jsonb_build_array(
        jsonb_build_object(
          'item_name',
          coalesce(v_item_name, 'item'),
          'shortfall',
          v_needed
        )
      );
    end if;

  end loop;

  if p_expense is not null then

    v_expense_entity_id :=
      nullif(p_expense->>'entity_id', '')::uuid;

    v_expense_date :=
      (p_expense->>'occurred_at')::date;

    /*
      farm_project_entities is the authoritative source for
      entity ↔ project assignment history.

      Find the project to which the entity belonged on the
      actual expense date.
    */
    if v_expense_entity_id is not null then
      select fpe.project_id
      into v_project_id
      from farm_project_entities fpe
      where fpe.entity_id = v_expense_entity_id
        and fpe.started_at <= v_expense_date
        and (
          fpe.ended_at is null
          or v_expense_date < fpe.ended_at
        )
      order by fpe.started_at desc
      limit 1;
    end if;

    insert into finance_transactions (
      type,
      amount,
      category,
      project_id,
      entity_id,
      occurred_at,
      notes
    )
    values (
      'expense',
      (p_expense->>'amount')::numeric,
      p_expense->>'category',
      v_project_id,
      v_expense_entity_id,
      v_expense_date,
      p_expense->>'notes'
    );

  end if;

  if p_content is not null then
    insert into content_items (
      title,
      type,
      stage,
      notes,
      occurred_at
    )
    values (
      p_content->>'title',
      coalesce(p_content->>'type', 'mixed'),
      coalesce(p_content->>'stage', 'idea'),
      p_content->>'notes',
      coalesce(
        (p_content->>'occurred_at')::date,
        current_date
      )
    );
  end if;

  return jsonb_build_object(
    'shortfalls',
    v_shortfalls
  );

end;
$function$;