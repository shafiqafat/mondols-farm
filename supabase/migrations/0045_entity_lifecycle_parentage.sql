-- 0045_entity_lifecycle_parentage.sql
--
-- Entity lifecycle and optional parentage.
--
-- This intentionally keeps lifecycle/lineage separate from farm_entities.
-- farm_entities remains the core identity record.

begin;

-- ============================================================
-- 1. ENTITY LIFECYCLE
-- ============================================================

create table if not exists public.entity_lifecycle (
  entity_id uuid primary key
    references public.farm_entities(id)
    on delete cascade,

  origin_type text not null default 'other'
    check (
      origin_type in (
        'purchased',
        'born_on_farm',
        'transferred',
        'other'
      )
    ),

  birth_date date,
  birth_date_precision text not null default 'unknown'
    check (
      birth_date_precision in (
        'exact',
        'estimated',
        'unknown'
      )
    ),

  age_at_acquisition_days integer
    check (
      age_at_acquisition_days is null
      or age_at_acquisition_days >= 0
    ),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint entity_lifecycle_birth_precision_check
    check (
      birth_date is not null
      or birth_date_precision = 'unknown'
    )
);

create index if not exists idx_entity_lifecycle_origin
  on public.entity_lifecycle(origin_type);


-- ============================================================
-- 2. ENTITY PARENTAGE
-- ============================================================

create table if not exists public.entity_parentage (
  id uuid primary key default gen_random_uuid(),

  child_entity_id uuid not null
    references public.farm_entities(id)
    on delete cascade,

  parent_role text not null
    check (
      parent_role in (
        'mother',
        'father'
      )
    ),

  parent_type text not null
    check (
      parent_type in (
        'farm_entity',
        'external',
        'unknown',
        'not_recorded'
      )
    ),

  parent_entity_id uuid
    references public.farm_entities(id)
    on delete set null,

  external_reference text,

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One mother and one father maximum per child.
  constraint entity_parentage_unique_role
    unique (child_entity_id, parent_role),

  -- Farm entity parent requires a farm entity reference.
  constraint entity_parentage_farm_parent_check
    check (
      (
        parent_type = 'farm_entity'
        and parent_entity_id is not null
      )
      or
      (
        parent_type <> 'farm_entity'
      )
    ),

  -- External parent can optionally have an external reference.
  constraint entity_parentage_external_check
    check (
      parent_type <> 'external'
      or external_reference is not null
  ),

  -- Non-external parents should not have an external reference.
  constraint entity_parentage_external_reference_check
    check (
      parent_type = 'external'
      or external_reference is null
    )
);

create index if not exists idx_entity_parentage_child
  on public.entity_parentage(child_entity_id);

create index if not exists idx_entity_parentage_parent
  on public.entity_parentage(parent_entity_id);


-- ============================================================
-- 3. PREVENT AN ENTITY FROM BEING ITS OWN PARENT
-- ============================================================

create or replace function public.validate_entity_parentage()
returns trigger
language plpgsql
as $$
begin
  if new.parent_type = 'farm_entity'
     and new.parent_entity_id = new.child_entity_id then
    raise exception 'An entity cannot be its own parent';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_entity_parentage
on public.entity_parentage;

create trigger trg_validate_entity_parentage
before insert or update
on public.entity_parentage
for each row
execute function public.validate_entity_parentage();


-- ============================================================
-- 4. RLS
-- ============================================================

alter table public.entity_lifecycle enable row level security;
alter table public.entity_parentage enable row level security;


-- Lifecycle

drop policy if exists "entity_lifecycle_read"
on public.entity_lifecycle;

create policy "entity_lifecycle_read"
on public.entity_lifecycle
for select
using (farm_can_read());


drop policy if exists "entity_lifecycle_write"
on public.entity_lifecycle;

create policy "entity_lifecycle_write"
on public.entity_lifecycle
for all
using (farm_can_write())
with check (farm_can_write());


-- Parentage

drop policy if exists "entity_parentage_read"
on public.entity_parentage;

create policy "entity_parentage_read"
on public.entity_parentage
for select
using (farm_can_read());


drop policy if exists "entity_parentage_write"
on public.entity_parentage;

create policy "entity_parentage_write"
on public.entity_parentage
for all
using (farm_can_write())
with check (farm_can_write());


-- ============================================================
-- 5. UPDATED_AT
-- ============================================================

create or replace function public.touch_entity_lifecycle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_entity_lifecycle_updated_at
on public.entity_lifecycle;

create trigger trg_entity_lifecycle_updated_at
before update
on public.entity_lifecycle
for each row
execute function public.touch_entity_lifecycle_updated_at();


create or replace function public.touch_entity_parentage_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_entity_parentage_updated_at
on public.entity_parentage;

create trigger trg_entity_parentage_updated_at
before update
on public.entity_parentage
for each row
execute function public.touch_entity_parentage_updated_at();

commit;