-- Inventory lot empty-confirmation and Daily Log measurement reconciliation.
-- Original inventory_consumptions rows remain untouched. Daily Log payloads retain
-- the first-entered value in original_qty_kg and use corrected qty_kg for calculations.

create table if not exists public.inventory_lot_reconciliations (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null unique references public.inventory_lots(id) on delete restrict,
  actual_quantity numeric not null check (actual_quantity > 0),
  recorded_consumption_quantity numeric not null check (recorded_consumption_quantity > 0),
  adjustment_factor numeric not null check (adjustment_factor > 0),
  reconciled_at timestamptz not null default now(),
  reconciled_by uuid references auth.users(id)
);

create table if not exists public.inventory_consumption_reconciliations (
  id uuid primary key default gen_random_uuid(),
  reconciliation_id uuid not null references public.inventory_lot_reconciliations(id) on delete restrict,
  consumption_id uuid not null unique references public.inventory_consumptions(id) on delete restrict,
  lot_id uuid not null references public.inventory_lots(id) on delete restrict,
  event_id uuid not null references public.entity_events(id) on delete restrict,
  original_quantity numeric not null check (original_quantity >= 0),
  reconciled_quantity numeric not null check (reconciled_quantity >= 0),
  adjustment_delta numeric not null,
  created_at timestamptz not null default now()
);

alter table public.inventory_lot_reconciliations enable row level security;
alter table public.inventory_consumption_reconciliations enable row level security;

drop policy if exists "farmos_read" on public.inventory_lot_reconciliations;
create policy "farmos_read" on public.inventory_lot_reconciliations
  for select using (public.farm_can_read());

drop policy if exists "farmos_read" on public.inventory_consumption_reconciliations;
create policy "farmos_read" on public.inventory_consumption_reconciliations
  for select using (public.farm_can_read());

grant select on public.inventory_lot_reconciliations to authenticated;
grant select on public.inventory_consumption_reconciliations to authenticated;

create index if not exists idx_inventory_consumption_reconciliations_event
  on public.inventory_consumption_reconciliations(event_id);
create index if not exists idx_inventory_consumption_reconciliations_lot
  on public.inventory_consumption_reconciliations(lot_id);

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

  select coalesce(sum(ic.quantity), 0)
  into v_recorded
  from public.inventory_consumptions ic
  join public.entity_events e on e.id = ic.event_id
  where ic.lot_id = p_lot_id;

  if v_recorded <= 0 then
    raise exception 'No Daily Log consumption is allocated to this lot yet; reconciliation is not possible';
  end if;

  if v_lot.qty_purchased <= 0 then
    raise exception 'The lot actual quantity must be greater than zero';
  end if;

  v_factor := v_lot.qty_purchased / v_recorded;

  insert into public.inventory_lot_reconciliations (
    lot_id,
    actual_quantity,
    recorded_consumption_quantity,
    adjustment_factor,
    reconciled_by
  )
  values (
    p_lot_id,
    v_lot.qty_purchased,
    v_recorded,
    v_factor,
    auth.uid()
  )
  returning id into v_reconciliation_id;

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
    ic.id,
    ic.lot_id,
    ic.event_id,
    ic.quantity,
    case
      when row_number() over (order by e.occurred_at, ic.id) =
           count(*) over ()
      then
        v_lot.qty_purchased
        - coalesce(
            sum(round(ic.quantity * v_factor, 6)) over (
              order by e.occurred_at, ic.id
              rows between unbounded preceding and 1 preceding
            ),
            0
          )
      else round(ic.quantity * v_factor, 6)
    end,
    case
      when row_number() over (order by e.occurred_at, ic.id) =
           count(*) over ()
      then
        (
          v_lot.qty_purchased
          - coalesce(
              sum(round(ic.quantity * v_factor, 6)) over (
                order by e.occurred_at, ic.id
                rows between unbounded preceding and 1 preceding
              ),
              0
            )
        ) - ic.quantity
      else round(ic.quantity * v_factor, 6) - ic.quantity
    end
  from public.inventory_consumptions ic
  join public.entity_events e on e.id = ic.event_id
  where ic.lot_id = p_lot_id;

  get diagnostics v_count = row_count;

  /*
    Update the effective Daily Log feed quantity for every affected event.
    Preserve the first-entered quantity in payload.original_qty_kg.
    For events split across several lots, corrected and uncorrected allocations
    are combined. Any originally unallocated shortfall is retained as-is.
  */
  with affected_events as (
    select distinct ic.event_id
    from public.inventory_consumptions ic
    where ic.lot_id = p_lot_id
  ),
  event_totals as (
    select
      ic.event_id,
      sum(ic.quantity) as recorded_allocations,
      sum(coalesce(icr.reconciled_quantity, ic.quantity)) as effective_allocations
    from public.inventory_consumptions ic
    left join public.inventory_consumption_reconciliations icr
      on icr.consumption_id = ic.id
    where ic.event_id in (select event_id from affected_events)
    group by ic.event_id
  )
  update public.entity_events ee
  set payload = jsonb_set(
    jsonb_set(
      coalesce(ee.payload, '{}'::jsonb),
      '{original_qty_kg}',
      to_jsonb(
        coalesce(
          nullif(ee.payload->>'original_qty_kg', '')::numeric,
          nullif(ee.payload->>'qty_kg', '')::numeric,
          0
        )
      ),
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

  -- The lot is physically empty, so its remaining balance is zero.
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
