-- 0062: Atomically create an investment transaction and its
-- corresponding farm finance transaction.
--
-- This prevents half-linked records where one side exists without
-- the other side being connected.

create or replace function public.record_investment_finance_transaction(
  p_investment_id uuid,
  p_type text,
  p_amount numeric,
  p_occurred_at date,
  p_category text default null,
  p_project_id uuid default null,
  p_entity_id uuid default null,
  p_notes text default null
)
returns table (
  investment_transaction_id uuid,
  finance_transaction_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_investment_transaction_id uuid;
  v_finance_transaction_id uuid;
  v_finance_type text;
begin
  -- Farm write permission is required.
  if not public.farm_can_write() then
    raise exception 'Not authorized to create investment finance transactions';
  end if;

  -- Only transaction types with a clear farm-ledger meaning
  -- are handled by this RPC.
  if p_type not in ('contribution', 'distribution', 'refund') then
    raise exception
      'Unsupported investment transaction type: %',
      p_type;
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Investment transaction amount must be greater than zero';
  end if;

  if p_occurred_at is null then
    raise exception 'Investment transaction date is required';
  end if;

  -- Map investor-side movement to farm-side financial movement.
  if p_type = 'contribution' then
    v_finance_type := 'income';
  else
    v_finance_type := 'expense';
  end if;

  -- Lock the investment so concurrent transactions cannot create
  -- inconsistent contribution/allocation balances.
  perform 1
  from public.investments
  where id = p_investment_id
  for update;

  if not found then
    raise exception 'Investment % does not exist', p_investment_id;
  end if;

  -- Create the investor-side transaction first.
  insert into public.investment_transactions (
    investment_id,
    type,
    amount,
    occurred_at,
    notes
  )
  values (
    p_investment_id,
    p_type,
    p_amount,
    p_occurred_at,
    p_notes
  )
  returning id into v_investment_transaction_id;

  -- Create the corresponding farm-wide finance record.
  insert into public.finance_transactions (
    type,
    amount,
    category,
    project_id,
    entity_id,
    occurred_at,
    notes,
    investment_transaction_id
  )
  values (
    v_finance_type,
    p_amount,
    p_category,
    p_project_id,
    p_entity_id,
    p_occurred_at,
    p_notes,
    v_investment_transaction_id
  )
  returning id into v_finance_transaction_id;

  -- Complete the bidirectional link.
  update public.investment_transactions
  set finance_transaction_id = v_finance_transaction_id
  where id = v_investment_transaction_id;

  return query
  select
    v_investment_transaction_id,
    v_finance_transaction_id;
end;
$$;

revoke all
on function public.record_investment_finance_transaction(
  uuid,
  text,
  numeric,
  date,
  text,
  uuid,
  uuid,
  text
)
from public;

grant execute
on function public.record_investment_finance_transaction(
  uuid,
  text,
  numeric,
  date,
  text,
  uuid,
  uuid,
  text
)
to authenticated;