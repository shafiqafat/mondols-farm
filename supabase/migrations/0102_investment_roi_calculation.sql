create or replace function public.calculate_investment_roi(
  p_opportunity_id uuid,
  p_investment_amount numeric
)
returns table (
  base_roi_min_percent numeric,
  base_roi_max_percent numeric,
  roi_bonus_percent numeric,
  final_roi_min_percent numeric,
  final_roi_max_percent numeric,
  estimated_profit_min numeric,
  estimated_profit_max numeric,
  estimated_total_min numeric,
  estimated_total_max numeric
)
language sql
security definer
set search_path = public
as $$
  with opportunity_data as (
    select
      io.minimum_amount,
      io.roi_min_percent,
      io.roi_max_percent,
      coalesce(io.roi_max_percent_cap, 20.00) as roi_cap
    from investment_opportunities io
    where io.id = p_opportunity_id
      and p_investment_amount > 0
  ),

  applicable_tier as (
    select
      od.*,
      coalesce(
        (
          select t.roi_bonus_percent
          from investment_roi_tiers t
          where p_investment_amount >=
            od.minimum_amount * t.minimum_multiplier
          order by t.minimum_multiplier desc
          limit 1
        ),
        0
      ) as bonus
    from opportunity_data od
  ),

  calculated as (
    select
      roi_min_percent,
      roi_max_percent,
      bonus,
      roi_cap,
      least(
        roi_min_percent + bonus,
        roi_cap
      ) as final_min,
      least(
        roi_max_percent + bonus,
        roi_cap
      ) as final_max
    from applicable_tier
  )

  select
    roi_min_percent as base_roi_min_percent,
    roi_max_percent as base_roi_max_percent,
    bonus as roi_bonus_percent,

    final_min as final_roi_min_percent,
    final_max as final_roi_max_percent,

    round(
      p_investment_amount * final_min / 100,
      2
    ) as estimated_profit_min,

    round(
      p_investment_amount * final_max / 100,
      2
    ) as estimated_profit_max,

    round(
      p_investment_amount +
      (p_investment_amount * final_min / 100),
      2
    ) as estimated_total_min,

    round(
      p_investment_amount +
      (p_investment_amount * final_max / 100),
      2
    ) as estimated_total_max

  from calculated;
$$;

revoke all
on function public.calculate_investment_roi(uuid, numeric)
from public;

grant execute
on function public.calculate_investment_roi(uuid, numeric)
to authenticated;