-- 0030: Enforce one finance transaction per sale.
--
-- A sale may have at most one linked finance transaction.
-- Non-sale finance transactions remain unrestricted because sale_id is NULL.

create unique index if not exists finance_transactions_sale_id_unique
  on public.finance_transactions (sale_id)
  where sale_id is not null;