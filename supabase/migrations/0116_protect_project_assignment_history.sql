
-- 0116_protect_project_assignment_history.sql

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
  v_previous record;
begin
  if not public.farm_can_write() then
    raise exception 'Write access denied';
  end if;

  if p_entity_id is null
     or p_project_id is null
     or p_started_at is null then
    raise exception 'Entity, project, and start date are required';
  end if;

  -- Validate the target project.
  if not exists (
    select 1
    from public.farm_projects
    where id = p_project_id
  ) then
    raise exception 'Farm project not found';
  end if;

  -- Serialize assignment changes for this entity.
  perform 1
  from public.farm_entities
  where id = p_entity_id
  for update;

  if not found then
    raise exception 'Farm entity not found';
  end if;

  -- If this project already owns the entity on the requested
  -- date, do not create a duplicate assignment.
  if exists (
    select 1
    from public.farm_project_entities
    where entity_id = p_entity_id
      and project_id = p_project_id
      and started_at <= p_started_at
      and (
        ended_at is null
        or p_started_at < ended_at
      )
  ) then
    return;
  end if;

  /*
   * Find a different project assignment active on the requested
   * date. Assignment intervals are [started_at, ended_at).
   */
  select id, project_id, started_at, ended_at
    into v_previous
  from public.farm_project_entities
  where entity_id = p_entity_id
    and project_id <> p_project_id
    and started_at <= p_started_at
    and (
      ended_at is null
      or p_started_at < ended_at
    )
  order by started_at desc
  limit 1
  for update;

  if found then
    -- Do not rewrite an assignment that starts on a later date.
    if v_previous.started_at >= p_started_at then
      raise exception
        'Cannot transfer entity: an assignment starts on or after the requested date';
    end if;

    -- End the previous assignment at the new start date.
    update public.farm_project_entities
    set ended_at = p_started_at
    where id = v_previous.id;
  end if;

  /*
   * An open-ended new assignment would overlap any later
   * assignment. Reject it rather than silently rewriting history.
   */
  if exists (
    select 1
    from public.farm_project_entities
    where entity_id = p_entity_id
      and started_at >= p_started_at
      and (
        ended_at is null
        or started_at < ended_at
      )
  ) then
    raise exception
      'Cannot assign entity: a later assignment already exists';
  end if;

  -- Insert the new history record.
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

  -- Maintain the legacy current-project field.
  update public.farm_entities
  set project_id = p_project_id
  where id = p_entity_id;
end;
$function$;
