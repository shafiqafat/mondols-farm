
-- 0114: Enforce investment lifecycle rules
-- Preserve atomic investment/finance transaction linkage.

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
set search_path to 'public'
as $function$
declare
  v_investment_transaction_id uuid := gen_random_uuid();
  v_finance_transaction_id uuid := gen_random_uuid();
  v_finance_type text;
  v_investment_status text;
begin
  -- Require farm write permission.
  if not public.farm_can_write() then
    raise exception
      'Not authorized to create investment finance transactions';
  end if;

  -- Validate supported transaction types.
  if p_type is null
     or p_type not in ('contribution', 'distribution', 'refund') then
    raise exception
      'Unsupported investment transaction type: %',
      p_type;
  end if;

  -- Validate amount and date.
  if p_amount is null or p_amount <= 0 then
    raise exception
      'Investment transaction amount must be greater than zero';
  end if;

  if p_occurred_at is null then
    raise exception
      'Investment transaction date is required';
  end if;

  -- Lock the investment and retrieve its current status.
  -- This also serializes transactions for the same investment.
  select i.status
  into v_investment_status
  from public.investments i
  where i.id = p_investment_id
  for update;

  if not found then
    raise exception
      'Investment % does not exist',
      p_investment_id;
  end if;

  -- Enforce investment lifecycle rules.
  if v_investment_status = 'cancelled' then
    raise exception
      'Transactions are not allowed for cancelled investments.';
  end if;

  if v_investment_status = 'refunded' then
    raise exception
      'Transactions are not allowed for refunded investments.';
  end if;

  if v_investment_status = 'completed'
     and p_type = 'contribution' then
    raise exception
      'Contributions are not allowed for completed investments.';
  end if;

  -- Map investment movements to the farm finance ledger.
  -- Contribution = income.
  -- Distribution/refund = expense.
  if p_type = 'contribution' then
    v_finance_type := 'income';
  else
    v_finance_type := 'expense';
  end if;

  -- Insert the immutable investment transaction with its
  -- finance transaction ID already assigned.
  insert into public.investment_transactions (
    id,
    investment_id,
    type,
    amount,
    occurred_at,
    notes,
    finance_transaction_id
  )
  values (
    v_investment_transaction_id,
    p_investment_id,
    p_type,
    p_amount,
    p_occurred_at,
    p_notes,
    v_finance_transaction_id
  );

  -- Insert the corresponding finance record with its
  -- investment transaction ID already assigned.
  insert into public.finance_transactions (
    id,
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
    v_finance_transaction_id,
    v_finance_type,
    p_amount,
    p_category,
    p_project_id,
    p_entity_id,
    p_occurred_at,
    p_notes,
    v_investment_transaction_id
  );

  return query
  select
    v_investment_transaction_id,
    v_finance_transaction_id;
end;
$function$;
