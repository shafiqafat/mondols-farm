-- 0069: Investor project exposure.
--
-- Controlled investor-facing project data.
-- Access is derived from investment allocations.
--
-- This function is SECURITY DEFINER because normal FarmOS RLS is
-- intentionally admin/operator-oriented. The function itself performs
-- the investor authorization check before returning any project data.

create or replace function public.get_investor_project_exposure(
  p_project_id uuid,
  p_species_config_id uuid default null
)
returns table (
  project_id uuid,
  project_name text,
  project_type text,
  project_purpose text,
  project_started_at date,
  project_target_end_at date,
  project_completed_at date,
  project_status text,

  allocation_id uuid,
  investment_id uuid,
  scope_type text,
  amount_allocated numeric,
  participation_pct numeric,

  species_config_id uuid,
  species_name text,
  species_category text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    fp.id,
    fp.name,
    fp.project_type,
    fp.purpose,
    fp.started_at,
    fp.target_end_at,
    fp.completed_at,
    fp.status,

    ia.id,
    ia.investment_id,
    ia.scope_type,
    ia.amount_allocated,
    ia.participation_pct,

    ia.species_config_id,
    sc.name,
    sc.category

  from public.investment_allocations ia

  join public.investments i
    on i.id = ia.investment_id

  join public.investors inv
    on inv.id = i.investor_id

  join public.farm_projects fp
    on fp.id = ia.project_id

  left join public.species_config sc
    on sc.id = ia.species_config_id

  where inv.user_id = auth.uid()
    and inv.status = 'active'
    and i.status in ('active', 'completed')
    and ia.project_id = p_project_id
    and (
      ia.scope_type = 'full_project'

      or (
        ia.scope_type = 'species_activity'
        and ia.species_config_id = p_species_config_id
      )

      or (
        ia.scope_type = 'partial'
        and (
          ia.species_config_id is null
          or ia.species_config_id = p_species_config_id
        )
      )
    );
$$;

revoke all
on function public.get_investor_project_exposure(uuid, uuid)
from public;

grant execute
on function public.get_investor_project_exposure(uuid, uuid)
to authenticated;