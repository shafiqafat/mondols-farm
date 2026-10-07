-- Mondol's Farm OS
-- 0107
-- Protect ROI terms after an investment exists.


create or replace function public.validate_investment_opportunity_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin

  -- ---------------------------------------------------------------
  -- Existing investment-term protection
  -- ---------------------------------------------------------------

  if exists (
    select 1
    from public.investments i
    where i.opportunity_id = old.id
  ) then

    if new.target_amount is distinct from old.target_amount then
      raise exception
        'Target amount cannot be changed after investments exist for this opportunity.';
    end if;

    if new.minimum_amount is distinct from old.minimum_amount then
      raise exception
        'Minimum investment cannot be changed after investments exist for this opportunity.';
    end if;

    if new.project_id is distinct from old.project_id then
      raise exception
        'Linked project cannot be changed after investments exist for this opportunity.';
    end if;

    if new.species_config_id is distinct from old.species_config_id then
      raise exception
        'Species or activity cannot be changed after investments exist for this opportunity.';
    end if;


    -- -------------------------------------------------------------
    -- ROI protection
    -- -------------------------------------------------------------

    if new.roi_min_percent is distinct from old.roi_min_percent then
      raise exception
        'ROI minimum cannot be changed after investments exist for this opportunity.';
    end if;

    if new.roi_max_percent is distinct from old.roi_max_percent then
      raise exception
        'ROI maximum cannot be changed after investments exist for this opportunity.';
    end if;

    if new.roi_duration_months is distinct from old.roi_duration_months then
      raise exception
        'ROI duration cannot be changed after investments exist for this opportunity.';
    end if;

    if new.roi_max_percent_cap is distinct from old.roi_max_percent_cap then
      raise exception
        'ROI cap cannot be changed after investments exist for this opportunity.';
    end if;

  end if;

  return new;
end;
$$;


revoke all
on function public.validate_investment_opportunity_update()
from public;

grant execute
on function public.validate_investment_opportunity_update()
to authenticated;