create or replace function public.get_investor_project_recent_activity(
  p_project_id uuid,
  p_limit integer default 10
)
returns table (
  event_type text,
  species_config_id uuid,
  species_name text,
  occurred_at date,
  metric_value numeric,
  metric_unit text
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
  )
  select
    ee.type as event_type,
    sc.id as species_config_id,
    sc.name as species_name,
    ee.occurred_at,

    case
      when ee.type = 'harvest'
        and jsonb_typeof(ee.payload->'quantity') = 'number'
        then (ee.payload->>'quantity')::numeric

      when ee.type = 'egg_count'
        and jsonb_typeof(ee.payload->'count') = 'number'
        then (ee.payload->>'count')::numeric

      when ee.type = 'weight_check'
        and jsonb_typeof(ee.payload->'kg') = 'number'
        then (ee.payload->>'kg')::numeric

      when ee.type = 'feed_given'
        and jsonb_typeof(ee.payload->'qty_kg') = 'number'
        then (ee.payload->>'qty_kg')::numeric

      when ee.type = 'breeding'
        and jsonb_typeof(ee.payload->'quantity') = 'number'
        then (ee.payload->>'quantity')::numeric

      when ee.type = 'mortality'
        and jsonb_typeof(ee.payload->'quantity') = 'number'
        then (ee.payload->>'quantity')::numeric

      when ee.type = 'fertilizer_applied'
        and jsonb_typeof(ee.payload->'amount') = 'number'
        then (ee.payload->>'amount')::numeric

      else null
    end as metric_value,

    case
      when ee.type = 'harvest'
        then nullif(trim(ee.payload->>'unit'), '')

      when ee.type = 'egg_count'
        then 'eggs'

      when ee.type = 'weight_check'
        then 'kg'

      when ee.type = 'feed_given'
        then 'kg'

      when ee.type in ('breeding', 'mortality')
        then 'count'

      when ee.type = 'fertilizer_applied'
        then nullif(trim(ee.payload->>'unit'), '')

      else null
    end as metric_unit

  from entity_events ee
  join allowed_entities ae
    on ae.id = ee.entity_id
  join farm_entities fe
    on fe.id = ee.entity_id
  join species_config sc
    on sc.id = fe.species_config_id

  where ee.reversed_at is null
    and ee.type in (
      'harvest',
      'egg_count',
      'weight_check',
      'feed_given',
      'breeding',
      'mortality',
      'fertilizer_applied',
      'planting',
      'irrigation',
      'pest_observation',
      'growth_stage',
      'processing',
      'treatment',
      'health_note',
      'other'
    )

  order by ee.occurred_at desc, ee.created_at desc
  limit greatest(1, least(coalesce(p_limit, 10), 50));
$$;

revoke all on function public.get_investor_project_recent_activity(uuid, integer)
from public;

grant execute on function public.get_investor_project_recent_activity(uuid, integer)
to authenticated;