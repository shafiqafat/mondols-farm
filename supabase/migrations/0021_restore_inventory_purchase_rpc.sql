create or replace function public.record_inventory_purchase(
  p_item_id uuid,
  p_qty numeric,
  p_cost_per_unit numeric,
  p_purchased_at date default current_date
)
returns void
language plpgsql
set search_path = public
as $function$
declare
  v_item_name text;
begin
  if not public.farm_can_write() then
    raise exception 'Write access denied';
  end if;

  if p_qty <= 0 then
    raise exception 'Quantity must be positive';
  end if;

  if p_cost_per_unit < 0 then
    raise exception 'Cost per unit cannot be negative';
  end if;

  select name
  into v_item_name
  from public.inventory_items
  where id = p_item_id;

  if v_item_name is null then
    raise exception 'Inventory item not found';
  end if;

  insert into public.inventory_lots (
    item_id,
    qty_purchased,
    qty_remaining,
    cost_per_unit,
    purchased_at
  )
  values (
    p_item_id,
    p_qty,
    p_qty,
    p_cost_per_unit,
    coalesce(p_purchased_at, current_date)
  );

  insert into public.finance_transactions (
    type,
    amount,
    category,
    occurred_at
  )
  values (
    'expense',
    p_qty * p_cost_per_unit,
    v_item_name,
    coalesce(p_purchased_at, current_date)
  );
end;
$function$;