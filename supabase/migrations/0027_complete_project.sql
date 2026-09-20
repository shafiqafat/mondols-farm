create or replace function public.complete_project(
  p_project_id uuid,
  p_completed_at date default current_date
)
returns void
language plpgsql
set search_path = public
as $function$
declare
  v_status text;
begin
  if not public.farm_can_write() then
    raise exception 'Write access denied';
  end if;

  select status
    into v_status
  from public.farm_projects
  where id = p_project_id
  for update;

  if not found then
    raise exception 'Farm project not found';
  end if;

  if v_status = 'completed' then
    raise exception 'Farm project is already completed';
  end if;

  update public.farm_projects
  set
    status = 'completed',
    completed_at = coalesce(p_completed_at, current_date)
  where id = p_project_id;

  update public.farm_project_entities
  set ended_at = coalesce(p_completed_at, current_date)
  where project_id = p_project_id
    and ended_at is null;
end;
$function$;