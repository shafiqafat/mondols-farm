-- 0127_general_purpose_sales.sql
-- General-purpose sales: entity-linked or project-only sales, separate
-- commercial quantity from optional source-stock quantity, preserve Finance link.

begin;

alter table public.sales
  alter column entity_id drop not null;

alter table public.sales
  add column if not exists product_name text,
  add column if not exists pricing_method text not null default 'quantity',
  add column if not exists sale_quantity numeric,
  add column if not exists sale_unit text,
  add column if not exists stock_quantity numeric,
  add column if not exists stock_unit text;

-- Backfill existing sales without changing their generated revenue.
update public.sales s
set sale_quantity = coalesce(s.sale_quantity, s.quantity),
    sale_unit = coalesce(nullif(s.sale_unit, ''), s.unit),
    product_name = coalesce(
      nullif(s.product_name, ''),
      (select fe.label from public.farm_entities fe where fe.id = s.entity_id),
      'Farm product'
    ),
    pricing_method = coalesce(nullif(s.pricing_method, ''), 'quantity');

alter table public.sales
  alter column sale_quantity set not null,
  alter column sale_unit set not null,
  alter column product_name set not null;

alter table public.sales
  add constraint sales_pricing_method_check
    check (pricing_method in ('quantity', 'weight', 'fixed')),
  add constraint sales_sale_quantity_positive_check
    check (sale_quantity > 0),
  add constraint sales_stock_quantity_nonnegative_check
    check (stock_quantity is null or stock_quantity >= 0),
  add constraint sales_source_check
    check (entity_id is not null or project_id is not null);

create index if not exists sales_product_name_idx
  on public.sales(product_name);

-- Keep legacy columns quantity/unit synchronized for existing reports/code.
create or replace function public.sync_sales_quantity_compatibility()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if tg_op = 'INSERT' then
    new.quantity := coalesce(new.sale_quantity, new.quantity);
    new.unit := coalesce(nullif(new.sale_unit, ''), new.unit);
    new.sale_quantity := new.quantity;
    new.sale_unit := new.unit;
  else
    if new.sale_quantity is distinct from old.sale_quantity then
      new.quantity := new.sale_quantity;
    elsif new.quantity is distinct from old.quantity then
      new.sale_quantity := new.quantity;
    end if;

    if new.sale_unit is distinct from old.sale_unit then
      new.unit := new.sale_unit;
    elsif new.unit is distinct from old.unit then
      new.sale_unit := new.unit;
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists sales_quantity_compatibility on public.sales;
create trigger sales_quantity_compatibility
before insert or update on public.sales
for each row execute function public.sync_sales_quantity_compatibility();

-- Remove the previous signatures so PostgREST does not see ambiguous RPCs.
drop function if exists public.record_sale(uuid, numeric, text, numeric, numeric, text, date, text);
drop function if exists public.update_sale(uuid, numeric, text, numeric, numeric, text, date, text);

create function public.record_sale(
  p_entity_id uuid default null,
  p_quantity numeric default null,
  p_unit text default null,
  p_unit_price numeric default 0,
  p_discount numeric default 0,
  p_customer_name text default null,
  p_sold_at date default current_date,
  p_notes text default null,
  p_project_id uuid default null,
  p_product_name text default null,
  p_stock_quantity numeric default null,
  p_stock_unit text default null,
  p_pricing_method text default 'quantity',
  p_sale_quantity numeric default null,
  p_sale_unit text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $function$
declare
  v_project_id uuid;
  v_sale_id uuid;
  v_total numeric;
  v_sale_quantity numeric;
  v_sale_unit text;
  v_product_name text;
begin
  if not public.farm_can_write() then
    raise exception 'Write access denied';
  end if;

  v_sale_quantity := coalesce(p_sale_quantity, p_quantity);
  v_sale_unit := coalesce(nullif(trim(p_sale_unit), ''), nullif(trim(p_unit), ''));

  if v_sale_quantity is null or v_sale_quantity <= 0 then
    raise exception 'Sale quantity must be greater than zero';
  end if;
  if v_sale_unit is null then
    raise exception 'Sale unit is required';
  end if;
  if p_unit_price is null or p_unit_price < 0 then
    raise exception 'Unit price cannot be negative';
  end if;
  if p_discount is null or p_discount < 0 then
    raise exception 'Discount cannot be negative';
  end if;
  if p_stock_quantity is not null and p_stock_quantity < 0 then
    raise exception 'Stock quantity cannot be negative';
  end if;
  if coalesce(p_pricing_method, 'quantity') not in ('quantity', 'weight', 'fixed') then
    raise exception 'Invalid pricing method';
  end if;

  if p_entity_id is not null then
    select fe.label into v_product_name
    from public.farm_entities fe
    where fe.id = p_entity_id and fe.status = 'active';
    if not found then
      raise exception 'Active farm entity not found';
    end if;

    -- Historical entity-project assignment is authoritative when present.
    select fpe.project_id into v_project_id
    from public.farm_project_entities fpe
    where fpe.entity_id = p_entity_id
      and fpe.started_at <= p_sold_at
      and (fpe.ended_at is null or p_sold_at < fpe.ended_at)
    order by fpe.started_at desc
    limit 1;

    v_project_id := coalesce(v_project_id, p_project_id);
  else
    v_project_id := p_project_id;
  end if;

  if v_project_id is null then
    raise exception 'Select a project when recording a sale without a farm entity';
  end if;

  if not exists (select 1 from public.farm_projects where id = v_project_id) then
    raise exception 'Farm project not found';
  end if;

  v_product_name := coalesce(nullif(trim(p_product_name), ''), v_product_name);
  if v_product_name is null then
    raise exception 'Product name is required when no farm entity is selected';
  end if;

  v_total := greatest((v_sale_quantity * p_unit_price) - p_discount, 0);

  insert into public.sales (
    entity_id, project_id, quantity, unit, unit_price, discount,
    customer_name, sold_at, notes, product_name, pricing_method,
    sale_quantity, sale_unit, stock_quantity, stock_unit
  ) values (
    p_entity_id, v_project_id, v_sale_quantity, v_sale_unit,
    p_unit_price, p_discount, p_customer_name, p_sold_at, p_notes,
    v_product_name, coalesce(p_pricing_method, 'quantity'),
    v_sale_quantity, v_sale_unit, p_stock_quantity, nullif(trim(p_stock_unit), '')
  ) returning id into v_sale_id;

  insert into public.finance_transactions (
    type, amount, category, project_id, entity_id,
    occurred_at, notes, sale_id
  ) values (
    'income', v_total, 'Sale', v_project_id, p_entity_id,
    p_sold_at, p_notes, v_sale_id
  );

  return v_sale_id;
end;
$function$;

create function public.update_sale(
  p_sale_id uuid,
  p_quantity numeric default null,
  p_unit text default null,
  p_unit_price numeric default 0,
  p_discount numeric default 0,
  p_customer_name text default null,
  p_sold_at date default current_date,
  p_notes text default null,
  p_entity_id uuid default null,
  p_project_id uuid default null,
  p_product_name text default null,
  p_stock_quantity numeric default null,
  p_stock_unit text default null,
  p_pricing_method text default 'quantity',
  p_sale_quantity numeric default null,
  p_sale_unit text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $function$
declare
  v_existing public.sales%rowtype;
  v_project_id uuid;
  v_product_name text;
  v_sale_quantity numeric;
  v_sale_unit text;
  v_total numeric;
begin
  if not public.farm_can_write() then
    raise exception 'Write access denied';
  end if;

  select * into v_existing
  from public.sales
  where id = p_sale_id
  for update;
  if not found then
    raise exception 'Sale not found';
  end if;

  v_sale_quantity := coalesce(p_sale_quantity, p_quantity, v_existing.sale_quantity);
  v_sale_unit := coalesce(nullif(trim(p_sale_unit), ''), nullif(trim(p_unit), ''), v_existing.sale_unit);

  if v_sale_quantity <= 0 then raise exception 'Sale quantity must be greater than zero'; end if;
  if v_sale_unit is null then raise exception 'Sale unit is required'; end if;
  if p_unit_price < 0 then raise exception 'Unit price cannot be negative'; end if;
  if p_discount < 0 then raise exception 'Discount cannot be negative'; end if;
  if p_stock_quantity is not null and p_stock_quantity < 0 then raise exception 'Stock quantity cannot be negative'; end if;
  if coalesce(p_pricing_method, v_existing.pricing_method) not in ('quantity', 'weight', 'fixed') then raise exception 'Invalid pricing method'; end if;

  if p_entity_id is not null then
    select fe.label into v_product_name
    from public.farm_entities fe
    where fe.id = p_entity_id;
    if not found then raise exception 'Farm entity not found'; end if;

    select fpe.project_id into v_project_id
    from public.farm_project_entities fpe
    where fpe.entity_id = p_entity_id
      and fpe.started_at <= p_sold_at
      and (fpe.ended_at is null or p_sold_at < fpe.ended_at)
    order by fpe.started_at desc
    limit 1;
    v_project_id := coalesce(v_project_id, p_project_id);
  else
    v_project_id := p_project_id;
  end if;

  v_project_id := coalesce(v_project_id, v_existing.project_id);
  if v_project_id is null then raise exception 'A project is required when no entity is selected'; end if;
  if not exists (select 1 from public.farm_projects where id = v_project_id) then raise exception 'Farm project not found'; end if;

  v_product_name := coalesce(nullif(trim(p_product_name), ''), v_product_name, v_existing.product_name);
  if v_product_name is null then raise exception 'Product name is required'; end if;
  v_total := greatest((v_sale_quantity * p_unit_price) - p_discount, 0);

  update public.sales set
    entity_id = p_entity_id,
    project_id = v_project_id,
    quantity = v_sale_quantity,
    unit = v_sale_unit,
    sale_quantity = v_sale_quantity,
    sale_unit = v_sale_unit,
    product_name = v_product_name,
    pricing_method = coalesce(p_pricing_method, v_existing.pricing_method),
    stock_quantity = p_stock_quantity,
    stock_unit = nullif(trim(p_stock_unit), ''),
    unit_price = p_unit_price,
    discount = p_discount,
    customer_name = p_customer_name,
    sold_at = p_sold_at,
    notes = p_notes
  where id = p_sale_id;

  update public.finance_transactions set
    amount = v_total,
    project_id = v_project_id,
    entity_id = p_entity_id,
    occurred_at = p_sold_at,
    notes = p_notes
  where sale_id = p_sale_id and type = 'income';

  if not found then raise exception 'Linked Finance transaction not found'; end if;
end;
$function$;

-- Delete RPC remains compatible with the existing UI and Finance relationship.
create or replace function public.delete_sale(p_sale_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $function$
begin
  if not public.farm_can_write() then raise exception 'Write access denied'; end if;
  if not exists (select 1 from public.sales where id = p_sale_id) then
    raise exception 'Sale not found';
  end if;
  delete from public.finance_transactions where sale_id = p_sale_id and type = 'income';
  delete from public.sales where id = p_sale_id;
  if not found then raise exception 'Sale could not be deleted'; end if;
end;
$function$;

revoke all on function public.record_sale(uuid,numeric,text,numeric,numeric,text,date,text,uuid,text,numeric,text,text,numeric,text) from public;
revoke all on function public.update_sale(uuid,numeric,text,numeric,numeric,text,date,text,uuid,uuid,text,numeric,text,text,numeric,text) from public;
revoke all on function public.delete_sale(uuid) from public;
grant execute on function public.record_sale(uuid,numeric,text,numeric,numeric,text,date,text,uuid,text,numeric,text,text,numeric,text) to authenticated;
grant execute on function public.update_sale(uuid,numeric,text,numeric,numeric,text,date,text,uuid,uuid,text,numeric,text,text,numeric,text) to authenticated;
grant execute on function public.delete_sale(uuid) to authenticated;

commit;
