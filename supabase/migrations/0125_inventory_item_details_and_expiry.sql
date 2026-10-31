-- FarmOS migration 0125
-- Extend inventory item metadata and track expiry per purchase lot.
-- Expiry belongs to a lot because different batches of the same item can expire on different dates.

alter table public.inventory_items
  add column if not exists category text not null default 'other',
  add column if not exists description text,
  add column if not exists storage_location text;

alter table public.inventory_lots
  add column if not exists expiry_date date;

comment on column public.inventory_items.category is
  'Inventory classification: seeds, feed, medicine, fertilizer, pesticide, equipment, materials, or other.';
comment on column public.inventory_items.description is
  'Optional description or variety/details for the inventory item.';
comment on column public.inventory_items.storage_location is
  'Optional physical storage location for the inventory item.';
comment on column public.inventory_lots.expiry_date is
  'Optional expiry date for this specific purchased batch/lot.';

-- Replace the old four-argument function with an expiry-aware version.
drop function if exists public.record_inventory_purchase(uuid, numeric, numeric, date);

create or replace function public.record_inventory_purchase(
  p_item_id uuid,
  p_qty numeric,
  p_cost_per_unit numeric,
  p_purchased_at date default current_date,
  p_expiry_date date default null
)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_item_name text;
  v_lot_id uuid;
begin
  if not public.farm_can_write() then
    raise exception 'Write access denied';
  end if;

  if p_item_id is null then
    raise exception 'Inventory item is required';
  end if;
  if p_qty is null or p_qty <= 0 then
    raise exception 'Quantity must be positive';
  end if;
  if p_cost_per_unit is null or p_cost_per_unit < 0 then
    raise exception 'Cost per unit cannot be negative';
  end if;
  if p_expiry_date is not null and p_purchased_at is not null and p_expiry_date < p_purchased_at then
    raise exception 'Expiry date cannot be earlier than purchase date';
  end if;

  select name into v_item_name
  from public.inventory_items
  where id = p_item_id;

  if v_item_name is null then
    raise exception 'Inventory item not found';
  end if;

  insert into public.inventory_lots (
    item_id, qty_purchased, qty_remaining, cost_per_unit, purchased_at, expiry_date
  ) values (
    p_item_id, p_qty, p_qty, p_cost_per_unit,
    coalesce(p_purchased_at, current_date), p_expiry_date
  ) returning id into v_lot_id;

  insert into public.finance_transactions (
    type, amount, category, occurred_at, inventory_lot_id
  ) values (
    'expense', p_qty * p_cost_per_unit, v_item_name,
    coalesce(p_purchased_at, current_date), v_lot_id
  );
end;
$function$;

revoke all on function public.record_inventory_purchase(uuid, numeric, numeric, date, date) from public;
grant execute on function public.record_inventory_purchase(uuid, numeric, numeric, date, date) to authenticated;

-- Replace the previous safe lot editor with expiry-date support.
drop function if exists public.edit_inventory_purchase(uuid, numeric, numeric, date);

create or replace function public.edit_inventory_purchase(
  p_lot_id uuid,
  p_qty numeric,
  p_cost_per_unit numeric,
  p_purchased_at date,
  p_expiry_date date default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_lot public.inventory_lots%rowtype;
  v_item_name text;
  v_transaction_id uuid;
begin
  if not public.farm_can_write() then
    raise exception 'Write access denied';
  end if;
  if p_lot_id is null then
    raise exception 'Inventory purchase lot is required';
  end if;
  if p_qty is null or p_qty <= 0 then
    raise exception 'Purchase quantity must be greater than zero';
  end if;
  if p_cost_per_unit is null or p_cost_per_unit < 0 then
    raise exception 'Cost per unit cannot be negative';
  end if;
  if p_purchased_at is null then
    raise exception 'Purchase date is required';
  end if;
  if p_expiry_date is not null and p_expiry_date < p_purchased_at then
    raise exception 'Expiry date cannot be earlier than purchase date';
  end if;

  select * into v_lot
  from public.inventory_lots
  where id = p_lot_id
  for update;
  if not found then
    raise exception 'Inventory purchase lot not found';
  end if;

  select name into v_item_name
  from public.inventory_items
  where id = v_lot.item_id;

  if exists (select 1 from public.inventory_consumptions where lot_id = p_lot_id) then
    raise exception 'This purchase cannot be edited because stock from it has consumption history. Preserve the audit trail and correct the related Daily Log instead.';
  end if;
  if exists (select 1 from public.inventory_lot_reconciliations where lot_id = p_lot_id)
     or exists (select 1 from public.inventory_consumption_reconciliations where lot_id = p_lot_id) then
    raise exception 'This purchase cannot be edited because it has reconciliation history.';
  end if;
  if v_lot.qty_remaining is distinct from v_lot.qty_purchased then
    raise exception 'This purchase cannot be edited because its remaining stock differs from its purchased quantity.';
  end if;

  select id into v_transaction_id
  from public.finance_transactions
  where inventory_lot_id = p_lot_id and type = 'expense'
  for update;

  if v_transaction_id is null
     or (select count(*) from public.finance_transactions where inventory_lot_id = p_lot_id) <> 1 then
    raise exception 'This purchase does not have exactly one safely linked Finance expense. No changes were made.';
  end if;

  update public.inventory_lots
  set qty_purchased = p_qty,
      qty_remaining = p_qty,
      cost_per_unit = p_cost_per_unit,
      purchased_at = p_purchased_at,
      expiry_date = p_expiry_date
  where id = p_lot_id;

  update public.finance_transactions
  set amount = p_qty * p_cost_per_unit,
      category = v_item_name,
      occurred_at = p_purchased_at
  where id = v_transaction_id
    and inventory_lot_id = p_lot_id
    and type = 'expense';

  if not found then
    raise exception 'The linked Finance expense could not be updated. No changes were committed.';
  end if;

  return jsonb_build_object(
    'lot_id', p_lot_id,
    'finance_transaction_id', v_transaction_id,
    'item_name', v_item_name,
    'quantity', p_qty,
    'cost_per_unit', p_cost_per_unit,
    'amount', p_qty * p_cost_per_unit,
    'purchase_date', p_purchased_at,
    'expiry_date', p_expiry_date
  );
end;
$function$;

revoke all on function public.edit_inventory_purchase(uuid, numeric, numeric, date, date) from public;
grant execute on function public.edit_inventory_purchase(uuid, numeric, numeric, date, date) to authenticated;
