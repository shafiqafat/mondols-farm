alter table public.investments
  add column roi_base_min_percent numeric(5,2),
  add column roi_base_max_percent numeric(5,2),
  add column roi_bonus_percent numeric(5,2) not null default 0,
  add column roi_final_min_percent numeric(5,2),
  add column roi_final_max_percent numeric(5,2),
  add column roi_duration_months integer,
  add column roi_max_percent_cap numeric(5,2);

alter table public.investments
  add constraint investments_roi_base_min_nonnegative
    check (
      roi_base_min_percent is null
      or roi_base_min_percent >= 0
    ),
  add constraint investments_roi_base_max_valid
    check (
      roi_base_max_percent is null
      or roi_base_max_percent >= 0
    ),
  add constraint investments_roi_base_range_valid
    check (
      roi_base_min_percent is null
      or roi_base_max_percent is null
      or roi_base_max_percent >= roi_base_min_percent
    ),
  add constraint investments_roi_bonus_nonnegative
    check (
      roi_bonus_percent >= 0
    ),
  add constraint investments_roi_final_min_nonnegative
    check (
      roi_final_min_percent is null
      or roi_final_min_percent >= 0
    ),
  add constraint investments_roi_final_max_valid
    check (
      roi_final_max_percent is null
      or roi_final_max_percent >= 0
    ),
  add constraint investments_roi_final_range_valid
    check (
      roi_final_min_percent is null
      or roi_final_max_percent is null
      or roi_final_max_percent >= roi_final_min_percent
    ),
  add constraint investments_roi_duration_valid
    check (
      roi_duration_months is null
      or roi_duration_months > 0
    ),
  add constraint investments_roi_cap_valid
    check (
      roi_max_percent_cap is null
      or (
        roi_max_percent_cap >= 0
        and roi_max_percent_cap <= 100
      )
    ),
  add constraint investments_roi_within_cap
    check (
      roi_final_max_percent is null
      or roi_max_percent_cap is null
      or roi_final_max_percent <= roi_max_percent_cap
    );