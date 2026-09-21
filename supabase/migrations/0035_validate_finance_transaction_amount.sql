-- Validate the existing finance transaction amount constraint.
-- Existing data has already been checked and contains no negative amounts.

alter table public.finance_transactions
  validate constraint finance_transactions_amount_nonnegative;