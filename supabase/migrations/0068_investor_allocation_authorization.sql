-- 0068: Investor allocation authorization.
--
-- Determines whether the currently authenticated investor has access
-- to a project and, optionally, a species/activity within that project.
--
-- Investors remain separate from farm_user_roles.

create or replace function public.investor_can_access_project(
  p_project_id uuid,
  p_species_config_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.investment_allocations ia
    join public.investments i
      on i.id = ia.investment_id
    join public.investors inv
      on inv.id = i.investor_id
    where inv.user_id = auth.uid()
      and inv.status = 'active'
      and i.status in ('active', 'completed')
      and ia.project_id = p_project_id
      and (
        /*
         * Full-project allocation grants access to the whole project.
         */
        ia.scope_type = 'full_project'

        or

        /*
         * Species/activity allocation grants access only when the
         * requested species matches the allocation.
         */
        (
          ia.scope_type = 'species_activity'
          and ia.species_config_id = p_species_config_id
        )

        or

        /*
         * Partial allocation:
         * if a species is specified on the allocation, the requested
         * species must match it.
         * If no species is specified, the allocation applies to the
         * project.
         */
        (
          ia.scope_type = 'partial'
          and (
            ia.species_config_id is null
            or ia.species_config_id = p_species_config_id
          )
        )
      )
  );
$$;

revoke all
on function public.investor_can_access_project(uuid, uuid)
from public;

grant execute
on function public.investor_can_access_project(uuid, uuid)
to authenticated;