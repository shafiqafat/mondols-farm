-- 0070: Controlled investor-facing entity exposure.
--
-- Investors receive only entities belonging to projects/species
-- covered by their investment allocations.
--
-- Raw entity_events are intentionally not exposed here.

create or replace function public.get_investor_entity_exposure(
  p_project_id uuid,
  p_species_config_id uuid default null
)
returns table (
  project_id uuid,
  project_name text,

  entity_id uuid,
  entity_code text,
  entity_name text,

  species_config_id uuid,
  species_name text,
  species_category text,

  variant_id uuid,
  tracking_mode text,
  status text,
  quantity numeric,

  allocation_scope_type text,
  allocation_id uuid,
  investment_id uuid,
  amount_allocated numeric,
  participation_pct numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    fe.project_id,
    fp.name,

    fe.id,
    fe.entity_code,
    fe.entity_name,

    fe.species_config_id,
    sc.name,
    sc.category,

    fe.variant_id,
    fe.tracking_mode,
    fe.status,
    fe.quantity,

    ia.scope_type,
    ia.id,
    ia.investment_id,
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

  where inv.user_id = auth.uid()
    and inv.status = 'active'
    and i.status in ('active', 'completed')

    and fe.project_id = p_project_id

    and (
      ia.scope_type = 'full_project'

      or (
        ia.scope_type = 'species_activity'
        and ia.species_config_id = fe.species_config_id
        and (
          p_species_config_id is null
          or fe.species_config_id = p_species_config_id
        )
      )

      or (
        ia.scope_type = 'partial'
        and (
          ia.species_config_id is null
          or ia.species_config_id = fe.species_config_id
        )
        and (
          p_species_config_id is null
          or fe.species_config_id = p_species_config_id
        )
      )
    );
$$;

revoke all
on function public.get_investor_entity_exposure(uuid, uuid)
from public;

grant execute
on function public.get_investor_entity_exposure(uuid, uuid)
to authenticated;