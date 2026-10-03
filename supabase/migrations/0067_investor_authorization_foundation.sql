-- 0067: Investor authorization foundation.
--
-- Investors are intentionally kept separate from farm_user_roles.
-- Their access is derived from investors.user_id and their
-- investment allocations.

create or replace function public.current_investor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select i.id
  from public.investors i
  where i.user_id = auth.uid()
    and i.status = 'active'
  limit 1;
$$;

revoke all
on function public.current_investor_id()
from public;

grant execute
on function public.current_investor_id()
to authenticated;