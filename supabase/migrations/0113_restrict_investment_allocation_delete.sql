-- 0113: Restrict direct deletion of investment allocations.
-- Allocation history is immutable through the current application workflow.

REVOKE DELETE
ON TABLE public.investment_allocations
FROM anon, authenticated;