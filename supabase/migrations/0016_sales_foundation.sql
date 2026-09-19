create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),

  entity_id uuid not null
    references public.farm_entities(id)
    on delete restrict,

  project_id uuid
    references public.farm_projects(id)
    on delete restrict,

  quantity numeric not null
    check (quantity > 0),

  unit text not null,

  unit_price numeric not null
    check (unit_price >= 0),

  discount numeric not null default 0
    check (discount >= 0),

  total_amount numeric generated always as (
    greatest((quantity * unit_price) - discount, 0)
  ) stored,

  customer_name text,

  sold_at date not null default current_date,

  notes text,

  created_at timestamptz not null default now()
);

create index if not exists sales_entity_idx
  on public.sales(entity_id);

create index if not exists sales_project_idx
  on public.sales(project_id);

create index if not exists sales_sold_at_idx
  on public.sales(sold_at desc);

alter table public.sales enable row level security;

create policy "sales_select"
on public.sales
for select
to authenticated
using (public.farm_can_read());

create policy "sales_insert"
on public.sales
for insert
to authenticated
with check (public.farm_can_write());

create policy "sales_update"
on public.sales
for update
to authenticated
using (public.farm_can_write())
with check (public.farm_can_write());

create policy "sales_delete"
on public.sales
for delete
to authenticated
using (public.farm_can_write());