-- 0047_change_entity_status.sql
-- Centralize entity status transitions and record an immutable status event.

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
  v_current_status text;
  v_reason text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.farm_can_write() then
    raise exception 'Write permission required';
  end if;

  if p_status not in ('sold', 'deceased', 'harvested') then
    raise exception 'Invalid entity status "%".', p_status;
  end if;

  select status
    into v_current_status
  from public.farm_entities
  where id = p_entity_id
  for update;

  if not found then
    raise exception 'Entity not found.';
  end if;

  if v_current_status = p_status then
    return jsonb_build_object(
      'changed', false,
      'status', v_current_status
    );
  end if;

  if v_current_status <> 'active' then
    raise exception
      'Entity with status "%" cannot be changed.',
      v_current_status;
  end if;

  v_reason := nullif(trim(coalesce(p_reason, '')), '');

  update public.farm_entities
  set status = p_status
  where id = p_entity_id;

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
      'from', v_current_status,
      'to', p_status,
      'reason', v_reason
    ),
    now()
  );

  return jsonb_build_object(
    'changed', true,
    'status', p_status,
    'from_status', v_current_status
  );
end;
$$;

revoke all on function public.change_entity_status(uuid, text, text)
from public;

grant execute on function public.change_entity_status(uuid, text, text)
to authenticated;
