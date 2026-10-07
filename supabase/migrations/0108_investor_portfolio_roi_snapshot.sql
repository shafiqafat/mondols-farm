drop function if exists public.get_current_investor_portfolio();

create or replace function function public.get_current_investor_portfolio()
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
  investment_status text,
  invested_at timestamptz,

  roi_base_min_percent numeric,
  roi_base_max_percent numeric,
  roi_bonus_percent numeric,
  roi_final_min_percent numeric,
  roi_final_max_percent numeric,
  roi_duration_months integer,
  roi_max_percent_cap numeric,

  allocations jsonb
)
language sql
stable
security definer
set search_path = public
as $function$
  select
    i.id as investment_id,
    i.investor_id,
    inv.name as investor_name,
    i.opportunity_id,
    io.title as opportunity_title,
    i.committed_amount,

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
    ) as contributed_amount,

    coalesce(
      (
        select sum(ia.amount_allocated)
        from investment_allocations ia
        where ia.investment_id = i.id
      ),
      0
    ) as allocated_amount,

    coalesce(
      sum(
        case
          when it.type = 'distribution'
            then it.amount
          else 0
        end
      ),
      0
    ) as distributed_amount,

    coalesce(
      sum(
        case
          when it.type = 'refund'
            then it.amount
          else 0
        end
      ),
      0
    ) as refunded_amount,

    greatest(
      i.committed_amount
      - coalesce(
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
      0
    ) as outstanding_commitment,

    greatest(
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
      )
      - coalesce(
          (
            select sum(ia.amount_allocated)
            from investment_allocations ia
            where ia.investment_id = i.id
          ),
          0
        ),
      0
    ) as unallocated_contribution,

    i.status as investment_status,
    i.invested_at,

    i.roi_base_min_percent,
    i.roi_base_max_percent,
    i.roi_bonus_percent,
    i.roi_final_min_percent,
    i.roi_final_max_percent,
    i.roi_duration_months,
    i.roi_max_percent_cap,

    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'allocation_id', ia.id,
            'scope_type', ia.scope_type,
            'project_id', ia.project_id,
            'project_name', fp.name,
            'species_config_id', ia.species_config_id,
            'species_name', sc.name,
            'amount_allocated', ia.amount_allocated,
            'participation_pct', ia.participation_pct
          )
          order by ia.created_at
        )
        from investment_allocations ia
        join farm_projects fp
          on fp.id = ia.project_id
        left join species_config sc
          on sc.id = ia.species_config_id
        where ia.investment_id = i.id
      ),
      '[]'::jsonb
    ) as allocations

  from investments i
  join investors inv
    on inv.id = i.investor_id
  left join investment_opportunities io
    on io.id = i.opportunity_id
  left join investment_transactions it
    on it.investment_id = i.id

  where i.investor_id = public.current_investor_id()
    and inv.status = 'active'

  group by
    i.id,
    i.investor_id,
    inv.name,
    i.opportunity_id,
    io.title,
    i.committed_amount,
    i.status,
    i.invested_at,
    i.roi_base_min_percent,
    i.roi_base_max_percent,
    i.roi_bonus_percent,
    i.roi_final_min_percent,
    i.roi_final_max_percent,
    i.roi_duration_months,
    i.roi_max_percent_cap;
$function$;

grant execute
on function public.get_current_investor_portfolio()
to authenticated;

revoke execute
on function public.get_current_investor_portfolio()
from public;