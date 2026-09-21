-- 0034_apply_mortality_to_entity_quantity.sql
--
-- Apply mortality events to the current farm entity quantity.
--
-- Mortality payloads may use either:
--   { "count": N }     -- legacy format
--   { "quantity": N }  -- modern format
--
-- This migration intentionally does NOT automatically change entity status
-- when quantity reaches zero. Lifecycle status remains an explicit operation.

create or replace function public.process_daily_log(
  p_events jsonb default '[]'::jsonb,
  p_expense jsonb default null::jsonb,
  p_content jsonb default null::jsonb
)
returns jsonb
language plpgsql
set search_path to 'public'
as $function$
declare
  v_event jsonb;
  v_lot record;
  v_event_id uuid;

  v_entity_id uuid;
  v_entity_status text;
  v_entity_quantity numeric;
  v_mortality numeric;

  v_item_id uuid;
  v_item_name text;
  v_needed numeric;
  v_taken numeric;
  v_shortfalls jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_events) <> 'array' then
    raise exception 'p_events must be a JSON array';
  end if;

  for v_event in
    select value
    from jsonb_array_elements(p_events)
  loop

    /*
     * Mortality changes current entity quantity.
     *
     * Lock the entity BEFORE inserting the event so concurrent mortality
     * events/status changes cannot both calculate against the same quantity.
     */
    if v_event->>'type' = 'mortality' then

      v_entity_id := (v_event->>'entity_id')::uuid;

      select
        status,
        quantity
      into
        v_entity_status,
        v_entity_quantity
      from public.farm_entities
      where id = v_entity_id
      for update;

      if not found then
        raise exception 'Farm entity not found';
      end if;

      /*
       * Support both historical and modern mortality payloads.
       */
      v_mortality := coalesce(
        (v_event->'payload'->>'quantity')::numeric,
        (v_event->'payload'->>'count')::numeric
      );

      if v_mortality is null then
        raise exception
          'Mortality must include numeric payload.quantity or payload.count';
      end if;

      if v_mortality < 0 then
        raise exception 'Mortality must be 0 or greater';
      end if;

      if v_mortality <> trunc(v_mortality) then
        raise exception 'Mortality must be a whole number';
      end if;

      if v_mortality > v_entity_quantity then
        raise exception
          'Mortality (%) cannot exceed current entity quantity (%)',
          v_mortality,
          v_entity_quantity;
      end if;

      /*
       * The existing lifecycle trigger will also validate that the entity
       * is not closed. The explicit check here happens while the row is
       * locked, preventing a concurrent lifecycle transition.
       */
      if v_entity_status in ('sold', 'deceased', 'harvested') then
        raise exception
          'Cannot record event "%" for entity with status "%"',
          'mortality',
          v_entity_status;
      end if;

    end if;

    /*
     * Existing event insertion path.
     */
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

    /*
     * Apply mortality to current entity quantity after the event has been
     * successfully recorded.
     *
     * Both operations are inside this PostgreSQL transaction, so an error
     * rolls back both the event and quantity change.
     */
    if v_event->>'type' = 'mortality' and v_mortality > 0 then

      update public.farm_entities
      set quantity = quantity - v_mortality
      where id = v_entity_id;

    end if;

    /*
     * Existing inventory/feed processing.
     */
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

    if not found then
      raise exception 'Inventory item not found: %', v_item_id;
    end if;

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

  /*
   * Existing finance handling.
   */
  if p_expense is not null then
    insert into finance_transactions (
      type,
      amount,
      category,
      entity_id,
      occurred_at,
      notes
    )
    values (
      'expense',
      (p_expense->>'amount')::numeric,
      p_expense->>'category',
      nullif(p_expense->>'entity_id', '')::uuid,
      (p_expense->>'occurred_at')::date,
      p_expense->>'notes'
    );
  end if;

  /*
   * Existing content handling.
   */
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