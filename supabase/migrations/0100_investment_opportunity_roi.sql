alter table public.investment_opportunities
  add column roi_min_percent numeric(5,2),
  add column roi_max_percent numeric(5,2),
  add column roi_duration_months integer,
  add column roi_max_percent_cap numeric(5,2)
    default 20.00;

alter table public.investment_opportunities
  add constraint investment_opportunities_roi_min_nonnegative
    check (
      roi_min_percent is null
      or roi_min_percent >= 0
    );

alter table public.investment_opportunities
  add constraint investment_opportunities_roi_max_valid
    check (
      roi_max_percent is null
      or roi_max_percent >= 0
    );

alter table public.investment_opportunities
  add constraint investment_opportunities_roi_range_valid
    check (
      roi_min_percent is null
      or roi_max_percent is null
      or roi_max_percent >= roi_min_percent
    );

alter table public.investment_opportunities
  add constraint investment_opportunities_roi_duration_valid
    check (
      roi_duration_months is null
      or roi_duration_months > 0
    );

alter table public.investment_opportunities
  add constraint investment_opportunities_roi_cap_valid
    check (
      roi_max_percent_cap is null
      or (
        roi_max_percent_cap >= 0
        and roi_max_percent_cap <= 100
      )
    );

alter table public.investment_opportunities
  add constraint investment_opportunities_roi_within_cap
    check (
      roi_max_percent is null
      or roi_max_percent_cap is null
      or roi_max_percent <= roi_max_percent_cap
    );