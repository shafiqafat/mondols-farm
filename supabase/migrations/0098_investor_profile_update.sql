create or replace function public.update_current_investor_profile(
  p_phone text,
  p_address text
)
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
  update investors
  set
    phone = nullif(trim(p_phone), ''),
    address = nullif(trim(p_address), ''),
    updated_at = now()
  where user_id = auth.uid()
    and status = 'active'
  returning
    id as investor_id,
    name,
    email,
    phone,
    address,
    status;
$$;

revoke all
on function public.update_current_investor_profile(text, text)
from public;

grant execute
on function public.update_current_investor_profile(text, text)
to authenticated;