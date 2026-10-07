create or replace function public.get_current_investor_profile()
returns table (
  investor_id uuid,
  name text,
  email text,
  phone text,
  address text,
  status text
)
language sql
security definer
set search_path = public
as $$
  select
    inv.id as investor_id,
    inv.name,
    inv.email,
    inv.phone,
    inv.address,
    inv.status
  from investors inv
  where inv.user_id = auth.uid()
    and inv.status = 'active'
  limit 1;
$$;

revoke all on function public.get_current_investor_profile()
from public;

grant execute on function public.get_current_investor_profile()
to authenticated;