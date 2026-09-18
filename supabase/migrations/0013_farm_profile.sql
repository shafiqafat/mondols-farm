-- 0013_farm_profile.sql
--
-- Farm-level profile/configuration.
-- V1 keeps one profile record for the current farm.
-- The schema is intentionally farm-oriented so it can evolve
-- toward multi-farm support later.

create table if not exists public.farm_profile (
  id uuid primary key default gen_random_uuid(),

  name text not null,
  location text,
  contact_email text,
  contact_phone text,
  description text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists farm_profile_singleton_idx
on public.farm_profile ((true));

alter table public.farm_profile enable row level security;

create policy "farm_profile_read"
on public.farm_profile
for select
to authenticated
using (public.farm_can_read());

create policy "farm_profile_insert"
on public.farm_profile
for insert
to authenticated
with check (public.farm_can_write());

create policy "farm_profile_update"
on public.farm_profile
for update
to authenticated
using (public.farm_can_write())
with check (public.farm_can_write());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger farm_profile_updated_at
before update on public.farm_profile
for each row
execute function public.set_updated_at();