-- 0122 — Conservative editing for historical individual activity events.
-- Historical event rows remain separate from daily_log_batches. This migration
-- does not attempt to infer historical expense/content relationships.

create or replace function public.list_historical_daily_events(p_limit integer default 50)
returns table (
  event_id uuid,
  entity_id uuid,
  entity_label text,
  event_type text,
  payload jsonb,
  occurred_at date,
  has_inventory_consumption boolean
)
language plpgsql
security definer
set search_path = public
as $function$
begin
  if not farm_can_read() then
    raise exception 'You do not have permission to read daily logs';
  end if;

  return query
  select
    ee.id,
    ee.entity_id,
    fe.label::text,
    ee.type::text,
    coalesce(ee.payload, '{}'::jsonb),
    ee.occurred_at::date,
    exists(select 1 from public.inventory_consumptions ic where ic.event_id = ee.id)
  from public.entity_events ee
  left join public.farm_entities fe on fe.id = ee.entity_id
  where not exists (
    select 1
    from public.daily_log_batches b
    where ee.id = any(coalesce(b.event_ids, '{}'::uuid[]))
  )
  order by ee.occurred_at desc, ee.id desc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
end;
$function$;

create or replace function public.edit_historical_daily_event(
  p_event_id uuid,
  p_entity_id uuid,
  p_event_type text,
  p_payload jsonb,
  p_occurred_at date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_old public.entity_events%rowtype;
  v_lot record;
  v_consumption record;
  v_item_id uuid;
  v_item_name text;
  v_needed numeric := 0;
  v_taken numeric := 0;
  v_shortfalls jsonb := '[]'::jsonb;
  v_has_reconciliations boolean := false;
begin
  if not farm_can_write() then
    raise exception 'You do not have permission to edit daily logs';
  end if;
  if p_event_id is null or p_entity_id is null or nullif(trim(p_event_type), '') is null or p_occurred_at is null then
    raise exception 'Event, entity, type, and date are required';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'Activity payload must be a JSON object';
  end if;

  select * into v_old from public.entity_events where id = p_event_id for update;
  if not found then raise exception 'Historical activity not found'; end if;
  if exists (
    select 1 from public.daily_log_batches b
    where p_event_id = any(coalesce(b.event_ids, '{}'::uuid[]))
  ) then
    raise exception 'This activity belongs to an editable daily-log batch; use the batch editor instead';
  end if;

  -- If this event has feed allocations, do not rewrite any reconciled ledger.
  if exists (select 1 from public.inventory_consumptions ic where ic.event_id = p_event_id) then
    if to_regclass('public.inventory_lot_reconciliations') is not null then
      execute $q$
        select exists (
          select 1 from public.inventory_lot_reconciliations r
          where r.lot_id in (
            select distinct ic.lot_id from public.inventory_consumptions ic where ic.event_id = $1
          )
        )
      $q$ into v_has_reconciliations using p_event_id;
      if v_has_reconciliations then
        raise exception 'This activity uses a lot with reconciliation history and cannot be edited safely';
      end if;
    end if;
    if to_regclass('public.inventory_consumption_reconciliations') is not null then
      execute 'select exists(select 1 from public.inventory_consumption_reconciliations)' into v_has_reconciliations;
      if v_has_reconciliations then
        raise exception 'Inventory consumption reconciliation records exist; feed-related historical edits are blocked to protect the ledger';
      end if;
    end if;

    for v_consumption in
      select lot_id, sum(quantity) as qty
      from public.inventory_consumptions
      where event_id = p_event_id
      group by lot_id
    loop
      update public.inventory_lots
      set qty_remaining = qty_remaining + v_consumption.qty
      where id = v_consumption.lot_id;
    end loop;
    delete from public.inventory_consumptions where event_id = p_event_id;
  end if;

  update public.entity_events
  set entity_id = p_entity_id,
      type = trim(p_event_type),
      payload = p_payload,
      occurred_at = p_occurred_at
  where id = p_event_id;

  -- Reapply FIFO stock allocation if the edited event is a feed event.
  if trim(p_event_type) = 'feed_given'
     and nullif(p_payload->>'item_id', '') is not null then
    v_item_id := (p_payload->>'item_id')::uuid;
    v_needed := greatest(coalesce((p_payload->>'qty_kg')::numeric, 0), 0);
    select name into v_item_name from public.inventory_items where id = v_item_id;
    if not found then raise exception 'Selected feed inventory item was not found'; end if;

    for v_lot in
      select id, qty_remaining, cost_per_unit
      from public.inventory_lots
      where item_id = v_item_id and qty_remaining > 0
      order by purchased_at, id
      for update
    loop
      exit when v_needed <= 0;
      v_taken := least(v_lot.qty_remaining, v_needed);
      update public.inventory_lots set qty_remaining = qty_remaining - v_taken where id = v_lot.id;
      insert into public.inventory_consumptions(event_id, item_id, lot_id, quantity, unit_cost, total_cost)
      values(p_event_id, v_item_id, v_lot.id, v_taken, v_lot.cost_per_unit, v_taken * v_lot.cost_per_unit);
      v_needed := v_needed - v_taken;
    end loop;

    if v_needed > 0 then
      v_shortfalls := jsonb_build_array(jsonb_build_object('item_name', coalesce(v_item_name, 'item'), 'shortfall', v_needed));
    end if;
  end if;

  return jsonb_build_object('event_id', p_event_id, 'shortfalls', v_shortfalls);
end;
$function$;

revoke all on function public.list_historical_daily_events(integer) from public;
revoke all on function public.edit_historical_daily_event(uuid, uuid, text, jsonb, date) from public;
grant execute on function public.list_historical_daily_events(integer) to authenticated;
grant execute on function public.edit_historical_daily_event(uuid, uuid, text, jsonb, date) to authenticated;
