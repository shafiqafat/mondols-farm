create or replace function public.get_investor_project_species_breakdown(
  p_project_id uuid
)
returns table (
  species_config_id uuid,
  species_name text,
  category text,
  entity_count bigint,
  active_entity_count bigint,
  total_quantity numeric
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
  )

  select
    sc.id as species_config_id,
    sc.name as species_name,
    sc.category,
    count(fe.id) as entity_count,
    count(fe.id) filter (
      where fe.status = 'active'
    ) as active_entity_count,
    coalesce(sum(fe.quantity), 0) as total_quantity
  from farm_entities fe
  join species_config sc
    on sc.id = fe.species_config_id
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
  group by
    sc.id,
    sc.name,
    sc.category
  order by
    sc.name;
$$;

revoke all
on function public.get_investor_project_species_breakdown(uuid)
from public;

grant execute
on function public.get_investor_project_species_breakdown(uuid)
to authenticated;