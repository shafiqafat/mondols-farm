create or replace function public.get_investor_investment_operational_summary(
  p_investment_id uuid
)
returns table (
  allocation_id uuid,
  investment_id uuid,
  project_id uuid,
  project_name text,
  species_config_id uuid,
  species_name text,
  scope_type text,
  amount_allocated numeric,
  participation_pct numeric,
  entity_count bigint,
  total_quantity numeric,
  active_entity_count bigint,
  closed_entity_count bigint,
  event_count bigint
)
language sql
stable
security definer
set search_path = public
as $function$
  select
    ia.id as allocation_id,
    ia.investment_id,
    ia.project_id,
    fp.name as project_name,
    ia.species_config_id,
    sc.name as species_name,
    ia.scope_type,
    ia.amount_allocated,
    ia.participation_pct,

    count(fe.id) as entity_count,

    coalesce(
      sum(coalesce(fe.quantity, 0)),
      0
    ) as total_quantity,

    count(fe.id) filter (
      where fe.status not in (
        'sold',
        'deceased',
        'closed'
      )
    ) as active_entity_count,

    count(fe.id) filter (
      where fe.status in (
        'sold',
        'deceased',
        'closed'
      )
    ) as closed_entity_count,

    count(ee.id) filter (
      where ee.reversed_at is null
    ) as event_count

  from investment_allocations ia

  join investments i
    on i.id = ia.investment_id

  join investors inv
    on inv.id = i.investor_id

  join farm_projects fp
    on fp.id = ia.project_id

  left join species_config sc
    on sc.id = ia.species_config_id

  left join farm_entities fe
    on fe.project_id = ia.project_id
    and (
      ia.scope_type = 'full_project'
      or (
        ia.scope_type in ('species_activity', 'partial')
        and ia.species_config_id is not null
        and fe.species_config_id = ia.species_config_id
      )
      or (
        ia.scope_type = 'partial'
        and ia.species_config_id is null
      )
    )

  left join entity_events ee
    on ee.entity_id = fe.id

  where ia.investment_id = p_investment_id
    and inv.user_id = auth.uid()
    and inv.status = 'active'
    and i.status in ('active', 'completed')

  group by
    ia.id,
    ia.investment_id,
    ia.project_id,
    fp.name,
    ia.species_config_id,
    sc.name,
    ia.scope_type,
    ia.amount_allocated,
    ia.participation_pct

  order by
    fp.name,
    sc.name nulls first;
$function$;

grant execute on function public.get_investor_investment_operational_summary(uuid)
to authenticated;

revoke execute on function public.get_investor_investment_operational_summary(uuid)
from public;