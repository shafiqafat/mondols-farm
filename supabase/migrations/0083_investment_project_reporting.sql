-- 0083_investment_project_reporting.sql

drop view if exists public.investment_project_overview;

create view public.investment_project_overview
with (security_invoker = true)
as
select
  p.id as project_id,
  p.name as project_name,
  p.project_type,
  p.status as project_status,

  count(distinct i.investor_id) as investor_count,
  count(distinct i.id) as investment_count,

  coalesce(
    sum(ia.amount_allocated),
    0
  ) as total_allocated

from public.farm_projects p

left join public.investment_allocations ia
  on ia.project_id = p.id

left join public.investments i
  on i.id = ia.investment_id
  and i.status <> 'cancelled'

group by
  p.id,
  p.name,
  p.project_type,
  p.status;