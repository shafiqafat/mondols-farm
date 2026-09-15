-- ============================================================
-- 0005_species_tracking_modes.sql
-- Configurable tracking modes per species
-- ============================================================

alter table public.species_config
  add column if not exists tracking_modes jsonb
  not null
  default '["group"]'::jsonb;


-- ------------------------------------------------------------
-- Existing species configuration
-- ------------------------------------------------------------

update public.species_config
set tracking_modes = '["group", "individual"]'::jsonb
where name = 'Chicken';


update public.species_config
set tracking_modes = '["individual", "group"]'::jsonb
where name = 'Goat';


update public.species_config
set tracking_modes = '["group", "individual"]'::jsonb
where name = 'Quail';


update public.species_config
set tracking_modes = '["area"]'::jsonb
where name in ('Mustard', 'Napier');


-- ------------------------------------------------------------
-- Basic validation
-- ------------------------------------------------------------

alter table public.species_config
  drop constraint if exists species_config_tracking_modes_check;

alter table public.species_config
  add constraint species_config_tracking_modes_check
  check (
    jsonb_typeof(tracking_modes) = 'array'
    and jsonb_array_length(tracking_modes) > 0
  );


-- ------------------------------------------------------------
-- Documentation
-- ------------------------------------------------------------

comment on column public.species_config.tracking_modes is
  'Allowed tracking modes for entities of this species: individual, group, area.';