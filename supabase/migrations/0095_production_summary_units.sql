drop function if exists public.get_investor_project_production_summary(uuid);

create function public.get_investor_project_production_summary(
  p_project_id uuid
)
returns table (
  event_type text,
  species_config_id uuid,
  species_name text,
  unit text,
  total_quantity numeric,
  event_count bigint,
  latest_occurred_at date
)
language sql
security definer
set search_path = public
as $$
  with investor_allocations as (
    select
      ia.scope_type,
      ia.species_config_id
    from investment_allocations ia
    join investments i
      on i.id = ia.investment_id
    join investors inv
      on inv.id = i.investor_id
    where ia.project_id = p_project_id
      and inv.user_id = auth.uid()
      and inv.status = 'active'
      and i.status = 'active'
  ),
  scope_resolution as (
    select
      case
        when bool_or(scope_type = 'full_project')
          then 'full_project'
        when count(*) > 0
          then 'partial'
        else null
      end as exposure_scope
    from investor_allocations
  ),
  allowed_entities as (
    select fe.id
    from farm_entities fe
    cross join scope_resolution sr
    where fe.project_id = p_project_id
      and sr.exposure_scope is not null
      and (
        sr.exposure_scope = 'full_project'
        or exists (
          select 1
          from investor_allocations ia
          where ia.scope_type in ('species_activity', 'partial')
            and ia.species_config_id is not null
            and ia.species_config_id = fe.species_config_id
        )
      )
  ),
  production_events as (
    select
      ee.type as event_type,
      sc.id as species_config_id,
      sc.name as species_name,
      case
        when ee.type = 'harvest'
          then nullif(trim(ee.payload->>'unit'), '')
        when ee.type = 'egg_count'
          then 'eggs'
      end as unit,
      case
        when ee.type = 'harvest'
          and jsonb_typeof(ee.payload->'quantity') = 'number'
          then (ee.payload->>'quantity')::numeric

        when ee.type = 'egg_count'
          and jsonb_typeof(ee.payload->'count') = 'number'
          then (ee.payload->>'count')::numeric

        else 0
      end as quantity,
      ee.occurred_at
    from entity_events ee
    join allowed_entities ae
      on ae.id = ee.entity_id
    join farm_entities fe
      on fe.id = ee.entity_id
    join species_config sc
      on sc.id = fe.species_config_id
    where ee.type in ('harvest', 'egg_count')
      and ee.reversed_at is null
  )
  select
    event_type,
    species_config_id,
    species_name,
    unit,
    sum(quantity) as total_quantity,
    count(*) as event_count,
    max(occurred_at) as latest_occurred_at
  from production_events
  group by
    event_type,
    species_config_id,
    species_name,
    unit
  order by
    max(occurred_at) desc,
    species_name,
    unit;
$$;

revoke all on function public.get_investor_project_production_summary(uuid)
from public;

grant execute on function public.get_investor_project_production_summary(uuid)
to authenticated;