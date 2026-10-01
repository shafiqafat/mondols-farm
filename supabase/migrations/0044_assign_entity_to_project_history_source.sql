-- 0044_assign_entity_to_project_history_source.sql

create or replace function public.assign_entity_to_project(
  p_entity_id uuid,
  p_project_id uuid,
  p_role text default 'primary',
  p_started_at date default current_date
)
returns void
language plpgsql
set search_path = public
as $function$
declare
  v_previous_project_id uuid;
begin
  if not public.farm_can_write() then
    raise exception 'Write access denied';
  end if;

  if not exists (
    select 1
    from public.farm_entities
    where id = p_entity_id
  ) then
    raise exception 'Farm entity not found';
  end if;

  if not exists (
    select 1
    from public.farm_projects
    where id = p_project_id
  ) then
    raise exception 'Farm project not found';
  end if;

  /*
   * farm_project_entities is now the authoritative source
   * for project assignment history.
   */
  select project_id
    into v_previous_project_id
  from public.farm_project_entities
  where entity_id = p_entity_id
    and started_at <= p_started_at
    and (
      ended_at is null
      or p_started_at < ended_at
    )
  order by started_at desc
  limit 1
  for update;

  if v_previous_project_id = p_project_id then
    return;
  end if;

  if v_previous_project_id is not null then
    update public.farm_project_entities
    set ended_at = p_started_at
    where entity_id = p_entity_id
      and project_id = v_previous_project_id
      and ended_at is null;
  end if;

  insert into public.farm_project_entities (
    project_id,
    entity_id,
    role,
    started_at
  )
  values (
    p_project_id,
    p_entity_id,
    coalesce(nullif(trim(p_role), ''), 'primary'),
    p_started_at
  );

  /*
   * Keep the legacy field synchronized for compatibility
   * with any older code that may still read it.
   */
  update public.farm_entities
  set project_id = p_project_id
  where id = p_entity_id;
end;
$function$;