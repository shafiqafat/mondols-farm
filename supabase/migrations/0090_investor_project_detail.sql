create or replace function public.get_investor_project_detail(
  p_project_id uuid
)
returns table (
  project_id uuid,
  project_name text,
  project_type text,
  purpose text,
  started_at date,
  target_end_at date,
  project_status text,
  completed_at date,
  allocated_amount numeric,
  investment_count bigint,
  scope_type text
)
language sql
security definer
set search_path = public
as $$
  select
    fp.id as project_id,
    fp.name as project_name,
    fp.project_type,
    fp.purpose,
    fp.started_at,
    fp.target_end_at,
    fp.status as project_status,
    fp.completed_at,
    sum(ia.amount_allocated) as allocated_amount,
    count(distinct ia.investment_id) as investment_count,
    case
      when bool_and(ia.scope_type = 'full_project')
        then 'full_project'
      else 'partial'
    end as scope_type
  from farm_projects fp
  join investment_allocations ia
    on ia.project_id = fp.id
  join investments i
    on i.id = ia.investment_id
  join investors inv
    on inv.id = i.investor_id
  where fp.id = p_project_id
    and inv.user_id = auth.uid()
    and inv.status = 'active'
    and i.status = 'active'
  group by
    fp.id,
    fp.name,
    fp.project_type,
    fp.purpose,
    fp.started_at,
    fp.target_end_at,
    fp.status,
    fp.completed_at;
$$;

revoke all on function public.get_investor_project_detail(uuid)
from public;

grant execute on function public.get_investor_project_detail(uuid)
to authenticated;