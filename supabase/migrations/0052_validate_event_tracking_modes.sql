create or replace function public.record_entity_event(
  p_entity_id uuid,
  p_type text,
  p_occurred_at date,
  p_payload jsonb default '{}'::jsonb
)
returns public.entity_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity public.farm_entities;
  v_event public.entity_events;
  v_event_quantity numeric;
begin
  -- Existing authorization
  if not public.farm_can_write() then
    raise exception 'Not authorized to record entity events';
  end if;

  -- Lock and load entity
  select *
  into v_entity
  from public.farm_entities
  where id = p_entity_id
  for update;

  if not found then
    raise exception 'Entity not found';
  end if;

  -- Entity must still be active
  if v_entity.status <> 'active' then
    raise exception 'Events can only be recorded for active entities';
  end if;

  /*
    Tracking-mode event rules
  */
  if p_type in ('weight_check', 'feed_given', 'egg_count', 'treatment',
                'mortality', 'breeding', 'purchase', 'sale')
     and v_entity.tracking_mode not in ('individual', 'group') then
    raise exception 'Event type % is not allowed for tracking mode %',
      p_type,
      v_entity.tracking_mode;
  end if;

  if p_type = 'harvest'
     and v_entity.tracking_mode not in ('group', 'area') then
    raise exception 'Harvest is not allowed for tracking mode %',
      v_entity.tracking_mode;
  end if;

  if p_type in ('planting', 'fertilizer_applied', 'irrigation',
                'pest_observation', 'growth_stage')
     and v_entity.tracking_mode <> 'area' then
    raise exception 'Event type % is only allowed for area tracking',
      p_type;
  end if;

  if p_type = 'processing'
     and v_entity.tracking_mode not in ('group', 'area') then
    raise exception 'Processing is not allowed for tracking mode %',
      v_entity.tracking_mode;
  end if;

  if p_type in ('health_note', 'other')
     and v_entity.tracking_mode not in ('individual', 'group', 'area') then
    raise exception 'Event type % is not allowed for tracking mode %',
      p_type,
      v_entity.tracking_mode;
  end if;

  /*
    Keep the remainder of the current 0051 RPC unchanged.
    Do NOT replace the existing:
      - date validation
      - payload validation
      - quantity movement
      - individual sale/mortality transitions
      - event insert
  */

  -- ...
end;
$$;