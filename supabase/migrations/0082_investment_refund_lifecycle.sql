-- 0082_investment_refund_lifecycle.sql

create or replace function public.mark_investment_refunded_after_refund()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contributed_amount numeric;
  v_allocated_amount numeric;
begin
  -- Only refunds can trigger the refunded lifecycle transition.
  if new.type <> 'refund' then
    return new;
  end if;

  -- Calculate the remaining contributed capital.
  v_contributed_amount :=
    public.get_investment_contributed_amount(new.investment_id);

  -- Calculate the currently allocated capital.
  select coalesce(sum(ia.amount_allocated), 0)
  into v_allocated_amount
  from public.investment_allocations ia
  where ia.investment_id = new.investment_id;

  -- An investment becomes refunded only when:
  -- 1. All contributed capital has been refunded.
  -- 2. No capital remains allocated to a project.
  if v_contributed_amount = 0
     and v_allocated_amount = 0 then

    update public.investments
    set
      status = 'refunded',
      updated_at = now()
    where id = new.investment_id
      and status = 'active';

  end if;

  return new;
end;
$$;


drop trigger if exists trg_mark_investment_refunded
on public.investment_transactions;


create trigger trg_mark_investment_refunded
after insert or update
on public.investment_transactions
for each row
execute function public.mark_investment_refunded_after_refund();