-- 0064: Investment lifetime overview.

create or replace view public.investment_overview
with (security_invoker = true)
as
with investment_totals as (
  select
    coalesce(sum(i.committed_amount), 0) as total_committed,
    count(*) as total_investments,
    count(*) filter (
      where i.status = 'active'
    ) as active_investments
  from public.investments i
),
transaction_totals as (
  select
    coalesce(sum(it.amount) filter (
      where it.type = 'contribution'
    ), 0) as total_contributed,

    coalesce(sum(it.amount) filter (
      where it.type = 'distribution'
    ), 0) as total_distributed,

    coalesce(sum(it.amount) filter (
      where it.type = 'refund'
    ), 0) as total_refunded
  from public.investment_transactions it
),
allocation_totals as (
  select
    coalesce(sum(ia.amount_allocated), 0) as total_allocated,
    count(distinct ia.project_id) as projects_funded
  from public.investment_allocations ia
),
investor_totals as (
  select
    count(*) filter (
      where inv.status = 'active'
    ) as active_investors
  from public.investors inv
)
select
  it.total_committed,
  tt.total_contributed,
  at.total_allocated,
  tt.total_distributed,
  tt.total_refunded,

  greatest(
    it.total_committed
      - tt.total_contributed
      + tt.total_refunded,
    0
  ) as outstanding_commitments,

  greatest(
    tt.total_contributed
      - at.total_allocated,
    0
  ) as unallocated_contributions,

  iv.active_investors,
  it.total_investments,
  it.active_investments,
  at.projects_funded

from investment_totals it
cross join transaction_totals tt
cross join allocation_totals at
cross join investor_totals iv;