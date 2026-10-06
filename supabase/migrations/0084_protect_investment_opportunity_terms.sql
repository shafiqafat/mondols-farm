create or replace function public.validate_investment_opportunity_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
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

  end if;

  return new;
end;
$$;


drop trigger if exists trg_validate_investment_opportunity_update
on public.investment_opportunities;


create trigger trg_validate_investment_opportunity_update
before update on public.investment_opportunities
for each row
execute function public.validate_investment_opportunity_update();