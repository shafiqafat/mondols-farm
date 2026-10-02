-- 0050_validate_record_entity_event.sql
-- Protect record_entity_event() from unsupported/reserved event types.

create or replace function public.record_entity_event(
  p_entity_id uuid,
  p_event_type text,
  p_payload jsonb,
  p_occurred_at date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity public.farm_entities%rowtype;
  v_current_quantity numeric;
  v_event_quantity numeric;
  v_new_quantity numeric;
  v_new_status text;
  v_event_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.farm_can_write() then
    raise exception 'Write permission required';
  end if;

  if p_entity_id is null then
    raise exception 'Entity is required.';
  end if;

  if nullif(trim(coalesce(p_event_type, '')), '') is null then
    raise exception 'Event type is required.';
  end if;

  if p_occurred_at is null then
    raise exception 'Event date is required.';
  end if;

  -- Only operational events belong here.
  -- status_changed is reserved for change_entity_status().
  if p_event_type not in (
    'weight_check',
    'feed_given',
    'egg_count',
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
    'other'
  ) then
    raise exception 'Unsupported event type "%".', p_event_type;
  end if;

  -- Prevent future-dated events at the database layer too.
  if p_occurred_at > current_date then
    raise exception 'Event date cannot be in the future.';
  end if;

  select *
    into v_entity
  from public.farm_entities
  where id = p_entity_id
  for update;

  if not found then
    raise exception 'Entity not found.';
  end if;

  if v_entity.status <> 'active' then
    raise exception
      'Entity with status "%" cannot receive operational events.',
      v_entity.status;
  end if;

  v_current_quantity := coalesce(v_entity.quantity, 0);
  v_new_quantity := v_current_quantity;
  v_new_status := v_entity.status;

  -- GROUP quantity movement.
  if v_entity.tracking_mode = 'group' then

    if p_event_type = 'purchase' then

      v_event_quantity := (p_payload->>'quantity')::numeric;

      if v_event_quantity is null or v_event_quantity <= 0 then
        raise exception 'Purchase quantity must be greater than 0.';
      end if;

      v_new_quantity := v_current_quantity + v_event_quantity;

    elsif p_event_type = 'sale' then

      v_event_quantity := (p_payload->>'quantity')::numeric;

      if v_event_quantity is null or v_event_quantity <= 0 then
        raise exception 'Sale quantity must be greater than 0.';
      end if;

      if v_event_quantity > v_current_quantity then
        raise exception
          'Sale quantity cannot exceed the current entity quantity.';
      end if;

      v_new_quantity := v_current_quantity - v_event_quantity;

    elsif p_event_type = 'mortality' then

      v_event_quantity := (p_payload->>'quantity')::numeric;

      if v_event_quantity is null
         or v_event_quantity < 1
         or v_event_quantity <> floor(v_event_quantity) then
        raise exception
          'Mortality quantity must be a whole number of at least 1.';
      end if;

      if v_event_quantity > v_current_quantity then
        raise exception
          'Mortality quantity cannot exceed the current entity quantity.';
      end if;

      v_new_quantity := v_current_quantity - v_event_quantity;

    end if;

  -- INDIVIDUAL terminal events.
  elsif v_entity.tracking_mode = 'individual' then

    if p_event_type = 'sale' then
      v_event_quantity := 1;
      v_new_quantity := 0;
      v_new_status := 'sold';

    elsif p_event_type = 'mortality' then
      v_event_quantity := 1;
      v_new_quantity := 0;
      v_new_status := 'deceased';

    end if;

  end if;

  if v_new_quantity < 0 then
    raise exception 'Entity quantity cannot become negative.';
  end if;

  -- Record the operational event first.
  insert into public.entity_events (
    entity_id,
    type,
    payload,
    occurred_at
  )
  values (
    p_entity_id,
    p_event_type,
    coalesce(p_payload, '{}'::jsonb),
    p_occurred_at
  )
  returning id into v_event_id;

  -- Apply quantity/status changes atomically.
  if v_new_quantity <> v_current_quantity
     or v_new_status <> v_entity.status then

    update public.farm_entities
    set
      quantity = v_new_quantity,
      status = v_new_status
    where id = p_entity_id;

  end if;

  return jsonb_build_object(
    'event_id', v_event_id,
    'entity_id', p_entity_id,
    'event_type', p_event_type,
    'previous_quantity', v_current_quantity,
    'new_quantity', v_new_quantity,
    'previous_status', v_entity.status,
    'new_status', v_new_status
  );
end;
$$;

revoke all on function public.record_entity_event(
  uuid,
  text,
  jsonb,
  date
) from public;

grant execute on function public.record_entity_event(
  uuid,
  text,
  jsonb,
  date
) to authenticated;