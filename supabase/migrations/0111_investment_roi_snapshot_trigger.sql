-- Mondol's Farm OS
-- 0111
-- Automatically snapshot ROI terms for every new opportunity-linked investment.

create or replace function public.snapshot_investment_roi_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_opportunity public.investment_opportunities%rowtype;
  v_roi record;
begin
  -- Direct investments without an opportunity do not have
  -- opportunity-based ROI terms to snapshot.
  if new.opportunity_id is null then
    return new;
  end if;

  -- Load the opportunity terms at the moment the investment is created.
  select *
  into v_opportunity
  from public.investment_opportunities
  where id = new.opportunity_id;

  if not found then
    raise exception
      'Investment opportunity not found';
  end if;

  -- Calculate the ROI for this exact committed amount.
  select *
  into v_roi
  from public.calculate_investment_roi(
    new.opportunity_id,
    new.committed_amount
  );

  if not found then
    raise exception
      'Unable to calculate ROI for this investment opportunity';
  end if;

  -- Store the historical ROI snapshot on the investment.
  new.roi_base_min_percent := v_roi.base_roi_min_percent;
  new.roi_base_max_percent := v_roi.base_roi_max_percent;
  new.roi_bonus_percent := v_roi.roi_bonus_percent;
  new.roi_final_min_percent := v_roi.final_roi_min_percent;
  new.roi_final_max_percent := v_roi.final_roi_max_percent;
  new.roi_duration_months := v_opportunity.roi_duration_months;
  new.roi_max_percent_cap := v_opportunity.roi_max_percent_cap;

  return new;
end;
$function$;


drop trigger if exists trg_snapshot_investment_roi
on public.investments;


create trigger trg_snapshot_investment_roi
before insert on public.investments
for each row
execute function public.snapshot_investment_roi_on_insert();


revoke all
on function public.snapshot_investment_roi_on_insert()
from public;


grant execute
on function public.snapshot_investment_roi_on_insert()
to authenticated;