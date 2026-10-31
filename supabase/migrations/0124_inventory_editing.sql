-- FarmOS migration 0124
-- Safe inventory purchase-lot editing.
-- A lot can only be edited before any consumption or reconciliation exists.
-- The linked Finance expense is updated in the same database transaction.

create or replace function public.edit_inventory_purchase(
  p_lot_id uuid,
  p_qty numeric,
  p_cost_per_unit numeric,
  p_purchased_at date
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

  select *
    into v_lot
  from public.inventory_lots
  where id = p_lot_id
  for update;

  if not found then
    raise exception 'Inventory purchase lot not found';
  end if;

  select name
    into v_item_name
  from public.inventory_items
  where id = v_lot.item_id;

  if exists (
    select 1
    from public.inventory_consumptions
    where lot_id = p_lot_id
  ) then
    raise exception 'This purchase cannot be edited because stock from it has consumption history. Preserve the audit trail and correct the related Daily Log instead.';
  end if;

  if exists (
    select 1 from public.inventory_lot_reconciliations
    where lot_id = p_lot_id
  ) or exists (
    select 1 from public.inventory_consumption_reconciliations
    where lot_id = p_lot_id
  ) then
    raise exception 'This purchase cannot be edited because it has reconciliation history.';
  end if;

  -- A never-consumed lot must still have its full purchased quantity.
  -- Do not silently reset a manually adjusted stock balance.
  if v_lot.qty_remaining is distinct from v_lot.qty_purchased then
    raise exception 'This purchase cannot be edited because its remaining stock differs from its purchased quantity.';
  end if;

  select id
    into v_transaction_id
  from public.finance_transactions
  where inventory_lot_id = p_lot_id
    and type = 'expense'
  for update;

  if v_transaction_id is null
     or (select count(*) from public.finance_transactions where inventory_lot_id = p_lot_id) <> 1 then
    raise exception 'This purchase does not have exactly one safely linked Finance expense. No changes were made.';
  end if;

  update public.inventory_lots
  set qty_purchased = p_qty,
      qty_remaining = p_qty,
      cost_per_unit = p_cost_per_unit,
      purchased_at = p_purchased_at
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
    'purchase_date', p_purchased_at
  );
end;
$function$;

revoke all on function public.edit_inventory_purchase(uuid, numeric, numeric, date) from public;
grant execute on function public.edit_inventory_purchase(uuid, numeric, numeric, date) to authenticated;
