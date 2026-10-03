-- 0061: Link investment transactions with the farm financial ledger.
--
-- Investment transactions represent investor-specific money movements.
-- finance_transactions remains the farm-wide financial ledger.
--
-- A single investment transaction may link to at most one finance
-- transaction, and a single finance transaction may link to at most
-- one investment transaction.

alter table public.finance_transactions
  add column if not exists investment_transaction_id uuid
    references public.investment_transactions(id)
    on delete set null;

create unique index if not exists
  finance_transactions_investment_transaction_unique
on public.finance_transactions (investment_transaction_id)
where investment_transaction_id is not null;

create index if not exists
  finance_transactions_investment_transaction_idx
on public.finance_transactions (investment_transaction_id);

create index if not exists
  investment_transactions_finance_transaction_idx
on public.investment_transactions (finance_transaction_id);

-- Prevent one investment transaction from being linked to
-- more than one finance transaction.
create unique index if not exists
  investment_transactions_finance_transaction_unique
on public.investment_transactions (finance_transaction_id)
where finance_transaction_id is not null;