create or replace function public.get_investor_opportunities()
returns table (
  opportunity_id uuid,
  title text,
  description text,
  project_id uuid,
  project_name text,
  species_config_id uuid,
  species_name text,
  target_amount numeric,
  minimum_amount numeric,
  total_committed numeric,
  total_contributed numeric,
  remaining_target numeric,
  status text,
  visibility text,
  opened_at timestamptz,
  closes_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id,
    o.title,
    o.description,
    o.project_id,
    p.name,
    o.species_config_id,
    sc.name,
    o.target_amount,
    o.minimum_amount,
    coalesce(sum(i.committed_amount), 0),
    coalesce(
      sum(
        case
          when it.type = 'contribution'
            then it.amount
          when it.type = 'refund'
            then -it.amount
          else 0
        end
      ),
      0
    ),
    greatest(
      o.target_amount -
      coalesce(sum(i.committed_amount), 0),
      0
    ),
    o.status,
    o.visibility,
    o.opened_at,
    o.closes_at
  from investment_opportunities o
  left join farm_projects p
    on p.id = o.project_id
  left join species_config sc
    on sc.id = o.species_config_id
  left join investments i
    on i.opportunity_id = o.id
   and i.status <> 'cancelled'
  left join investment_transactions it
    on it.investment_id = i.id
  where o.visibility in ('investors', 'public')
    and o.status in ('upcoming', 'open')
  group by
    o.id,
    p.name,
    sc.name
  order by
    case
      when o.status = 'open' then 1
      when o.status = 'upcoming' then 2
      else 3
    end,
    o.opened_at nulls last,
    o.created_at desc;
$$;

grant execute
on function public.get_investor_opportunities()
to authenticated;

revoke execute
on function public.get_investor_opportunities()
from public;