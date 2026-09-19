-- 0018_entity_lifecycle.sql
-- Entity lifecycle status changes + event history

-- ---------------------------------------------------------
-- 1. Allow status_changed as an entity event
-- ---------------------------------------------------------

alter table public.entity_events
drop constraint if exists entity_events_type_check;

alter table public.entity_events
add constraint entity_events_type_check
check (
  type = any (
    array[
      'weight',
      'feed',
      'egg_production',
      'harvest',
      'treatment',
      'mortality',
      'breeding',
      'purchase',
      'sale',
      'planting',
      'fertilizer_applied',
      'irrigation',
      'pest_observation',
      'growth_stage',
      'processing',
      'health_note',
      'other',
      'weight_check',
      'feed_given',
      'egg_count',
      'note',
      'status_changed'
    ]
  )
);

-- ---------------------------------------------------------
-- 2. Validate event payload structure by event type
-- ---------------------------------------------------------

alter table public.entity_events
drop constraint if exists entity_events_numeric_payload_check;

alter table public.entity_events
add constraint entity_events_numeric_payload_check
check (
  (
    type = 'note'
    and jsonb_typeof(payload -> 'text') = 'string'
  )
  or
  (
    type = 'status_changed'
    and jsonb_typeof(payload -> 'from') = 'string'
    and jsonb_typeof(payload -> 'to') = 'string'
    and (
      not (payload ? 'reason')
      or jsonb_typeof(payload -> 'reason') in ('string', 'null')
    )
  )
  or
  (
    type = 'feed_given'
    and jsonb_typeof(payload -> 'qty_kg') = 'number'
  )
  or
  (
    type = 'egg_count'
    and jsonb_typeof(payload -> 'count') = 'number'
  )
  or
  (
    type = 'weight_check'
    and jsonb_typeof(payload -> 'kg') = 'number'
  )
  or
  (
    type = 'mortality'
    and jsonb_typeof(payload -> 'count') = 'number'
  )
  or
  (
    type = 'harvest'
    and jsonb_typeof(payload -> 'qty_kg') = 'number'
  )
);

-- ---------------------------------------------------------
-- 3. Atomic entity status change
-- ---------------------------------------------------------

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
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.farm_can_write() then
    raise exception 'Write permission required';
  end if;

  if p_status not in (
    'active',
    'sold',
    'deceased',
    'harvested'
  ) then
    raise exception 'Invalid entity status: %', p_status;
  end if;

  select *
  into v_entity
  from public.farm_entities
  where id = p_entity_id
  for update;

  if not found then
    raise exception 'Farm entity not found';
  end if;

  v_old_status := v_entity.status;

  -- No-op: do not create duplicate history
  if v_old_status = p_status then
    return jsonb_build_object(
      'entity_id', p_entity_id,
      'status', v_old_status,
      'changed', false,
      'event_id', null
    );
  end if;

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