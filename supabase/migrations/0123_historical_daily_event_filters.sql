-- 0123 — Server-side date/project filters for historical activity listing.
-- Historical rows are queried only when the user applies filters.
-- Project membership is resolved as of the event date using assignment history.

drop function if exists public.list_historical_daily_events(integer);

create function public.list_historical_daily_events(
  p_limit integer default 200,
  p_from_date date default null,
  p_to_date date default null,
  p_project_id uuid default null
)
returns table (
  event_id uuid,
  entity_id uuid,
  entity_label text,
  event_type text,
  payload jsonb,
  occurred_at date,
  has_inventory_consumption boolean,
  project_id uuid
)
language plpgsql
security definer
set search_path = public
as $function$
begin
  if not farm_can_read() then
    raise exception 'You do not have permission to read daily logs';
  end if;

  if p_from_date is not null and p_to_date is not null and p_from_date > p_to_date then
    raise exception 'Start date must be on or before end date';
  end if;

  return query
  select
    ee.id,
    ee.entity_id,
    fe.label::text,
    ee.type::text,
    coalesce(ee.payload, '{}'::jsonb),
    ee.occurred_at::date,
    exists(select 1 from public.inventory_consumptions ic where ic.event_id = ee.id),
    assignment.project_id
  from public.entity_events ee
  left join public.farm_entities fe on fe.id = ee.entity_id
  left join lateral (
    select fpe.project_id
    from public.farm_project_entities fpe
    where fpe.entity_id = ee.entity_id
      and fpe.started_at::date <= ee.occurred_at::date
      and (fpe.ended_at is null or fpe.ended_at::date >= ee.occurred_at::date)
    order by fpe.started_at desc nulls last
    limit 1
  ) assignment on true
  where not exists (
    select 1
    from public.daily_log_batches b
    where ee.id = any(coalesce(b.event_ids, '{}'::uuid[]))
  )
    and (p_from_date is null or ee.occurred_at::date >= p_from_date)
    and (p_to_date is null or ee.occurred_at::date <= p_to_date)
    and (p_project_id is null or assignment.project_id = p_project_id)
  order by ee.occurred_at desc, ee.id desc
  limit greatest(1, least(coalesce(p_limit, 200), 200));
end;
$function$;

revoke all on function public.list_historical_daily_events(integer, date, date, uuid) from public;
grant execute on function public.list_historical_daily_events(integer, date, date, uuid) to authenticated;
