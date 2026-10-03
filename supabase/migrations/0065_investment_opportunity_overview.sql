-- 0065: Investment opportunity overview.
--
-- Provides admin-facing opportunity metrics.
-- Commitment and actual contribution are intentionally separate.

create or replace view public.investment_opportunity_overview
with (security_invoker = true)
as
with commitment_totals as (
  select
    i.opportunity_id,
    coalesce(sum(i.committed_amount), 0) as total_committed,
    count(*) as investment_count
  from public.investments i
  where i.status <> 'cancelled'
  group by i.opportunity_id
),
contribution_totals as (
  select
    i.opportunity_id,
    coalesce(
      sum(it.amount) filter (
        where it.type = 'contribution'
      ),
      0
    ) as total_contributed
  from public.investments i
  join public.investment_transactions it
    on it.investment_id = i.id
  where i.status <> 'cancelled'
  group by i.opportunity_id
)
select
  io.id,
  io.title,
  io.description,

  io.project_id,
  fp.name as project_name,

  io.species_config_id,
  sc.name as species_name,

  io.target_amount,
  io.minimum_amount,

  coalesce(ct.total_committed, 0) as total_committed,
  coalesce(ctr.total_contributed, 0) as total_contributed,

  greatest(
    io.target_amount
      - coalesce(ct.total_committed, 0),
    0
  ) as remaining_commitment_capacity,

  greatest(
    io.target_amount
      - coalesce(ctr.total_contributed, 0),
    0
  ) as remaining_contribution_capacity,

  coalesce(ct.investment_count, 0) as investment_count,

  io.opened_at,
  io.closes_at,
  io.status,
  io.visibility,

  case
    when io.status = 'fully_funded'
      then true
    when coalesce(ctr.total_contributed, 0) >= io.target_amount
      then true
    else false
  end as contribution_target_reached

from public.investment_opportunities io

left join public.farm_projects fp
  on fp.id = io.project_id

left join public.species_config sc
  on sc.id = io.species_config_id

left join commitment_totals ct
  on ct.opportunity_id = io.id

left join contribution_totals ctr
  on ctr.opportunity_id = io.id;