-- 0029: Validate finance transaction types.
--
-- Supported transaction types:
--   income
--   expense
--   asset

alter table public.finance_transactions
  add constraint finance_transactions_type_valid
  check (type in ('income', 'expense', 'asset'))
  not valid;