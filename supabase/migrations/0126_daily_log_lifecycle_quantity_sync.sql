
-- 0126_daily_log_lifecycle_quantity_sync.sql
-- Backfills legacy Daily Log mortality into entity quantities/statuses, then
-- applies lifecycle handling to new and edited Daily Log mortality events.
-- The backfill is idempotent: each historical event is mapped only once.

begin;

create table if not exists public.daily_log_batch_lifecycle_events (
  event_id uuid primary key references public.entity_events(id),
  batch_id uuid not null references public.daily_log_batches(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists daily_log_batch_lifecycle_events_batch_idx
  on public.daily_log_batch_lifecycle_events(batch_id);

alter table public.daily_log_batch_lifecycle_events enable row level security;

revoke all on public.daily_log_batch_lifecycle_events
  from public, anon, authenticated;


-- ============================================================
-- 1. BACKFILL HISTORICAL DAILY LOG MORTALITY
-- ============================================================

do $backfill$
declare
  v_row record;
  v_latest_type text;
  v_latest_event_id uuid;
  v_current_quantity numeric;
begin

  -- GROUP entities: apply historical mortality not previously deducted.
  for v_row in
    with batch_events as (
      select distinct on (ee.id)
        ee.id as event_id,
        ee.entity_id,
        coalesce(
          nullif(ee.payload->>'quantity',''),
          nullif(ee.payload->>'count','')
        ) as quantity_text,
        dlb.id as batch_id
      from public.daily_log_batches dlb
      cross join lateral unnest(
        coalesce(dlb.event_ids, '{}'::uuid[])
      ) as u(event_id)
      join public.entity_events ee on ee.id = u.event_id
      left join public.daily_log_batch_lifecycle_events mapped
        on mapped.event_id = ee.id
      where ee.type = 'mortality'
        and ee.reversed_at is null
        and mapped.event_id is null
      order by ee.id, dlb.created_at, dlb.id
    ),
    parsed as (
      select *,
        case
          when quantity_text ~ '^[0-9]+$'
          then quantity_text::numeric
          else null
        end as mortality_qty
      from batch_events
    )
    select
      p.entity_id,
      sum(p.mortality_qty) as total_mortality,
      count(*) as event_count,
      count(p.mortality_qty) as valid_quantity_count,
      array_agg(p.event_id order by p.event_id) as event_ids
    from parsed p
    join public.farm_entities fe on fe.id = p.entity_id
    where fe.tracking_mode = 'group'
    group by p.entity_id
  loop

    if v_row.total_mortality is null
       or v_row.total_mortality <= 0
       or v_row.event_count = 0
       or v_row.valid_quantity_count <> v_row.event_count then
      raise exception
        'Historical group mortality has an invalid quantity for entity %',
        v_row.entity_id;
    end if;

    select coalesce(quantity, 0)
      into v_current_quantity
    from public.farm_entities
    where id = v_row.entity_id
    for update;

    if not found then
      raise exception
        'Cannot backfill mortality: group entity % does not exist',
        v_row.entity_id;
    end if;

    if v_current_quantity < v_row.total_mortality then
      raise exception
        'Cannot safely backfill group entity %: current quantity % is less than un-applied historical mortality %. Check whether some mortality was already deducted manually.',
        v_row.entity_id,
        v_current_quantity,
        v_row.total_mortality;
    end if;

    update public.farm_entities
    set quantity = v_current_quantity - v_row.total_mortality
    where id = v_row.entity_id;

    -- Mark historical events as applied.
    insert into public.daily_log_batch_lifecycle_events(batch_id, event_id)
    select distinct on (ee.id)
      dlb.id,
      ee.id
    from public.daily_log_batches dlb
    cross join lateral unnest(
      coalesce(dlb.event_ids, '{}'::uuid[])
    ) as u(event_id)
    join public.entity_events ee on ee.id = u.event_id
    where ee.id = any(v_row.event_ids)
      and ee.type = 'mortality'
      and ee.reversed_at is null
    order by ee.id, dlb.created_at, dlb.id
    on conflict (event_id) do nothing;

  end loop;


  -- INDIVIDUAL entities: apply death only when the latest unreversed
  -- sale/mortality lifecycle event is mortality.
  for v_row in
    select distinct ee.entity_id
    from public.daily_log_batches dlb
    cross join lateral unnest(
      coalesce(dlb.event_ids, '{}'::uuid[])
    ) as u(event_id)
    join public.entity_events ee on ee.id = u.event_id
    join public.farm_entities fe on fe.id = ee.entity_id
    left join public.daily_log_batch_lifecycle_events mapped
      on mapped.event_id = ee.id
    where ee.type = 'mortality'
      and ee.reversed_at is null
      and mapped.event_id is null
      and fe.tracking_mode = 'individual'
  loop

    select ee.id, ee.type
      into v_latest_event_id, v_latest_type
    from public.entity_events ee
    where ee.entity_id = v_row.entity_id
      and ee.type in ('sale', 'mortality')
      and ee.reversed_at is null
    order by
      ee.occurred_at desc,
      ee.created_at desc,
      ee.id desc
    limit 1;

    if v_latest_type = 'mortality' then

      update public.farm_entities
      set quantity = 0,
          status = 'deceased'
      where id = v_row.entity_id
        and (
          status is distinct from 'deceased'
          or coalesce(quantity, 0) <> 0
        );

      insert into public.daily_log_batch_lifecycle_events(batch_id, event_id)
      select dlb.id, ee.id
      from public.daily_log_batches dlb
      cross join lateral unnest(
        coalesce(dlb.event_ids, '{}'::uuid[])
      ) as u(event_id)
      join public.entity_events ee on ee.id = u.event_id
      where ee.id = v_latest_event_id
        and ee.type = 'mortality'
      order by dlb.created_at, dlb.id
      limit 1
      on conflict (event_id) do nothing;

    end if;

  end loop;

end;
$backfill$;


-- ============================================================
-- 2. PROCESS DAILY LOG
-- ============================================================

create or replace function public.process_daily_log(
  p_events jsonb default '[]'::jsonb,
  p_expense jsonb default null::jsonb,
  p_content jsonb default null::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_event jsonb;
  v_lot record;
  v_event_id uuid;
  v_result jsonb;
  v_batch_id uuid;
  v_item_id uuid;
  v_item_name text;
  v_needed numeric;
  v_taken numeric;
  v_shortfalls jsonb := '[]'::jsonb;
  v_expense_entity_id uuid;
  v_expense_date date;
  v_project_id uuid;
  v_event_ids uuid[] := '{}';
  v_expense_id uuid;
  v_content_id uuid;
  v_log_date date;
begin

  if not farm_can_write() then
    raise exception 'You do not have permission to record daily logs';
  end if;

  if p_events is null or jsonb_typeof(p_events) <> 'array' then
    raise exception 'p_events must be a JSON array';
  end if;

  v_log_date := coalesce(
    nullif(p_events->0->>'occurred_at','')::date,
    nullif(p_expense->>'occurred_at','')::date,
    nullif(p_content->>'occurred_at','')::date,
    current_date
  );

  for v_event in
    select value from jsonb_array_elements(p_events)
  loop

    if v_event->>'type' = 'mortality' then

      v_result := public.record_entity_event(
        (v_event->>'entity_id')::uuid,
        'mortality',
        coalesce(v_event->'payload','{}'::jsonb),
        (v_event->>'occurred_at')::date
      );

      v_event_id := (v_result->>'event_id')::uuid;

    else

      insert into entity_events(
        entity_id,
        type,
        payload,
        occurred_at
      )
      values (
        (v_event->>'entity_id')::uuid,
        v_event->>'type',
        coalesce(v_event->'payload','{}'::jsonb),
        (v_event->>'occurred_at')::date
      )
      returning id into v_event_id;

    end if;

    v_event_ids := array_append(v_event_ids, v_event_id);

    if v_event->>'type' <> 'feed_given'
       or nullif(v_event->'payload'->>'item_id','') is null then
      continue;
    end if;

    v_item_id := (v_event->'payload'->>'item_id')::uuid;
    v_needed := greatest(
      coalesce((v_event->'payload'->>'qty_kg')::numeric, 0),
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
      select id, qty_remaining, cost_per_unit
      from inventory_lots
      where item_id = v_item_id
        and qty_remaining > 0
      order by purchased_at, id
      for update
    loop

      exit when v_needed <= 0;

      v_taken := least(v_lot.qty_remaining, v_needed);

      update inventory_lots
      set qty_remaining = qty_remaining - v_taken
      where id = v_lot.id;

      insert into inventory_consumptions(
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
          'item_name', coalesce(v_item_name, 'item'),
          'shortfall', v_needed
        )
      );
    end if;

  end loop;


  if p_expense is not null then

    v_expense_entity_id := nullif(p_expense->>'entity_id','')::uuid;
    v_expense_date := (p_expense->>'occurred_at')::date;
    v_project_id := null;

    if v_expense_entity_id is not null then
      select project_id
        into v_project_id
      from farm_project_entities
      where entity_id = v_expense_entity_id
        and started_at <= v_expense_date
        and (ended_at is null or v_expense_date < ended_at)
      order by started_at desc
      limit 1;
    end if;

    insert into finance_transactions(
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
    )
    returning id into v_expense_id;

  end if;


  if p_content is not null then

    insert into content_items(
      title,
      type,
      stage,
      notes,
      occurred_at
    )
    values (
      p_content->>'title',
      coalesce(p_content->>'type','mixed'),
      coalesce(p_content->>'stage','idea'),
      p_content->>'notes',
      coalesce(
        nullif(p_content->>'occurred_at','')::date,
        current_date
      )
    )
    returning id into v_content_id;

  end if;


  insert into daily_log_batches(
    log_date,
    event_ids,
    event_data,
    expense_transaction_id,
    expense_data,
    content_item_id,
    content_data
  )
  values (
    v_log_date,
    v_event_ids,
    p_events,
    v_expense_id,
    p_expense,
    v_content_id,
    p_content
  )
  returning id into v_batch_id;


  -- Record which mortality events had lifecycle effects applied.
  insert into daily_log_batch_lifecycle_events(batch_id, event_id)
  select v_batch_id, ee.id
  from entity_events ee
  where ee.id = any(v_event_ids)
    and ee.type = 'mortality';

  return jsonb_build_object(
    'shortfalls', v_shortfalls,
    'batch_id', v_batch_id
  );

end;
$function$;


-- ============================================================
-- 3. EDIT DAILY LOG
-- ============================================================

create or replace function public.edit_daily_log(
  p_batch_id uuid,
  p_events jsonb,
  p_expense jsonb default null,
  p_content jsonb default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_batch daily_log_batches%rowtype;
  v_i integer;
  v_event jsonb;
  v_event_id uuid;
  v_old_id uuid;
  v_old_type text;
  v_old_applied boolean;
  v_result jsonb;
  v_lifecycle record;
  v_lot record;
  v_item_id uuid;
  v_item_name text;
  v_needed numeric;
  v_taken numeric;
  v_shortfalls jsonb := '[]'::jsonb;
  v_expense_entity_id uuid;
  v_expense_date date;
  v_project_id uuid;
  v_new_ids uuid[] := '{}';
  v_expense_id uuid;
  v_content_id uuid;
  v_old_count integer;
  v_has_reconciliations boolean;
begin

  if not farm_can_write() then
    raise exception 'You do not have permission to edit daily logs';
  end if;

  if p_events is null or jsonb_typeof(p_events) <> 'array' then
    raise exception 'p_events must be a JSON array';
  end if;

  select *
    into v_batch
  from daily_log_batches
  where id = p_batch_id
  for update;

  if not found then
    raise exception 'Daily log not found or is not editable';
  end if;

  v_old_count := coalesce(array_length(v_batch.event_ids, 1), 0);


  -- Reverse only events whose lifecycle effects this RPC actually applied.
  -- 0056 requires latest-first order.
  for v_lifecycle in
    select ee.id
    from daily_log_batch_lifecycle_events m
    join entity_events ee on ee.id = m.event_id
    where m.batch_id = p_batch_id
      and ee.reversed_at is null
    order by
      ee.occurred_at desc,
      ee.created_at desc,
      ee.id desc
  loop

    perform public.reverse_entity_event(
      v_lifecycle.id,
      'Daily Log batch edited'
    );

  end loop;


  -- Restore feed allocations, retaining 0121 reconciliation safeguards.
  if v_old_count > 0
     and exists (
       select 1
       from inventory_consumptions
       where event_id = any(v_batch.event_ids)
     ) then

    if to_regclass('public.inventory_lot_reconciliations') is not null
       and exists (
         select 1
         from inventory_lot_reconciliations
         where lot_id in (
           select distinct lot_id
           from inventory_consumptions
           where event_id = any(v_batch.event_ids)
         )
       ) then
      raise exception
        'This log uses inventory with reconciliation history and cannot be edited safely';
    end if;

    if to_regclass('public.inventory_consumption_reconciliations') is not null then

      execute
        'select exists(select 1 from public.inventory_consumption_reconciliations)'
        into v_has_reconciliations;

      if v_has_reconciliations then
        raise exception
          'Inventory consumption reconciliation records exist; feed-related log edits are temporarily blocked to protect the ledger';
      end if;

    end if;


    for v_lot in
      select lot_id, sum(quantity) qty
      from inventory_consumptions
      where event_id = any(v_batch.event_ids)
      group by lot_id
    loop

      update inventory_lots
      set qty_remaining = qty_remaining + v_lot.qty
      where id = v_lot.lot_id;

    end loop;

    delete from inventory_consumptions
    where event_id = any(v_batch.event_ids);

  end if;


  -- Delete removed ordinary rows. Reversed lifecycle rows remain as audit history.
  if v_old_count > jsonb_array_length(p_events) then

    for v_i in (jsonb_array_length(p_events) + 1)..v_old_count loop

      v_old_id := v_batch.event_ids[v_i];

      if not exists (
        select 1
        from daily_log_batch_lifecycle_events
        where event_id = v_old_id
      ) then
        delete from entity_events
        where id = v_old_id;
      end if;

    end loop;

  end if;


  if jsonb_array_length(p_events) > 0 then

    for v_i in 0..(jsonb_array_length(p_events) - 1) loop

      v_event := p_events->v_i;
      v_old_id := null;
      v_old_type := null;
      v_old_applied := false;

      if v_i < v_old_count then

        v_old_id := v_batch.event_ids[v_i + 1];

        select type
          into v_old_type
        from entity_events
        where id = v_old_id;

        select exists (
          select 1
          from daily_log_batch_lifecycle_events
          where event_id = v_old_id
        )
        into v_old_applied;

      end if;


      if v_event->>'type' = 'mortality' then

        if v_old_id is not null
           and v_old_type = 'mortality'
           and not v_old_applied then

          -- Legacy mortality was never quantity-applied.
          update entity_events
          set entity_id = (v_event->>'entity_id')::uuid,
              payload = coalesce(v_event->'payload','{}'::jsonb),
              occurred_at = (v_event->>'occurred_at')::date
          where id = v_old_id
          returning id into v_event_id;

          if not found then
            raise exception
              'An activity in this log no longer exists; edit was cancelled';
          end if;

        else

          -- New mortality or replacement for an applied lifecycle row.
          if v_old_id is not null and not v_old_applied then
            delete from entity_events
            where id = v_old_id;
          end if;

          v_result := public.record_entity_event(
            (v_event->>'entity_id')::uuid,
            'mortality',
            coalesce(v_event->'payload','{}'::jsonb),
            (v_event->>'occurred_at')::date
          );

          v_event_id := (v_result->>'event_id')::uuid;

          insert into daily_log_batch_lifecycle_events(
            batch_id,
            event_id
          )
          values (
            p_batch_id,
            v_event_id
          );

        end if;

      else

        if v_old_id is not null and not v_old_applied then

          update entity_events
          set entity_id = (v_event->>'entity_id')::uuid,
              type = v_event->>'type',
              payload = coalesce(v_event->'payload','{}'::jsonb),
              occurred_at = (v_event->>'occurred_at')::date
          where id = v_old_id
          returning id into v_event_id;

          if not found then
            raise exception
              'An activity in this log no longer exists; edit was cancelled';
          end if;

        else

          insert into entity_events(
            entity_id,
            type,
            payload,
            occurred_at
          )
          values (
            (v_event->>'entity_id')::uuid,
            v_event->>'type',
            coalesce(v_event->'payload','{}'::jsonb),
            (v_event->>'occurred_at')::date
          )
          returning id into v_event_id;

        end if;

      end if;


      v_new_ids := array_append(v_new_ids, v_event_id);


      if v_event->>'type' <> 'feed_given'
         or nullif(v_event->'payload'->>'item_id','') is null then
        continue;
      end if;

      v_item_id := (v_event->'payload'->>'item_id')::uuid;

      v_needed := greatest(
        coalesce((v_event->'payload'->>'qty_kg')::numeric, 0),
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
        select id, qty_remaining, cost_per_unit
        from inventory_lots
        where item_id = v_item_id
          and qty_remaining > 0
        order by purchased_at, id
        for update
      loop

        exit when v_needed <= 0;

        v_taken := least(v_lot.qty_remaining, v_needed);

        update inventory_lots
        set qty_remaining = qty_remaining - v_taken
        where id = v_lot.id;

        insert into inventory_consumptions(
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
            'item_name', coalesce(v_item_name, 'item'),
            'shortfall', v_needed
          )
        );
      end if;

    end loop;

  end if;


  -- Expense handling retained from 0121.
  if v_batch.expense_transaction_id is not null then

    if p_expense is null then

      delete from finance_transactions
      where id = v_batch.expense_transaction_id;

    else

      v_expense_entity_id := nullif(p_expense->>'entity_id','')::uuid;
      v_expense_date := (p_expense->>'occurred_at')::date;
      v_project_id := null;

      if v_expense_entity_id is not null then
        select project_id
          into v_project_id
        from farm_project_entities
        where entity_id = v_expense_entity_id
          and started_at <= v_expense_date
          and (ended_at is null or v_expense_date < ended_at)
        order by started_at desc
        limit 1;
      end if;

      update finance_transactions
      set type = 'expense',
          amount = (p_expense->>'amount')::numeric,
          category = p_expense->>'category',
          project_id = v_project_id,
          entity_id = v_expense_entity_id,
          occurred_at = v_expense_date,
          notes = p_expense->>'notes'
      where id = v_batch.expense_transaction_id;

    end if;

    if p_expense is null then
      v_expense_id := null;
    else
      v_expense_id := v_batch.expense_transaction_id;
    end if;

  elsif p_expense is not null then

    v_expense_entity_id := nullif(p_expense->>'entity_id','')::uuid;
    v_expense_date := (p_expense->>'occurred_at')::date;
    v_project_id := null;

    if v_expense_entity_id is not null then
      select project_id
        into v_project_id
      from farm_project_entities
      where entity_id = v_expense_entity_id
        and started_at <= v_expense_date
        and (ended_at is null or v_expense_date < ended_at)
      order by started_at desc
      limit 1;
    end if;

    insert into finance_transactions(
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
    )
    returning id into v_expense_id;

  end if;


  -- Content handling retained from 0121.
  if v_batch.content_item_id is not null then

    if p_content is null then

      delete from content_items
      where id = v_batch.content_item_id;

      v_content_id := null;

    else

      update content_items
      set title = p_content->>'title',
          type = coalesce(p_content->>'type','mixed'),
          stage = coalesce(p_content->>'stage','idea'),
          notes = p_content->>'notes',
          occurred_at = coalesce(
            nullif(p_content->>'occurred_at','')::date,
            current_date
          )
      where id = v_batch.content_item_id;

      v_content_id := v_batch.content_item_id;

    end if;

  elsif p_content is not null then

    insert into content_items(
      title,
      type,
      stage,
      notes,
      occurred_at
    )
    values (
      p_content->>'title',
      coalesce(p_content->>'type','mixed'),
      coalesce(p_content->>'stage','idea'),
      p_content->>'notes',
      coalesce(
        nullif(p_content->>'occurred_at','')::date,
        current_date
      )
    )
    returning id into v_content_id;

  end if;


  update daily_log_batches
  set log_date = coalesce(
        nullif(p_events->0->>'occurred_at','')::date,
        nullif(p_expense->>'occurred_at','')::date,
        nullif(p_content->>'occurred_at','')::date,
        log_date
      ),
      event_ids = v_new_ids,
      event_data = p_events,
      expense_transaction_id = v_expense_id,
      expense_data = p_expense,
      content_item_id = v_content_id,
      content_data = p_content,
      updated_at = now()
  where id = p_batch_id;

  return jsonb_build_object(
    'shortfalls', v_shortfalls,
    'batch_id', p_batch_id
  );

end;
$function$;


-- ============================================================
-- 4. PERMISSIONS
-- ============================================================

revoke all on function public.process_daily_log(jsonb,jsonb,jsonb)
  from public;

revoke all on function public.edit_daily_log(uuid,jsonb,jsonb,jsonb)
  from public;

grant execute on function public.process_daily_log(jsonb,jsonb,jsonb)
  to authenticated;

grant execute on function public.edit_daily_log(uuid,jsonb,jsonb,jsonb)
  to authenticated;

commit;
