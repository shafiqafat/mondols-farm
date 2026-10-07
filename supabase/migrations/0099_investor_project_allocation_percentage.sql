create or replace function public.get_investor_project_allocation_percentage(
  p_project_id uuid
)
returns table (
  project_id uuid,
  allocated_amount numeric,
  total_allocated_amount numeric,
  allocation_percentage numeric
)
language sql
security definer
set search_path = public
as $$
  with project_allocation as (
    select
      ia.project_id,
      sum(ia.amount_allocated) as allocated_amount
    from investment_allocations ia
    join investments i
      on i.id = ia.investment_id
    join investors inv
      on inv.id = i.investor_id
    where inv.user_id = auth.uid()
      and inv.status = 'active'
      and i.status = 'active'
      and ia.project_id = p_project_id
    group by ia.project_id
  ),
  portfolio_allocation as (
    select
      coalesce(sum(ia.amount_allocated), 0) as total_allocated_amount
    from investment_allocations ia
    join investments i
      on i.id = ia.investment_id
    join investors inv
      on inv.id = i.investor_id
    where inv.user_id = auth.uid()
      and inv.status = 'active'
      and i.status = 'active'
      and ia.project_id is not null
  )
  select
    pa.project_id,
    pa.allocated_amount,
    p.total_allocated_amount,
    case
      when p.total_allocated_amount > 0
        then round(
          (pa.allocated_amount / p.total_allocated_amount) * 100,
          2
        )
      else 0
    end as allocation_percentage
  from project_allocation pa
  cross join portfolio_allocation p;
$$;

revoke all
on function public.get_investor_project_allocation_percentage(uuid)
from public;

grant execute
on function public.get_investor_project_allocation_percentage(uuid)
to authenticated;