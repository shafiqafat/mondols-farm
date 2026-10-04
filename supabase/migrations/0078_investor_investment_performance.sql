create or replace function public.get_investor_investment_performance(
  p_investment_id uuid
)
returns table (
  investment_id uuid,
  committed_amount numeric,
  contributed_amount numeric,
  allocated_amount numeric,
  distributed_amount numeric,
  refunded_amount numeric,
  outstanding_commitment numeric,
  unallocated_contribution numeric,
  net_cash_position numeric,
  distribution_return_pct numeric
)
language sql
stable
security definer
set search_path = public
as $function$
  select
    i.id as investment_id,

    i.committed_amount,

    coalesce(
      sum(
        case
          when it.type = 'contribution'
            then it.amount
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
      -
      coalesce(
        (
          select sum(ia.amount_allocated)
          from investment_allocations ia
          where ia.investment_id = i.id
        ),
        0
      ),
      0
    ) as unallocated_contribution,

    coalesce(
      sum(
        case
          when it.type = 'distribution'
            then it.amount
          when it.type = 'refund'
            then it.amount
          else 0
        end
      ),
      0
    ) as net_cash_position,

    case
      when coalesce(
        sum(
          case
            when it.type = 'contribution'
              then it.amount
            else 0
          end
        ),
        0
      ) > 0
      then round(
        (
          coalesce(
            sum(
              case
                when it.type = 'distribution'
                  then it.amount
                else 0
              end
            ),
            0
          )
          /
          sum(
            case
              when it.type = 'contribution'
                then it.amount
              else 0
            end
          )
        ) * 100,
        2
      )
      else 0
    end as distribution_return_pct

  from investments i

  join investors inv
    on inv.id = i.investor_id

  left join investment_transactions it
    on it.investment_id = i.id

  where i.id = p_investment_id
    and inv.user_id = auth.uid()
    and inv.status = 'active'

  group by
    i.id,
    i.committed_amount;
    
$function$;

grant execute on function public.get_investor_investment_performance(uuid)
to authenticated;

revoke execute on function public.get_investor_investment_performance(uuid)
from public;