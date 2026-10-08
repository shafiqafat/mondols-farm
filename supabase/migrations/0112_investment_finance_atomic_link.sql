-- 0112: Fix atomic investment/finance transaction linking.
--
-- The two transaction tables reference each other.
-- Investment transactions are immutable after creation, so the previous
-- RPC could not INSERT the investment transaction and then UPDATE it
-- with the finance transaction ID.
--
-- We solve this by:
--   1. Making the investment -> finance FK deferred.
--   2. Generating both UUIDs before insertion.
--   3. Inserting both rows with their cross-references already populated.
--   4. Never updating the investment transaction after creation.

alter table public.investment_transactions
  drop constraint if exists investment_transactions_finance_transaction_id_fkey;

alter table public.investment_transactions
  add constraint investment_transactions_finance_transaction_id_fkey
  foreign key (finance_transaction_id)
  references public.finance_transactions(id)
  deferrable initially deferred;


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
as $function$
declare
  v_investment_transaction_id uuid := gen_random_uuid();
  v_finance_transaction_id uuid := gen_random_uuid();
  v_finance_type text;
begin
  -- Farm write permission is required.
  if not public.farm_can_write() then
    raise exception 'Not authorized to create investment finance transactions';
  end if;

  -- Only supported investment transaction types are allowed.
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

  -- Contribution = money received from investor.
  -- Distribution/refund = money leaving the farm-side ledger.
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

  -- Insert the immutable investment transaction with its final
  -- finance_transaction_id already known.
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

  -- Insert the corresponding farm-wide finance record with its
  -- investment_transaction_id already known.
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