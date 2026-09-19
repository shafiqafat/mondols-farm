create or replace function public.validate_entity_event_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  select status
  into v_status
  from public.farm_entities
  where id = new.entity_id;

  if not found then
    raise exception 'Farm entity not found';
  end if;

  -- System-generated lifecycle events are always allowed.
  if new.type = 'status_changed' then
    return new;
  end if;

  -- Closed entities cannot receive normal operational events.
  if v_status in ('sold', 'deceased', 'harvested') then
    raise exception
      'Cannot record event "%" for entity with status "%"',
      new.type,
      v_status;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_entity_event_lifecycle
on public.entity_events;

create trigger validate_entity_event_lifecycle
before insert on public.entity_events
for each row
execute function public.validate_entity_event_lifecycle();

revoke all on function public.validate_entity_event_lifecycle()
from public;

grant execute on function public.validate_entity_event_lifecycle()
to authenticated;