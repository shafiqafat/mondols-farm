/*
 * 0055_reverse_entity_event.sql
 *
 * Atomically reverses quantity/status effects of reversible
 * operational lifecycle events.
 *
 * Currently reversible:
 *   - purchase
 *   - sale
 *   - mortality
 *
 * Events are not physically deleted.
 * They are marked as reversed.
 */

create or replace function public.reverse_entity_event(
  p_event_id uuid,
  p_reversal_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.entity_events%rowtype;
  v_entity public.farm_entities%rowtype;

  v_event_quantity numeric := 0;
  v_current_quantity numeric := 0;
  v_new_quantity numeric := 0;

  v_previous_status text;
  v_new_status text;

  v_reason text;
begin

  /*
   * Validate reversal reason.
   */
  v_reason := nullif(trim(p_reversal_reason), '');

  if v_reason is null then
    raise exception
      'A reversal reason is required.';
  end if;


  /*
   * Lock the event so it cannot be reversed twice
   * concurrently.
   */
  select *
    into v_event
  from public.entity_events
  where id = p_event_id
  for update;

  if not found then
    raise exception
      'Entity event not found.';
  end if;


  /*
   * An event that has already been reversed cannot
   * be reversed again.
   */
  if v_event.reversed_at is not null then
    raise exception
      'This entity event has already been reversed.';
  end if;


  /*
   * Only currently supported reversible events.
   */
  if v_event.type not in (
    'purchase',
    'sale',
    'mortality'
  ) then
    raise exception
      'This event type cannot be reversed.';
  end if;


  /*
   * Lock the entity before changing quantity/status.
   */
  select *
    into v_entity
  from public.farm_entities
  where id = v_event.entity_id
  for update;

  if not found then
    raise exception
      'Entity associated with this event was not found.';
  end if;


  v_current_quantity := coalesce(v_entity.quantity, 0);
  v_new_quantity := v_current_quantity;
  v_previous_status := v_entity.status;
  v_new_status := v_entity.status;


  /*
   * INDIVIDUAL REVERSAL
   *
   * Purchase does not change quantity/status.
   *
   * Sale and mortality originally moved the entity
   * to a terminal state.
   */
  if v_entity.tracking_mode = 'individual' then

    if v_event.type = 'purchase' then

      v_new_quantity := v_current_quantity;
      v_new_status := v_entity.status;

    elsif v_event.type = 'sale' then

      v_new_quantity := 1;
      v_new_status := 'active';

    elsif v_event.type = 'mortality' then

      v_new_quantity := 1;
      v_new_status := 'active';

    end if;


  /*
   * GROUP REVERSAL
   *
   * Reverse the original quantity movement.
   */
  elsif v_entity.tracking_mode = 'group' then

    v_event_quantity :=
      coalesce(
        (v_event.payload ->> 'quantity')::numeric,
        0
      );

    if v_event_quantity <= 0 then
      raise exception
        'Reversible group event has an invalid quantity.';
    end if;


    if v_event.type = 'purchase' then

      /*
       * Reverse purchase:
       * current quantity - purchased quantity.
       */
      if v_event_quantity > v_current_quantity then
        raise exception
          'Cannot reverse this purchase because the current entity quantity is too low.';
      end if;

      v_new_quantity :=
        v_current_quantity - v_event_quantity;


    elsif v_event.type in ('sale', 'mortality') then

      /*
       * Reverse disposal/mortality:
       * current quantity + original quantity.
       */
      v_new_quantity :=
        v_current_quantity + v_event_quantity;

    end if;


  else

    raise exception
      'This entity tracking mode does not support event reversal.';

  end if;


  /*
   * Quantity safety.
   */
  if v_new_quantity < 0 then
    raise exception
      'Entity quantity cannot become negative.';
  end if;


  /*
   * Apply entity state reversal.
   */
  if v_new_quantity <> v_current_quantity
     or v_new_status <> v_entity.status then

    update public.farm_entities
    set
      quantity = v_new_quantity,
      status = v_new_status
    where id = v_entity.id;

  end if;


  /*
   * Mark the original event as reversed.
   *
   * Do not delete the historical record.
   */
  update public.entity_events
  set
    reversed_at = now(),
    reversed_by = auth.uid(),
    reversal_reason = v_reason
  where id = v_event.id;


  return jsonb_build_object(
    'event_id', v_event.id,
    'entity_id', v_entity.id,
    'event_type', v_event.type,
    'tracking_mode', v_entity.tracking_mode,
    'previous_quantity', v_current_quantity,
    'new_quantity', v_new_quantity,
    'previous_status', v_previous_status,
    'new_status', v_new_status,
    'reversed_at', now(),
    'reversal_reason', v_reason
  );

end;
$$;


/*
 * Restrict direct access.
 */
revoke all on function public.reverse_entity_event(
  uuid,
  text
) from public;


/*
 * Authenticated users may request a reversal.
 */
grant execute on function public.reverse_entity_event(
  uuid,
  text
) to authenticated;