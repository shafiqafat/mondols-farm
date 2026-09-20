alter table public.farm_projects
  add constraint farm_projects_status_check
  check (status in ('active', 'completed'));