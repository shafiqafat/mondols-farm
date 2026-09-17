-- Roles, immutable audit history, and database-level guardrails.
-- Bootstrap: while no role rows exist, authenticated users retain the original
-- single-admin access. Insert the first farm_user_roles row in Supabase SQL;
-- after that, only an admin can grant or change roles.

create table if not exists public.farm_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'operator', 'viewer')),
  created_at timestamptz not null default now()
);

create or replace function public.farm_can_read()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    not exists (select 1 from farm_user_roles)
    or exists (select 1 from farm_user_roles where user_id = auth.uid())
  );
$$;

create or replace function public.farm_can_write()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (
    not exists (select 1 from farm_user_roles)
    or exists (
      select 1 from farm_user_roles
      where user_id = auth.uid() and role in ('admin', 'operator')
    )
  );
$$;

create or replace function public.farm_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from farm_user_roles where user_id = auth.uid() and role = 'admin');
$$;

alter table public.farm_user_roles enable row level security;
create policy "roles_read_own_or_admin" on public.farm_user_roles for select using (user_id = auth.uid() or farm_is_admin());
create policy "roles_bootstrap_or_admin" on public.farm_user_roles for insert with check (
  (not exists (select 1 from public.farm_user_roles) and user_id = auth.uid()) or farm_is_admin()
);
create policy "roles_admin_manage" on public.farm_user_roles for update using (farm_is_admin()) with check (farm_is_admin());
create policy "roles_admin_remove" on public.farm_user_roles for delete using (farm_is_admin());

-- Replace the old all-authenticated policies with role-aware read/write rules.
do $$
declare t text;
begin
  foreach t in array array[
    'species_config','species_variants','farm_entities','entity_events',
    'inventory_items','inventory_lots','farm_projects','finance_transactions',
    'tasks','crop_rotation_rules','content_items'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "authenticated_full_access_%1$s" on public.%1$I', t);
    execute format('create policy "farmos_read" on public.%I for select using (farm_can_read())', t);
    execute format('create policy "farmos_write" on public.%I for all using (farm_can_write()) with check (farm_can_write())', t);
  end loop;
end $$;

create table if not exists public.farm_audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid references auth.users(id),
  table_name text not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  record_id text,
  before_data jsonb,
  after_data jsonb
);
alter table public.farm_audit_log enable row level security;
create policy "audit_read_admin" on public.farm_audit_log for select using (farm_is_admin());

create or replace function public.write_farm_audit_log()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into farm_audit_log (actor_id, table_name, operation, record_id, before_data, after_data)
  values (
    auth.uid(), TG_TABLE_NAME, TG_OP,
    coalesce(to_jsonb(new)->>'id', to_jsonb(old)->>'id'),
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'species_config','farm_entities','entity_events','inventory_items',
    'inventory_lots','farm_projects','finance_transactions','tasks',
    'crop_rotation_rules','content_items'
  ] loop
    execute format('drop trigger if exists farm_audit_%1$s on public.%1$I', t);
    execute format('create trigger farm_audit_%1$s after insert or update or delete on public.%1$I for each row execute function public.write_farm_audit_log()', t);
  end loop;
end $$;

alter table public.farm_entities add constraint farm_entities_quantity_nonnegative check (quantity is null or quantity >= 0) not valid;
alter table public.inventory_items add constraint inventory_items_safety_stock_nonnegative check (safety_stock is null or safety_stock >= 0) not valid;
alter table public.inventory_items add constraint inventory_items_lead_time_nonnegative check (reorder_lead_time_days is null or reorder_lead_time_days >= 0) not valid;
alter table public.inventory_lots add constraint inventory_lots_quantities_valid check (qty_purchased > 0 and qty_remaining >= 0 and qty_remaining <= qty_purchased) not valid;
alter table public.inventory_lots add constraint inventory_lots_cost_nonnegative check (cost_per_unit >= 0) not valid;
alter table public.finance_transactions add constraint finance_transactions_amount_nonnegative check (amount >= 0) not valid;
alter table public.tasks add constraint tasks_priority_valid check (priority in ('low', 'normal', 'high', 'critical')) not valid;
alter table public.tasks add constraint tasks_recurrence_valid check (recurrence is null or recurrence in ('daily', 'weekly', 'monthly')) not valid;
alter table public.farm_entities add constraint farm_entities_status_valid check (status in ('active', 'sold', 'deceased', 'harvested')) not valid;

create index if not exists idx_entity_events_entity_date on public.entity_events(entity_id, occurred_at desc);
create index if not exists idx_finance_transactions_date on public.finance_transactions(occurred_at desc);
create index if not exists idx_tasks_open_due on public.tasks(due_at) where completed_at is null;
create index if not exists idx_audit_log_table_time on public.farm_audit_log(table_name, occurred_at desc);
