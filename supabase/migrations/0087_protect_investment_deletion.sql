create or replace function public.prevent_investment_delete()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  raise exception
    'Investment records cannot be deleted. Cancel or refund the investment instead.';

  return old;
end;
$$;

drop trigger if exists trg_prevent_investment_delete
on public.investments;

create trigger trg_prevent_investment_delete
before delete on public.investments
for each row
execute function public.prevent_investment_delete();