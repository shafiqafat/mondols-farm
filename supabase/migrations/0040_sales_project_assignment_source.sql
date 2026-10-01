-- Sales project attribution must come from the historical
-- entity <-> project assignment table, not farm_entities.project_id.

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

  -- Entity must still be active for creating a new sale.
  if not exists (
    select 1
    from public.farm_entities
    where id = p_entity_id
      and status = 'active'
  ) then
    raise exception 'Active farm entity not found';
  end if;

  -- Historical project assignment is the authoritative source.
  select fpe.project_id
    into v_project_id
  from public.farm_project_entities fpe
  where fpe.entity_id = p_entity_id
    and fpe.started_at <= p_sold_at
    and (
      fpe.ended_at is null
      or p_sold_at < fpe.ended_at
    )
  order by fpe.started_at desc
  limit 1;

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

  select entity_id
    into v_entity_id
  from public.sales
  where id = p_sale_id;

  if not found then
    raise exception 'Sale not found';
  end if;

  -- Recalculate project from assignment history using
  -- the sale's entity and its new sale date.
  select fpe.project_id
    into v_project_id
  from public.farm_project_entities fpe
  where fpe.entity_id = v_entity_id
    and fpe.started_at <= p_sold_at
    and (
      fpe.ended_at is null
      or p_sold_at < fpe.ended_at
    )
  order by fpe.started_at desc
  limit 1;

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
    notes = p_notes,
    project_id = v_project_id
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