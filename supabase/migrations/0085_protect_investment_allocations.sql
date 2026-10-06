create or replace function public.validate_investment_allocation_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.investment_id is distinct from old.investment_id then
    raise exception
      'Investment allocation cannot be moved to another investment.';
  end if;

  if new.project_id is distinct from old.project_id then
    raise exception
      'Project cannot be changed after an investment allocation is created.';
  end if;

  if new.species_config_id is distinct from old.species_config_id then
    raise exception
      'Species or activity cannot be changed after an investment allocation is created.';
  end if;

  if new.scope_type is distinct from old.scope_type then
    raise exception
      'Allocation scope cannot be changed after an investment allocation is created.';
  end if;

  if new.amount_allocated is distinct from old.amount_allocated then
    raise exception
      'Allocated amount cannot be changed after an investment allocation is created.';
  end if;

  if new.participation_pct is distinct from old.participation_pct then
    raise exception
      'Participation percentage cannot be changed after an investment allocation is created.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_investment_allocation_update
on public.investment_allocations;

create trigger trg_validate_investment_allocation_update
before update on public.investment_allocations
for each row
execute function public.validate_investment_allocation_update();