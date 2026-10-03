-- 0066: Investor portfolio overview.
--
-- One row per investment allocation.
-- This allows a single investment to be split across multiple projects
-- and/or species activities.

create or replace view public.investor_portfolio
with (security_invoker = true)
as
with contribution_totals as (
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
  group by it.investment_id
)
select
  i.id as investment_id,
  i.investor_id,
  inv.name as investor_name,

  i.opportunity_id,
  io.title as opportunity_title,

  i.committed_amount,
  coalesce(ct.contributed_amount, 0) as contributed_amount,
  coalesce(ct.distributed_amount, 0) as distributed_amount,
  coalesce(ct.refunded_amount, 0) as refunded_amount,

  greatest(
    i.committed_amount
      - coalesce(ct.contributed_amount, 0)
      + coalesce(ct.refunded_amount, 0),
    0
  ) as outstanding_commitment,

  i.status as investment_status,
  i.invested_at,

  ia.id as allocation_id,
  ia.scope_type,
  ia.amount_allocated,
  ia.participation_pct,

  ia.project_id,
  fp.name as project_name,
  fp.project_type,
  fp.purpose,
  fp.started_at as project_started_at,
  fp.status as project_status,
  fp.target_end_at,
  fp.completed_at,

  ia.species_config_id,
  sc.name as species_name,
  sc.category as species_category

from public.investments i

join public.investors inv
  on inv.id = i.investor_id

left join public.investment_opportunities io
  on io.id = i.opportunity_id

left join contribution_totals ct
  on ct.investment_id = i.id

left join public.investment_allocations ia
  on ia.investment_id = i.id

left join public.farm_projects fp
  on fp.id = ia.project_id

left join public.species_config sc
  on sc.id = ia.species_config_id;