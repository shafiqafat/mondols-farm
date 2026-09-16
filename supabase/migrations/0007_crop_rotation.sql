-- Mondol's Farm OS — Crop rotation rules (Slice 6)
-- Rotation knowledge (what should follow what, and why) is farm/agronomy
-- knowledge, not application logic — stored as data you can edit anytime,
-- same as species_config. Adding a new rotation pairing for a future crop
-- is a row here, not a code change.

create table if not exists crop_rotation_rules (
  id uuid primary key default gen_random_uuid(),
  from_species_id uuid not null references species_config(id),
  to_species_id uuid not null references species_config(id),
  reason text not null,
  typical_duration_days integer,
  priority integer not null default 0,
  created_at timestamptz not null default now()
);

alter table crop_rotation_rules enable row level security;

create policy "authenticated_full_access_crop_rotation_rules" on crop_rotation_rules
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- No seed rule here on purpose: Mungbean isn't configured as a species yet.
-- Add it on the Species page, then create the Mustard → Mungbean rule
-- through the new Rotation Rules section — that's the actual "config, not
-- code" flow this table exists to support.
