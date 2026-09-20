alter table public.farm_projects
  add column if not exists project_type text,
  add column if not exists purpose text,
  add column if not exists target_end_at date,
  add column if not exists completed_at date;