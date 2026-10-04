create or replace function public.get_investor_investment_exposure(
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
  total_quantity numeric
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
      sum(fe.quantity),
      0
    ) as total_quantity

  from public.investment_allocations ia

  join public.investments i
    on i.id = ia.investment_id

  join public.investors inv
    on inv.id = i.investor_id

  join public.farm_projects fp
    on fp.id = ia.project_id

  left join public.species_config sc
    on sc.id = ia.species_config_id

  left join public.farm_entities fe
    on fe.project_id = ia.project_id
    and (
      ia.scope_type = 'full_project'

      or (
        ia.scope_type = 'species_activity'
        and fe.species_config_id = ia.species_config_id
      )

      or (
        ia.scope_type = 'partial'
        and (
          ia.species_config_id is null
          or fe.species_config_id = ia.species_config_id
        )
      )
    )

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

  order by ia.created_at;
$function$;

grant execute
on function public.get_investor_investment_exposure(uuid)
to authenticated;

revoke execute
on function public.get_investor_investment_exposure(uuid)
from public;