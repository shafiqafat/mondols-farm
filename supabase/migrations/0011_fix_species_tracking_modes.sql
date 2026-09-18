-- Fix tracking modes to match the actual seeded species names.

update public.species_config
set tracking_modes = '["group", "individual"]'::jsonb
where name = 'Deshi Chicken';

update public.species_config
set tracking_modes = '["individual", "group"]'::jsonb
where name = 'Black Bengal Goat';

update public.species_config
set tracking_modes = '["group", "individual"]'::jsonb
where name = 'Quail';

update public.species_config
set tracking_modes = '["area"]'::jsonb
where name in ('Mustard', 'Napier');


-- Validate the overall JSON structure.
alter table public.species_config
  drop constraint if exists species_config_tracking_modes_values_check;

alter table public.species_config
  add constraint species_config_tracking_modes_values_check
  check (
    jsonb_typeof(tracking_modes) = 'array'
    and jsonb_array_length(tracking_modes) > 0
  );