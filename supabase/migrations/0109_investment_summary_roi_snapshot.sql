drop function if exists public.get_investor_investment_summary(uuid);

create function public.get_investor_investment_summary(
  p_investment_id uuid
)
returns table (
  investment_id uuid,
  investor_id uuid,
  investor_name text,

  opportunity_id uuid,
  opportunity_title text,

  committed_amount numeric,
  contributed_amount numeric,
  allocated_amount numeric,
  distributed_amount numeric,
  refunded_amount numeric,

  outstanding_commitment numeric,
  unallocated_contribution numeric,

  allocation_percentage numeric,

  investment_status text,
  invested_at date,

  roi_base_min_percent numeric,
  roi_base_max_percent numeric,
  roi_bonus_percent numeric,
  roi_final_min_percent numeric,
  roi_final_max_percent numeric,
  roi_duration_months integer,
  roi_max_percent_cap numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with transaction_totals as (
    select
      it.investment_id,

      coalesce(
        sum(it.amount) filter (
          where it.type = 'contribution'
        ),
        0
      ) as contributed_amount,

      coalesce(
        sum(it.amount) filter (
          where it.type = 'distribution'
        ),
        0
      ) as distributed_amount,

      coalesce(
        sum(it.amount) filter (
          where it.type = 'refund'
        ),
        0
      ) as refunded_amount

    from public.investment_transactions it

    where it.investment_id = p_investment_id

    group by it.investment_id
  ),

  allocation_totals as (
    select
      ia.investment_id,
      coalesce(
        sum(ia.amount_allocated),
        0
      ) as allocated_amount

    from public.investment_allocations ia

    where ia.investment_id = p_investment_id

    group by ia.investment_id
  )

  select
    i.id,
    inv.id,
    inv.name,

    i.opportunity_id,
    io.title,

    i.committed_amount,

    coalesce(
      tt.contributed_amount,
      0
    ),

    coalesce(
      at.allocated_amount,
      0
    ),

    coalesce(
      tt.distributed_amount,
      0
    ),

    coalesce(
      tt.refunded_amount,
      0
    ),

    greatest(
      i.committed_amount
        - coalesce(tt.contributed_amount, 0)
        + coalesce(tt.refunded_amount, 0),
      0
    ),

    greatest(
      coalesce(tt.contributed_amount, 0)
        - coalesce(at.allocated_amount, 0),
      0
    ),

    case
      when i.committed_amount > 0 then
        round(
          (
            coalesce(at.allocated_amount, 0)
            / i.committed_amount
          ) * 100,
          2
        )
      else 0
    end,

    i.status,
    i.invested_at,

    i.roi_base_min_percent,
    i.roi_base_max_percent,
    i.roi_bonus_percent,
    i.roi_final_min_percent,
    i.roi_final_max_percent,
    i.roi_duration_months,
    i.roi_max_percent_cap

  from public.investments i

  join public.investors inv
    on inv.id = i.investor_id

  left join public.investment_opportunities io
    on io.id = i.opportunity_id

  left join transaction_totals tt
    on tt.investment_id = i.id

  left join allocation_totals at
    on at.investment_id = i.id

  where i.id = p_investment_id
    and inv.user_id = auth.uid()
    and inv.status = 'active';
$$;

revoke all
on function public.get_investor_investment_summary(uuid)
from public;

grant execute
on function public.get_investor_investment_summary(uuid)
to authenticated;