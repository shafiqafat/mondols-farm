-- Reconcile sale-linked finance schema with the current live database.

alter table public.finance_transactions
  add column if not exists sale_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'finance_transactions_sale_id_fkey'
      and conrelid = 'public.finance_transactions'::regclass
  ) then
    alter table public.finance_transactions
      add constraint finance_transactions_sale_id_fkey
      foreign key (sale_id)
      references public.sales(id)
      on delete restrict;
  end if;
end
$$;
-- Reconcile Sales RPCs with the current live database.
-- This migration restores the database functions required by the
-- Sales UI and keeps sale-linked finance transactions synchronized.

create or replace function public.record_sale(
  p_entity_id uuid,
  p_quantity numeric,
  p_unit text,
  p_unit_price numeric,
  p_discount numeric default 0,
  p_customer_name text default null,
  p_sold_at date default current_date,
  p_notes text default null
)
returns uuid
language plpgsql
set search_path to 'public'
as $function$
declare
  v_project_id uuid;
  v_sale_id uuid;
  v_total numeric;
begin
  if not public.farm_can_write() then
    raise exception 'Write access denied';
  end if;

  if p_quantity <= 0 then
    raise exception 'Quantity must be positive';
  end if;

  if p_unit_price < 0 then
    raise exception 'Unit price cannot be negative';
  end if;

  if p_discount < 0 then
    raise exception 'Discount cannot be negative';
  end if;

  select project_id
    into v_project_id
  from public.farm_entities
  where id = p_entity_id
    and status = 'active';

  if not found then
    raise exception 'Active farm entity not found';
  end if;

  v_total := greatest(
    (p_quantity * p_unit_price) - p_discount,
    0
  );

  insert into public.sales (
    entity_id,
    project_id,
    quantity,
    unit,
    unit_price,
    discount,
    customer_name,
    sold_at,
    notes
  )
  values (
    p_entity_id,
    v_project_id,
    p_quantity,
    p_unit,
    p_unit_price,
    p_discount,
    p_customer_name,
    p_sold_at,
    p_notes
  )
  returning id into v_sale_id;

  insert into public.finance_transactions (
    type,
    amount,
    category,
    project_id,
    entity_id,
    occurred_at,
    notes,
    sale_id
  )
  values (
    'income',
    v_total,
    'Sale',
    v_project_id,
    p_entity_id,
    p_sold_at,
    p_notes,
    v_sale_id
  );

  return v_sale_id;
end;
$function$;


create or replace function public.update_sale(
  p_sale_id uuid,
  p_quantity numeric,
  p_unit text,
  p_unit_price numeric,
  p_discount numeric default 0,
  p_customer_name text default null,
  p_sold_at date default current_date,
  p_notes text default null
)
returns void
language plpgsql
set search_path to 'public'
as $function$
declare
  v_entity_id uuid;
  v_project_id uuid;
  v_total numeric;
begin
  if not public.farm_can_write() then
    raise exception 'Write access denied';
  end if;

  if p_quantity <= 0 then
    raise exception 'Quantity must be positive';
  end if;

  if p_unit_price < 0 then
    raise exception 'Unit price cannot be negative';
  end if;

  if p_discount < 0 then
    raise exception 'Discount cannot be negative';
  end if;

  select
    entity_id,
    project_id
  into
    v_entity_id,
    v_project_id
  from public.sales
  where id = p_sale_id;

  if not found then
    raise exception 'Sale not found';
  end if;

  v_total := greatest(
    (p_quantity * p_unit_price) - p_discount,
    0
  );

  update public.sales
  set
    quantity = p_quantity,
    unit = p_unit,
    unit_price = p_unit_price,
    discount = p_discount,
    customer_name = p_customer_name,
    sold_at = p_sold_at,
    notes = p_notes
  where id = p_sale_id;

  update public.finance_transactions
  set
    amount = v_total,
    project_id = v_project_id,
    entity_id = v_entity_id,
    occurred_at = p_sold_at,
    notes = p_notes
  where sale_id = p_sale_id
    and type = 'income';

  if not found then
    raise exception 'Linked Finance transaction not found';
  end if;
end;
$function$;


create or replace function public.delete_sale(
  p_sale_id uuid
)
returns void
language plpgsql
set search_path to 'public'
as $function$
declare
  v_sale_exists boolean;
begin
  if not public.farm_can_write() then
    raise exception 'Write access denied';
  end if;

  select exists (
    select 1
    from public.sales
    where id = p_sale_id
  )
  into v_sale_exists;

  if not v_sale_exists then
    raise exception 'Sale not found';
  end if;

  delete from public.finance_transactions
  where sale_id = p_sale_id
    and type = 'income';

  delete from public.sales
  where id = p_sale_id;

  if not found then
    raise exception 'Sale could not be deleted';
  end if;
end;
$function$;