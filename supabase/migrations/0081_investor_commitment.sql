create or replace function public.create_investor_commitment(
  p_opportunity_id uuid,
  p_committed_amount numeric,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_investor_id uuid;
  v_opportunity investment_opportunities%rowtype;
  v_existing_committed numeric;
  v_remaining_amount numeric;
  v_investment_id uuid;
begin
  -- Resolve the authenticated investor.
  v_investor_id := public.current_investor_id();

  if v_investor_id is null then
    raise exception 'Authenticated investor profile not found';
  end if;

  -- Validate amount.
  if p_committed_amount is null or p_committed_amount <= 0 then
    raise exception 'Commitment amount must be greater than zero';
  end if;

  -- Lock the opportunity so concurrent commitments cannot
  -- exceed the remaining target.
  select *
  into v_opportunity
  from public.investment_opportunities
  where id = p_opportunity_id
  for update;

  if not found then
    raise exception 'Investment opportunity not found';
  end if;

  if v_opportunity.status <> 'open' then
    raise exception 'This investment opportunity is not open';
  end if;

  if v_opportunity.visibility not in ('investors', 'public') then
    raise exception 'This investment opportunity is not available to investors';
  end if;

  if v_opportunity.minimum_amount is not null
     and p_committed_amount < v_opportunity.minimum_amount then
    raise exception
      'Commitment amount (%) is below the minimum investment amount (%)',
      p_committed_amount,
      v_opportunity.minimum_amount;
  end if;

  select coalesce(sum(i.committed_amount), 0)
  into v_existing_committed
  from public.investments i
  where i.opportunity_id = p_opportunity_id
    and i.status <> 'cancelled';

  v_remaining_amount :=
    greatest(
      v_opportunity.target_amount - v_existing_committed,
      0
    );

  if p_committed_amount > v_remaining_amount then
    raise exception
      'Commitment amount (%) exceeds the remaining opportunity capacity (%)',
      p_committed_amount,
      v_remaining_amount;
  end if;

  insert into public.investments (
    investor_id,
    opportunity_id,
    committed_amount,
    invested_at,
    status,
    notes
  )
  values (
    v_investor_id,
    p_opportunity_id,
    p_committed_amount,
    now(),
    'active',
    nullif(trim(p_notes), '')
  )
  returning id into v_investment_id;

  return v_investment_id;
end;
$$;

grant execute
on function public.create_investor_commitment(uuid, numeric, text)
to authenticated;

revoke execute
on function public.create_investor_commitment(uuid, numeric, text)
from public;