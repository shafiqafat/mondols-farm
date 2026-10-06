create or replace function public.prevent_investment_transaction_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    raise exception
      'Investment transaction records cannot be deleted. Use a reversal or refund transaction instead.';
  end if;

  if tg_op = 'UPDATE' then
    raise exception
      'Investment transaction records cannot be modified after creation.';
  end if;

  return old;
end;
$$;

drop trigger if exists trg_prevent_investment_transaction_update
on public.investment_transactions;

drop trigger if exists trg_prevent_investment_transaction_delete
on public.investment_transactions;

create trigger trg_prevent_investment_transaction_update
before update on public.investment_transactions
for each row
execute function public.prevent_investment_transaction_mutation();

create trigger trg_prevent_investment_transaction_delete
before delete on public.investment_transactions
for each row
execute function public.prevent_investment_transaction_mutation();