create or replace function public.change_entity_status(
  p_entity_id uuid,
  p_status text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity public.farm_entities%rowtype;
  v_old_status text;
  v_event_id uuid;
begin
  -- Require an authenticated user.
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  -- Require farm write permission.
  if not public.farm_can_write() then
    raise exception 'Write permission required';
  end if;

  -- Load the entity.
  select *
  into v_entity
  from public.farm_entities
  where id = p_entity_id
  for update;

  if not found then
    raise exception 'Farm entity not found';
  end if;

  v_old_status := v_entity.status;

  -- No-op status changes are ignored.
  if v_old_status = p_status then
    return jsonb_build_object(
      'entity_id', p_entity_id,
      'status', v_old_status,
      'changed', false,
      'event_id', null
    );
  end if;

  -- Validate supported lifecycle statuses.
  if p_status not in (
    'active',
    'sold',
    'deceased',
    'harvested'
  ) then
    raise exception 'Invalid entity status: %', p_status;
  end if;

  -- Update the current entity state.
  update public.farm_entities
  set status = p_status
  where id = p_entity_id;

  -- Record the lifecycle transition in entity history.
  insert into public.entity_events (
    entity_id,
    type,
    payload,
    occurred_at
  )
  values (
    p_entity_id,
    'status_changed',
    jsonb_build_object(
      'from', v_old_status,
      'to', p_status,
      'reason', nullif(trim(coalesce(p_reason, '')), '')
    ),
    current_date
  )
  returning id into v_event_id;

  return jsonb_build_object(
    'entity_id', p_entity_id,
    'status', p_status,
    'changed', true,
    'event_id', v_event_id
  );
end;
$$;

revoke all on function public.change_entity_status(uuid, text, text)
from public;

grant execute on function public.change_entity_status(uuid, text, text)
to authenticated;