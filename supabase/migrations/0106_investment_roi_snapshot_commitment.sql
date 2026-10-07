-- Mondol's Farm OS
-- 0106
-- Snapshot ROI terms when an investor commitment is created.


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
  v_opportunity public.investment_opportunities%rowtype;

  v_existing_committed numeric;
  v_remaining_amount numeric;

  v_investment_id uuid;

  v_roi record;
begin

  -- ---------------------------------------------------------------
  -- 1. Resolve the authenticated investor
  -- ---------------------------------------------------------------

  v_investor_id := public.current_investor_id();

  if v_investor_id is null then
    raise exception
      'Authenticated investor profile not found';
  end if;


  -- ---------------------------------------------------------------
  -- 2. Validate commitment amount
  -- ---------------------------------------------------------------

  if p_committed_amount is null
     or p_committed_amount <= 0 then

    raise exception
      'Commitment amount must be greater than zero';

  end if;


  -- ---------------------------------------------------------------
  -- 3. Lock the opportunity
  --
  -- This prevents two investors from simultaneously committing
  -- more than the remaining target.
  -- ---------------------------------------------------------------

  select *
  into v_opportunity
  from public.investment_opportunities
  where id = p_opportunity_id
  for update;


  if not found then
    raise exception
      'Investment opportunity not found';
  end if;


  -- ---------------------------------------------------------------
  -- 4. Validate opportunity status
  -- ---------------------------------------------------------------

  if v_opportunity.status <> 'open' then
    raise exception
      'This investment opportunity is not open';
  end if;


  -- ---------------------------------------------------------------
  -- 5. Validate investor visibility
  -- ---------------------------------------------------------------

  if v_opportunity.visibility not in ('investors', 'public') then
    raise exception
      'This investment opportunity is not available to investors';
  end if;


  -- ---------------------------------------------------------------
  -- 6. Validate minimum investment
  -- ---------------------------------------------------------------

  if v_opportunity.minimum_amount is not null
     and p_committed_amount < v_opportunity.minimum_amount then

    raise exception
      'Commitment amount (%) is below the minimum investment amount (%)',
      p_committed_amount,
      v_opportunity.minimum_amount;

  end if;


  -- ---------------------------------------------------------------
  -- 7. Calculate existing commitments
  -- ---------------------------------------------------------------

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


  -- ---------------------------------------------------------------
  -- 8. Prevent over-commitment
  -- ---------------------------------------------------------------

  if p_committed_amount > v_remaining_amount then
    raise exception
      'Commitment amount (%) exceeds the remaining opportunity capacity (%)',
      p_committed_amount,
      v_remaining_amount;
  end if;


  -- ---------------------------------------------------------------
  -- 9. Calculate ROI using the current opportunity terms
  -- ---------------------------------------------------------------

  select *
  into v_roi
  from public.calculate_investment_roi(
    p_opportunity_id,
    p_committed_amount
  );


  if not found then
    raise exception
      'Unable to calculate ROI for this investment opportunity';
  end if;


  -- ---------------------------------------------------------------
  -- 10. Create investment
  --
  -- The ROI values are copied into the investment row.
  -- This becomes the historical ROI snapshot for this investment.
  -- ---------------------------------------------------------------

  insert into public.investments (
    investor_id,
    opportunity_id,
    committed_amount,
    invested_at,
    status,
    notes,

    roi_base_min_percent,
    roi_base_max_percent,
    roi_bonus_percent,
    roi_final_min_percent,
    roi_final_max_percent,
    roi_duration_months,
    roi_max_percent_cap
  )
  values (
    v_investor_id,
    p_opportunity_id,
    p_committed_amount,
    now(),
    'active',
    nullif(trim(p_notes), ''),

    v_roi.base_roi_min_percent,
    v_roi.base_roi_max_percent,
    v_roi.roi_bonus_percent,
    v_roi.final_roi_min_percent,
    v_roi.final_roi_max_percent,
    v_opportunity.roi_duration_months,
    v_opportunity.roi_max_percent_cap
  )
  returning id
  into v_investment_id;


  return v_investment_id;

end;
$$;


-- Keep the same permission model as the existing 0081 function.

revoke all
on function public.create_investor_commitment(uuid, numeric, text)
from public;


grant execute
on function public.create_investor_commitment(uuid, numeric, text)
to authenticated;