insert into public.investment_roi_tiers (
  minimum_multiplier,
  roi_bonus_percent
)
values
  (1.00, 0.00),
  (2.00, 1.00),
  (3.00, 2.00),
  (5.00, 3.00)
on conflict (minimum_multiplier)
do update set
  roi_bonus_percent = excluded.roi_bonus_percent;