drop function if exists public.get_investor_opportunities();

create or replace function public.get_investor_opportunities()
returns table (
  opportunity_id uuid,
  title text,
  description text,
  project_id uuid,
  species_config_id uuid,
  target_amount numeric,
  minimum_amount numeric,
  total_committed numeric,
  total_contributed numeric,
  remaining_target numeric,
  status text,
  visibility text,
  opened_at timestamptz,
  closes_at timestamptz,
  roi_duration_months integer,
  roi_min_percent numeric,
  roi_max_percent numeric,
  roi_max_percent_cap numeric
)
language sql
security definer
set search_path = public
as $$
  with investment_totals as (
    select
      i.opportunity_id,

      coalesce(
        sum(i.committed_amount),
        0
      ) as total_committed

    from public.investments i

    where i.status = 'active'

    group by i.opportunity_id
  ),

  transaction_totals as (
    select
      i.opportunity_id,

      coalesce(
        sum(
          case
            when it.type = 'contribution' then it.amount
            when it.type = 'refund' then -it.amount
            else 0
          end
        ),
        0
      ) as total_contributed

    from public.investments i

    join public.investment_transactions it
      on it.investment_id = i.id

    where i.status = 'active'

    group by i.opportunity_id
  )

  select
    io.id as opportunity_id,
    io.title,
    io.description,
    io.project_id,
    io.species_config_id,
    io.target_amount,
    io.minimum_amount,

    coalesce(
      inv.total_committed,
      0
    ) as total_committed,

    coalesce(
      tx.total_contributed,
      0
    ) as total_contributed,

    greatest(
      io.target_amount
      - coalesce(tx.total_contributed, 0),
      0
    ) as remaining_target,

    io.status,
    io.visibility,
    io.opened_at::timestamptz,
    io.closes_at::timestamptz,

    io.roi_duration_months,
    io.roi_min_percent,
    io.roi_max_percent,
    io.roi_max_percent_cap

  from public.investment_opportunities io

  left join investment_totals inv
    on inv.opportunity_id = io.id

  left join transaction_totals tx
    on tx.opportunity_id = io.id

  where
    io.visibility = 'investors'
    and io.status in ('upcoming', 'open')

  order by
    io.opened_at desc nulls last,
    io.created_at desc;
$$;

revoke all
on function public.get_investor_opportunities()
from public;

grant execute
on function public.get_investor_opportunities()
to authenticated;