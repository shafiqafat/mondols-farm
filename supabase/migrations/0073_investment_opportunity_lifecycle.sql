-- 0073: Enforce investment opportunity lifecycle transitions.
--
-- Opportunity status is intentionally controlled at the database level.
-- Fully funded is reserved for future automatic funding logic.

create or replace function public.validate_investment_opportunity_status_transition()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status = 'draft'
     and new.status in ('upcoming', 'open', 'cancelled') then
    return new;
  end if;

  if old.status = 'upcoming'
     and new.status in ('open', 'cancelled') then
    return new;
  end if;

  if old.status = 'open'
     and new.status in ('fully_funded', 'closed', 'cancelled') then
    return new;
  end if;

  if old.status = 'fully_funded'
     and new.status = 'closed' then
    return new;
  end if;

  raise exception
    'Invalid investment opportunity status transition: % → %',
    old.status,
    new.status;

end;
$$;

drop trigger if exists trg_validate_investment_opportunity_status
on public.investment_opportunities;

create trigger trg_validate_investment_opportunity_status
before update of status
on public.investment_opportunities
for each row
execute function public.validate_investment_opportunity_status_transition();