create table if not exists public.farm_project_entities (
  id uuid primary key default gen_random_uuid(),

  project_id uuid not null
    references public.farm_projects(id)
    on delete restrict,

  entity_id uuid not null
    references public.farm_entities(id)
    on delete restrict,

  role text,

  started_at date not null default current_date,
  ended_at date,

  created_at timestamptz not null default now(),

  constraint farm_project_entities_date_check
    check (
      ended_at is null
      or ended_at >= started_at
    ),

  constraint farm_project_entities_unique_assignment
    unique (project_id, entity_id, started_at)
);