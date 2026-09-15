-- Mondol's Farm OS — Initial schema (Slice 1)
-- Single-admin private data. Every table is locked to the authenticated
-- user via Row Level Security — nothing here is ever publicly readable.
--
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query),
-- or via `supabase db push` if you set up the CLI later.

-- ---------------------------------------------------------------------
-- species_config — admin-editable species/crop definitions.
-- Adding "Duck" or "Rice" later means inserting a row here, not a code change.
-- ---------------------------------------------------------------------
create table if not exists species_config (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,               -- 'poultry' | 'livestock' | 'crop' | 'fodder'
  capabilities jsonb not null default '{}'::jsonb,
  space_unit text,                       -- e.g. 'sq ft', 'decimal'
  feed_unit text,                        -- e.g. 'kg/day'
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- farm_entities — actual instances: "100 female quail", "1 Black Bengal goat",
-- "5 decimal mustard plot".
-- ---------------------------------------------------------------------
create table if not exists farm_entities (
  id uuid primary key default gen_random_uuid(),
  species_config_id uuid not null references species_config(id),
  label text not null,
  quantity numeric,
  acquired_at date,
  location text,
  status text not null default 'active', -- 'active' | 'sold' | 'deceased' | 'harvested'
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- entity_events — generic append-only log. Daily Log writes here.
-- type examples: 'feed_given', 'egg_count', 'mortality', 'health_note',
-- 'weight_check', 'harvest'
-- ---------------------------------------------------------------------
create table if not exists entity_events (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references farm_entities(id),
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- inventory_items + inventory_lots — FIFO-costed stock (feed, seed, medicine...)
-- ---------------------------------------------------------------------
create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text not null,                    -- 'kg', 'liter', 'bag', ...
  reorder_lead_time_days integer,
  safety_stock numeric,
  created_at timestamptz not null default now()
);

create table if not exists inventory_lots (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references inventory_items(id),
  qty_purchased numeric not null,
  qty_remaining numeric not null,
  cost_per_unit numeric not null,
  purchased_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- farm_projects — the P&L boundary (Mustard Project #001, Goat Herd...)
-- ---------------------------------------------------------------------
create table if not exists farm_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  started_at date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- finance_transactions
-- ---------------------------------------------------------------------
create table if not exists finance_transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null,                    -- 'income' | 'expense' | 'asset'
  amount numeric not null,
  category text,
  project_id uuid references farm_projects(id),
  entity_id uuid references farm_entities(id),
  occurred_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  entity_id uuid references farm_entities(id),
  due_at date,
  recurrence text,                       -- null = one-time, else e.g. 'daily','weekly'
  priority text not null default 'normal', -- 'low' | 'normal' | 'high' | 'critical'
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security — lock every table to authenticated users only.
-- Since this is single-admin, "authenticated" is sufficient; no need for
-- per-row ownership checks yet.
-- ---------------------------------------------------------------------
alter table species_config enable row level security;
alter table farm_entities enable row level security;
alter table entity_events enable row level security;
alter table inventory_items enable row level security;
alter table inventory_lots enable row level security;
alter table farm_projects enable row level security;
alter table finance_transactions enable row level security;
alter table tasks enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'species_config','farm_entities','entity_events',
    'inventory_items','inventory_lots','farm_projects',
    'finance_transactions','tasks'
  ]
  loop
    execute format(
      'create policy "authenticated_full_access_%1$s" on %1$s
         for all
         using (auth.role() = ''authenticated'')
         with check (auth.role() = ''authenticated'');',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Seed the three starting species so Overview/Daily Log have something
-- real to point at immediately. Safe to edit or delete these rows later —
-- this is data, not code.
-- ---------------------------------------------------------------------
insert into species_config (name, category, capabilities, space_unit, feed_unit) values
  ('Quail', 'poultry', '{"feed":{"unit":"kg/day"},"health":{},"egg":{"unit":"count/day"}}'::jsonb, 'sq ft', 'kg/day'),
  ('Deshi Chicken', 'poultry', '{"feed":{"unit":"kg/day"},"health":{},"egg":{"unit":"count/day"}}'::jsonb, 'sq ft', 'kg/day'),
  ('Black Bengal Goat', 'livestock', '{"feed":{"unit":"kg/day"},"health":{},"weight":{"unit":"kg"},"breeding":{"gestation_days":150,"litter_size_avg":2}}'::jsonb, 'sq ft', 'kg/day'),
  ('Napier', 'fodder', '{"harvest":{"unit":"kg"}}'::jsonb, 'decimal', null),
  ('Mustard', 'crop', '{"harvest":{"unit":"kg"}}'::jsonb, 'decimal', null)
on conflict do nothing;
