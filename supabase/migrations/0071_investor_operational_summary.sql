-- 0071: Investor operational summary.
--
-- Provides aggregate operational information for projects/entities
-- covered by an investor's allocation.

create or replace function public.get_investor_operational_summary(
  p_project_id uuid,
  p_species_config_id uuid default null
)
returns table (
  project_id uuid,
  project_name text,

  species_config_id uuid,
  species_name text,
  species_category text,

  entity_count bigint,
  total_quantity numeric,

  active_entity_count bigint,
  closed_entity_count bigint,

  event_count bigint,

  allocation_id uuid,
  investment_id uuid,
  scope_type text,
  amount_allocated numeric,
  participation_pct numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    fp.id,
    fp.name,

    fe.species_config_id,
    sc.name,
    sc.category,

    count(distinct fe.id) as entity_count,

    coalesce(
      sum(coalesce(fe.quantity, 0)),
      0
    ) as total_quantity,

    count(distinct fe.id) filter (
      where fe.status = 'active'
    ) as active_entity_count,

    count(distinct fe.id) filter (
      where fe.status <> 'active'
    ) as closed_entity_count,

    count(distinct ee.id) as event_count,

    ia.id,
    ia.investment_id,
    ia.scope_type,
    ia.amount_allocated,
    ia.participation_pct

  from public.investment_allocations ia

  join public.investments i
    on i.id = ia.investment_id

  join public.investors inv
    on inv.id = i.investor_id

  join public.farm_projects fp
    on fp.id = ia.project_id

  join public.farm_entities fe
    on fe.project_id = ia.project_id

  left join public.species_config sc
    on sc.id = fe.species_config_id

  left join public.entity_events ee
    on ee.entity_id = fe.id
    and ee.reversed_at is null

  where inv.user_id = auth.uid()
    and inv.status = 'active'
    and i.status in ('active', 'completed')
    and ia.project_id = p_project_id

    and (
      ia.scope_type = 'full_project'

      or (
        ia.scope_type = 'species_activity'
        and ia.species_config_id = fe.species_config_id
      )

      or (
        ia.scope_type = 'partial'
        and (
          ia.species_config_id is null
          or ia.species_config_id = fe.species_config_id
        )
      )
    )

    and (
      p_species_config_id is null
      or fe.species_config_id = p_species_config_id
    )

  group by
    fp.id,
    fp.name,
    fe.species_config_id,
    sc.name,
    sc.category,
    ia.id,
    ia.investment_id,
    ia.scope_type,
    ia.amount_allocated,
    ia.participation_pct;
$$;

revoke all
on function public.get_investor_operational_summary(uuid, uuid)
from public;

grant execute
on function public.get_investor_operational_summary(uuid, uuid)
to authenticated;