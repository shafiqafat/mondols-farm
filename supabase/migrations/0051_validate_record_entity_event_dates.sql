-- 0051_validate_record_entity_event_dates.sql
-- Enforce lifecycle-aware event dates inside record_entity_event().

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
  v_lifecycle public.entity_lifecycle%rowtype;
  v_species_category text;
  v_species_capabilities jsonb;

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

  -- Only operational events belong to this RPC.
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

  -- No future operational events.
  if p_occurred_at > current_date then
    raise exception 'Event date cannot be in the future.';
  end if;

  -- Lock the entity before reading lifecycle data.
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

select
  sc.category,
  coalesce(sc.capabilities, '{}'::jsonb)
into
  v_species_category,
  v_species_capabilities
from public.species_config sc
where sc.id = v_entity.species_config_id;

if not found then
  raise exception 'Species configuration not found.';
end if;
  /*
  Tracking-mode event rules
*/

if p_event_type in (
  'weight_check',
  'feed_given',
  'egg_count',
  'treatment',
  'mortality',
  'breeding',
  'purchase',
  'sale'
)
and v_entity.tracking_mode not in ('individual', 'group') then
  raise exception 'Event type % is not allowed for tracking mode %',
    p_event_type,
    v_entity.tracking_mode;
end if;

if p_event_type = 'harvest'
and v_entity.tracking_mode not in ('group', 'area') then
  raise exception 'Harvest is not allowed for tracking mode %',
    v_entity.tracking_mode;
end if;

if p_event_type in (
  'planting',
  'fertilizer_applied',
  'irrigation',
  'pest_observation',
  'growth_stage'
)
and v_entity.tracking_mode <> 'area' then
  raise exception 'Event type % is only allowed for area tracking',
    p_event_type;
end if;

if p_event_type = 'processing'
and v_entity.tracking_mode not in ('group', 'area') then
  raise exception 'Processing is not allowed for tracking mode %',
    p_event_type;
end if;

if p_event_type in ('health_note', 'other')
and v_entity.tracking_mode not in ('individual', 'group', 'area') then
  raise exception 'Event type % is not allowed for tracking mode %',
    p_event_type,
    v_entity.tracking_mode;
end if;

      -- Database-level validation for quantity-changing events.
  -- Individual entities use implicit quantity 1 for lifecycle events.
  if v_entity.tracking_mode = 'group' then

    if p_event_type = 'purchase' then

      if p_payload ? 'quantity' = false then
        raise exception 'Purchase quantity is required.';
      end if;

      v_event_quantity := (p_payload->>'quantity')::numeric;

      if v_event_quantity is null or v_event_quantity <= 0 then
        raise exception 'Purchase quantity must be greater than 0.';
      end if;

    elsif p_event_type = 'sale' then

      if p_payload ? 'quantity' = false then
        raise exception 'Sale quantity is required.';
      end if;

      v_event_quantity := (p_payload->>'quantity')::numeric;

      if v_event_quantity is null or v_event_quantity <= 0 then
        raise exception 'Sale quantity must be greater than 0.';
      end if;

    elsif p_event_type = 'mortality' then

      if p_payload ? 'quantity' = false then
        raise exception 'Mortality quantity is required.';
      end if;

      v_event_quantity := (p_payload->>'quantity')::numeric;

      if v_event_quantity is null
          or v_event_quantity < 1
          or v_event_quantity <> floor(v_event_quantity) then
        raise exception
          'Mortality quantity must be a whole number of at least 1.';
      end if;

    end if;

  elsif v_entity.tracking_mode = 'individual' then

    if p_event_type in ('purchase', 'sale', 'mortality') then
      v_event_quantity := 1;
    end if;

  end if;

  -- Individual entities have lifecycle-aware date boundaries.
  if v_entity.tracking_mode = 'individual' then

    select *
      into v_lifecycle
    from public.entity_lifecycle
    where entity_id = p_entity_id;

    if found and v_lifecycle.birth_date is not null then
      if p_occurred_at < v_lifecycle.birth_date then
        raise exception
          'Event date cannot be before the entity''s birth date.';
      end if;
    end if;

    if v_entity.acquired_at is not null then
      if p_occurred_at < v_entity.acquired_at::date then
        raise exception
          'Event date cannot be before the entity''s acquisition date.';
      end if;
    end if;

  end if;

  v_current_quantity := coalesce(v_entity.quantity, 0);
  v_new_quantity := v_current_quantity;
  v_new_status := v_entity.status;

  -- GROUP quantity movement.
if v_entity.tracking_mode = 'group' then

  if p_event_type = 'purchase' then

    v_new_quantity := v_current_quantity + v_event_quantity;

  elsif p_event_type = 'sale' then

    if v_event_quantity > v_current_quantity then
      raise exception
        'Sale quantity cannot exceed the current entity quantity.';
    end if;

    v_new_quantity := v_current_quantity - v_event_quantity;

  elsif p_event_type = 'mortality' then

    if v_event_quantity > v_current_quantity then
      raise exception
        'Mortality quantity cannot exceed the current entity quantity.';
    end if;

    v_new_quantity := v_current_quantity - v_event_quantity;

  end if;

  -- INDIVIDUAL terminal events.
  elsif v_entity.tracking_mode = 'individual' then

    if p_event_type = 'sale' then

      v_new_quantity := 0;
      v_new_status := 'sold';

    elsif p_event_type = 'mortality' then

      v_new_quantity := 0;
      v_new_status := 'deceased';

    end if;

  end if;

  if v_new_quantity < 0 then
    raise exception 'Entity quantity cannot become negative.';
  end if;

  -- Record the operational event.
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

  -- Quantity/status transition happens atomically.
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