-- ============================================================
-- 0004_universal_entity_model.sql
-- Universal Farm Entity Model
--
-- Adds:
--   - variants
--   - tracking modes
--   - entity codes
--   - entity names
--
-- Existing entity UUIDs and historical events are preserved.
-- ============================================================

-- This table must exist before farm_entities can reference it. Earlier
-- versions assumed it had been created manually, so a clean migration failed.
create table if not exists public.species_variants (
  id uuid primary key default gen_random_uuid(),
  species_config_id uuid not null references public.species_config(id),
  name text not null,
  variant_type text not null default 'other',
  created_at timestamptz not null default now(),
  unique (species_config_id, name)
);

alter table public.species_variants enable row level security;

create policy "authenticated_full_access_species_variants" on public.species_variants
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');


-- ------------------------------------------------------------
-- 1. Add universal entity fields
-- ------------------------------------------------------------

alter table public.farm_entities
  add column if not exists variant_id uuid
    references public.species_variants(id);

alter table public.farm_entities
  add column if not exists tracking_mode text
    not null default 'group';

alter table public.farm_entities
  add column if not exists entity_code text;

alter table public.farm_entities
  add column if not exists entity_name text;


-- ------------------------------------------------------------
-- 2. Validate tracking mode
-- ------------------------------------------------------------

alter table public.farm_entities
  drop constraint if exists farm_entities_tracking_mode_check;

alter table public.farm_entities
  add constraint farm_entities_tracking_mode_check
  check (
    tracking_mode in (
      'individual',
      'group',
      'area'
    )
  );


-- ------------------------------------------------------------
-- 3. Create known variants
--
-- We only create variants that we actually know from the
-- existing farm data.
-- ------------------------------------------------------------

insert into public.species_variants (
  species_config_id,
  name,
  variant_type
)
select
  s.id,
  'Deshi',
  'breed'
from public.species_config s
where s.name = 'Deshi Chicken'
  and not exists (
    select 1
    from public.species_variants v
    where v.species_config_id = s.id
      and v.name = 'Deshi'
  );


insert into public.species_variants (
  species_config_id,
  name,
  variant_type
)
select
  s.id,
  'Black Bengal',
  'breed'
from public.species_config s
where s.name = 'Black Bengal Goat'
  and not exists (
    select 1
    from public.species_variants v
    where v.species_config_id = s.id
      and v.name = 'Black Bengal'
  );


-- ------------------------------------------------------------
-- 4. Connect existing entities to known variants
-- ------------------------------------------------------------

update public.farm_entities e
set variant_id = v.id
from public.species_config s
join public.species_variants v
  on v.species_config_id = s.id
where e.species_config_id = s.id
  and s.name = 'Deshi Chicken'
  and v.name = 'Deshi';


update public.farm_entities e
set variant_id = v.id
from public.species_config s
join public.species_variants v
  on v.species_config_id = s.id
where e.species_config_id = s.id
  and s.name = 'Black Bengal Goat'
  and v.name = 'Black Bengal';


-- ------------------------------------------------------------
-- 5. Set appropriate tracking modes
-- ------------------------------------------------------------

update public.farm_entities e
set tracking_mode = 'group'
from public.species_config s
where e.species_config_id = s.id
  and s.name in ('Deshi Chicken', 'Quail');


update public.farm_entities e
set tracking_mode = 'individual'
from public.species_config s
where e.species_config_id = s.id
  and s.name = 'Black Bengal Goat';


update public.farm_entities e
set tracking_mode = 'area'
from public.species_config s
where e.species_config_id = s.id
  and s.name in ('Mustard', 'Napier');


-- ------------------------------------------------------------
-- 6. Preserve existing labels as entity names
--
-- label remains untouched for backwards compatibility.
-- entity_name becomes the new semantic field.
-- ------------------------------------------------------------

update public.farm_entities
set entity_name = label
where entity_name is null
  and label is not null;


-- ------------------------------------------------------------
-- 7. Assign stable entity codes
--
-- These are initial codes only.
-- They are intentionally NOT globally unique constraints.
-- Future multi-farm architecture should use:
--
--     farm_id + entity_code
--
-- ------------------------------------------------------------

update public.farm_entities e
set entity_code =
  case
    when s.name = 'Deshi Chicken' then 'CHK-001'
    when s.name = 'Black Bengal Goat' then 'GOT-001'
    when s.name = 'Quail' then 'QUA-001'
    when s.name = 'Mustard' then 'MUS-001'
    when s.name = 'Napier' then 'NAP-001'
    else null
  end
from public.species_config s
where e.species_config_id = s.id
  and e.entity_code is null;


-- ------------------------------------------------------------
-- 8. Indexes
-- ------------------------------------------------------------

create index if not exists idx_farm_entities_variant_id
  on public.farm_entities(variant_id);

create index if not exists idx_farm_entities_tracking_mode
  on public.farm_entities(tracking_mode);

create index if not exists idx_farm_entities_entity_code
  on public.farm_entities(entity_code);


-- ------------------------------------------------------------
-- 9. Documentation
-- ------------------------------------------------------------

comment on column public.farm_entities.variant_id is
  'Optional breed, variety, strain, cultivar, or type associated with the entity.';

comment on column public.farm_entities.tracking_mode is
  'How the entity is tracked: individual, group, or area.';

comment on column public.farm_entities.entity_code is
  'Human-friendly farm entity identifier. Multi-farm uniqueness will later be scoped by farm_id.';

comment on column public.farm_entities.entity_name is
  'Human-friendly name of the farm entity.';


-- ============================================================
-- END 0004
-- ============================================================
