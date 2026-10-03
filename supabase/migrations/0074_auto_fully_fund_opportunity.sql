-- 0074: Automatically mark investment opportunities as fully funded.
--
-- An opportunity becomes fully_funded when actual contribution transactions
-- linked to investments for that opportunity reach or exceed its target.
--
-- The transition is intentionally one-way:
-- open -> fully_funded
--
-- A refund does not reopen an already fully-funded opportunity.

create or replace function public.mark_investment_opportunity_fully_funded()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_opportunity_id uuid;
  v_target_amount numeric;
  v_total_contributed numeric;
begin
  select i.opportunity_id
  into v_opportunity_id
  from public.investments i
  where i.id = new.investment_id;

  if v_opportunity_id is null then
    return new;
  end if;

  if new.type <> 'contribution' then
    return new;
  end if;

  select target_amount
  into v_target_amount
  from public.investment_opportunities
  where id = v_opportunity_id;

  if v_target_amount is null then
    return new;
  end if;

  select coalesce(sum(it.amount), 0)
  into v_total_contributed
  from public.investment_transactions it
  join public.investments i
    on i.id = it.investment_id
  where i.opportunity_id = v_opportunity_id
    and it.type = 'contribution';

  if v_total_contributed >= v_target_amount then
    update public.investment_opportunities
    set status = 'fully_funded'
    where id = v_opportunity_id
      and status = 'open';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_mark_investment_opportunity_fully_funded
on public.investment_transactions;

create trigger trg_mark_investment_opportunity_fully_funded
after insert
on public.investment_transactions
for each row
execute function public.mark_investment_opportunity_fully_funded();