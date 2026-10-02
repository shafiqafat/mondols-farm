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
  v_event_id uuid;
begin
  -- Authentication
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  -- Write permission
  if not public.farm_can_write() then
    raise exception 'Write permission required';
  end if;

  -- Basic input validation
  if p_entity_id is null then
    raise exception 'Entity is required.';
  end if;

  if nullif(trim(coalesce(p_event_type, '')), '') is null then
    raise exception 'Event type is required.';
  end if;

  if p_occurred_at is null then
    raise exception 'Event date is required.';
  end if;

  -- Lock the entity so concurrent quantity changes cannot conflict.
  select *
    into v_entity
  from public.farm_entities
  where id = p_entity_id
  for update;

  if not found then
    raise exception 'Entity not found.';
  end if;

  -- Closed entities cannot receive operational events.
  if v_entity.status <> 'active' then
    raise exception
      'Entity with status "%" cannot receive operational events.',
      v_entity.status;
  end if;

  v_current_quantity := coalesce(v_entity.quantity, 0);
  v_new_quantity := v_current_quantity;

  /*
   * Quantity movement rules
   *
   * Group:
   *   purchase  -> increase
   *   sale      -> decrease
   *   mortality -> decrease
   *
   * Individual:
   *   sale/mortality -> quantity becomes 0
   *
   * Breeding and harvest do not modify entity quantity.
   *
   * Area:
   *   quantity is not modified by operational events.
   */

  if p_event_type = 'purchase' then

    if v_entity.tracking_mode = 'group' then
      v_event_quantity := (p_payload ->> 'quantity')::numeric;

      if v_event_quantity is null or v_event_quantity <= 0 then
        raise exception 'Purchase quantity must be greater than 0.';
      end if;

      v_new_quantity := v_current_quantity + v_event_quantity;
    end if;

  elsif p_event_type = 'sale' then

    if v_entity.tracking_mode = 'individual' then
      v_event_quantity := 1;
      v_new_quantity := 0;

    elsif v_entity.tracking_mode = 'group' then
      v_event_quantity := (p_payload ->> 'quantity')::numeric;

      if v_event_quantity is null or v_event_quantity <= 0 then
        raise exception 'Sale quantity must be greater than 0.';
      end if;

      if v_event_quantity > v_current_quantity then
        raise exception
          'Sale quantity cannot exceed the current entity quantity.';
      end if;

      v_new_quantity := v_current_quantity - v_event_quantity;
    end if;

  elsif p_event_type = 'mortality' then

    if v_entity.tracking_mode = 'individual' then
      v_event_quantity := 1;
      v_new_quantity := 0;

    elsif v_entity.tracking_mode = 'group' then
      v_event_quantity := (p_payload ->> 'quantity')::numeric;

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

  end if;

  -- Quantity must never become negative.
  if v_new_quantity < 0 then
    raise exception 'Entity quantity cannot become negative.';
  end if;

  -- Record the event.
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

  -- Update quantity only when this event actually affects it.
  if v_new_quantity <> v_current_quantity then
    update public.farm_entities
    set quantity = v_new_quantity
    where id = p_entity_id;
  end if;

  return jsonb_build_object(
    'event_id', v_event_id,
    'entity_id', p_entity_id,
    'event_type', p_event_type,
    'previous_quantity', v_current_quantity,
    'new_quantity', v_new_quantity
  );
end;
$$;

revoke all on function public.record_entity_event(
  uuid,
  text,
  jsonb,
  date
)
from public;

grant execute on function public.record_entity_event(
  uuid,
  text,
  jsonb,
  date
)
to authenticated;