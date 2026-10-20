-- FarmOS migration 0119
-- Harden empty-lot reconciliation against reversed/non-feed Daily Log events.
-- The lot's recorded purchased quantity is treated as the actual quantity
-- available in that storage. Clicking "Mark Storage Empty" confirms all of it
-- was used. Original inventory_consumptions rows are retained for audit.

create or replace function public.confirm_inventory_lot_empty(p_lot_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_lot public.inventory_lots%rowtype;
  v_recorded numeric;
  v_factor numeric;
  v_reconciliation_id uuid;
  v_count integer;
begin
  if not public.farm_can_write() then
    raise exception 'Write access denied';
  end if;

  if p_lot_id is null then
    raise exception 'Inventory lot is required';
  end if;

  select *
    into v_lot
  from public.inventory_lots
  where id = p_lot_id
  for update;

  if not found then
    raise exception 'Inventory lot not found';
  end if;

  if exists (
    select 1
    from public.inventory_lot_reconciliations
    where lot_id = p_lot_id
  ) then
    raise exception 'This inventory lot has already been reconciled';
  end if;

  if v_lot.qty_purchased is null or v_lot.qty_purchased <= 0 then
    raise exception 'The lot purchased quantity must be greater than zero';
  end if;

  -- Only active feed_given events count toward this reconciliation.
  select coalesce(sum(ic.quantity), 0)
    into v_recorded
  from public.inventory_consumptions ic
  join public.entity_events e on e.id = ic.event_id
  where ic.lot_id = p_lot_id
    and e.type = 'feed_given'
    and e.reversed_at is null;

  if v_recorded <= 0 then
    raise exception 'No active Daily Log feed consumption is allocated to this lot yet; reconciliation is not possible';
  end if;

  -- The button confirms the whole purchased lot was physically used.
  v_factor := v_lot.qty_purchased / v_recorded;

  insert into public.inventory_lot_reconciliations (
    lot_id,
    actual_quantity,
    recorded_consumption_quantity,
    adjustment_factor,
    reconciled_by
  ) values (
    p_lot_id,
    v_lot.qty_purchased,
    v_recorded,
    v_factor,
    auth.uid()
  )
  returning id into v_reconciliation_id;

  -- Store corrected per-lot allocations separately; retain the original
  -- inventory_consumptions rows as the audit record.
  with eligible as (
    select
      ic.id as consumption_id,
      ic.lot_id,
      ic.event_id,
      ic.quantity,
      e.occurred_at,
      row_number() over (order by e.occurred_at, ic.id) as rn,
      count(*) over () as row_count
    from public.inventory_consumptions ic
    join public.entity_events e on e.id = ic.event_id
    where ic.lot_id = p_lot_id
      and e.type = 'feed_given'
      and e.reversed_at is null
  ), scaled as (
    select
      eligible.*,
      case
        when rn = row_count then
          v_lot.qty_purchased - coalesce(
            sum(round(quantity * v_factor, 6)) over (
              order by occurred_at, consumption_id
              rows between unbounded preceding and 1 preceding
            ), 0
          )
        else round(quantity * v_factor, 6)
      end as corrected_quantity
    from eligible
  )
  insert into public.inventory_consumption_reconciliations (
    reconciliation_id,
    consumption_id,
    lot_id,
    event_id,
    original_quantity,
    reconciled_quantity,
    adjustment_delta
  )
  select
    v_reconciliation_id,
    consumption_id,
    lot_id,
    event_id,
    quantity,
    corrected_quantity,
    corrected_quantity - quantity
  from scaled;

  get diagnostics v_count = row_count;

  -- Recompute effective event quantities from the preserved original entry and
  -- all lot allocations, mixing reconciled allocations with untouched ones.
  -- This supports a single Daily Log event drawing from multiple lots.
  with affected_events as (
    select distinct ic.event_id
    from public.inventory_consumptions ic
    join public.entity_events e on e.id = ic.event_id
    where ic.lot_id = p_lot_id
      and e.type = 'feed_given'
      and e.reversed_at is null
  ),
  event_totals as (
    select
      ic.event_id,
      sum(ic.quantity) as recorded_allocations,
      sum(coalesce(icr.reconciled_quantity, ic.quantity)) as effective_allocations
    from public.inventory_consumptions ic
    join public.entity_events e on e.id = ic.event_id
    left join public.inventory_consumption_reconciliations icr
      on icr.consumption_id = ic.id
    where ic.event_id in (select event_id from affected_events)
      and e.type = 'feed_given'
      and e.reversed_at is null
    group by ic.event_id
  )
  update public.entity_events ee
  set payload = jsonb_set(
    jsonb_set(
      coalesce(ee.payload, '{}'::jsonb),
      '{original_qty_kg}',
      to_jsonb(coalesce(
        nullif(ee.payload->>'original_qty_kg', '')::numeric,
        nullif(ee.payload->>'qty_kg', '')::numeric,
        0
      )),
      true
    ),
    '{qty_kg}',
    to_jsonb(
      greatest(
        coalesce(
          nullif(ee.payload->>'original_qty_kg', '')::numeric,
          nullif(ee.payload->>'qty_kg', '')::numeric,
          0
        ) - et.recorded_allocations,
        0
      ) + et.effective_allocations
    ),
    true
  )
  from event_totals et
  where ee.id = et.event_id;

  -- Physical storage is confirmed empty.
  update public.inventory_lots
  set qty_remaining = 0
  where id = p_lot_id;

  return jsonb_build_object(
    'lot_id', p_lot_id,
    'actual_quantity', v_lot.qty_purchased,
    'recorded_consumption_quantity', v_recorded,
    'adjustment_factor', v_factor,
    'adjusted_consumption_rows', v_count,
    'reconciled_at', now()
  );
end;
$function$;

revoke all on function public.confirm_inventory_lot_empty(uuid) from public;
grant execute on function public.confirm_inventory_lot_empty(uuid) to authenticated;
