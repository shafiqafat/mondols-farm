create or replace function public.get_investor_investment_transactions(
  p_investment_id uuid
)
returns table (
  id uuid,
  investment_id uuid,
  type text,
  amount numeric,
  occurred_at timestamptz,
  finance_transaction_id uuid,
  notes text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $function$
  select
    it.id,
    it.investment_id,
    it.type,
    it.amount,
    it.occurred_at,
    it.finance_transaction_id,
    it.notes,
    it.created_at
  from investment_transactions it
  join investments i
    on i.id = it.investment_id
  join investors inv
    on inv.id = i.investor_id
  where it.investment_id = p_investment_id
    and inv.user_id = auth.uid()
    and inv.status = 'active'
    and i.status in ('active', 'completed')
  order by
    it.occurred_at desc,
    it.created_at desc;
$function$;

grant execute on function public.get_investor_investment_transactions(uuid)
to authenticated;

revoke execute on function public.get_investor_investment_transactions(uuid)
from public;