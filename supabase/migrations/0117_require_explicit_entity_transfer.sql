
-- 0117_require_explicit_entity_transfer.sql

-- Remove the old four-argument signature after introducing
-- the replacement below, so callers cannot bypass the flag.

create or replace function public.assign_entity_to_project(
  p_entity_id uuid,
  p_project_id uuid,
  p_role text default 'primary',
  p_started_at date default current_date,
  p_allow_transfer boolean default false
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

  if not exists (
    select 1
    from public.farm_projects
    where id = p_project_id
  ) then
    raise exception 'Farm project not found';
  end if;

  perform 1
  from public.farm_entities
  where id = p_entity_id
  for update;

  if not found then
    raise exception 'Farm entity not found';
  end if;

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
    if not coalesce(p_allow_transfer, false) then
      raise exception
        'Entity is already assigned to another project. Explicit transfer is required.';
    end if;

    if v_previous.started_at >= p_started_at then
      raise exception
        'Cannot transfer entity on or before its existing assignment start date';
    end if;

    update public.farm_project_entities
    set ended_at = p_started_at
    where id = v_previous.id;
  end if;

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

  update public.farm_entities
  set project_id = p_project_id
  where id = p_entity_id;
end;
$function$;

-- PostgreSQL treats this as a different function signature.
-- Remove the previous signature so it cannot bypass the new flag.
drop function public.assign_entity_to_project(
  uuid, uuid, text, date
);
