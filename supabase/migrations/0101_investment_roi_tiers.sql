create table public.investment_roi_tiers (
  id uuid primary key default gen_random_uuid(),

  minimum_multiplier numeric(8,2) not null,
  roi_bonus_percent numeric(5,2) not null,

  created_at timestamptz not null default now(),

  constraint investment_roi_tiers_multiplier_positive
    check (minimum_multiplier >= 1),

  constraint investment_roi_tiers_bonus_nonnegative
    check (roi_bonus_percent >= 0),

  constraint investment_roi_tiers_bonus_max
    check (roi_bonus_percent <= 20)
);

create unique index investment_roi_tiers_multiplier_unique
  on public.investment_roi_tiers (minimum_multiplier);