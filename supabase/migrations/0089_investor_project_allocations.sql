create or replace function public.get_investor_project_allocations()
returns table (
  project_id uuid,
  project_name text,
  project_type text,
  allocated_amount numeric,
  investment_count bigint,
  scope_type text
)
language sql
security definer
set search_path = public
as $$
  select
    ia.project_id,
    fp.name as project_name,
    fp.project_type,
    sum(ia.amount_allocated) as allocated_amount,
    count(distinct ia.investment_id) as investment_count,
    case
      when bool_and(ia.scope_type = 'full_project')
        then 'full_project'
      else 'partial'
    end as scope_type
  from investment_allocations ia
  join investments i
    on i.id = ia.investment_id
  join investors inv
    on inv.id = i.investor_id
  join farm_projects fp
    on fp.id = ia.project_id
  where inv.user_id = auth.uid()
    and inv.status = 'active'
    and i.status = 'active'
    and ia.project_id is not null
  group by
    ia.project_id,
    fp.name,
    fp.project_type
  order by fp.name;
$$;

revoke all on function public.get_investor_project_allocations()
from public;

grant execute on function public.get_investor_project_allocations()
to authenticated;