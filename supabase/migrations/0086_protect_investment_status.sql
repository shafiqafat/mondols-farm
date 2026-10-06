create or replace function public.validate_investment_status_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  contributed_amount numeric;
  allocated_amount numeric;
begin
  if new.status is distinct from old.status then

    contributed_amount :=
      public.get_investment_contributed_amount(old.id);

    select coalesce(sum(amount_allocated), 0)
    into allocated_amount
    from public.investment_allocations
    where investment_id = old.id;

    if old.status = 'active' and new.status = 'cancelled' then
      if contributed_amount > 0 or allocated_amount > 0 then
        raise exception
          'Investment cannot be cancelled after money has been contributed or allocated.';
      end if;
    end if;

    if old.status in ('cancelled', 'refunded')
       and new.status <> old.status then
      raise exception
        'Investment status cannot be changed after it becomes %.',
        old.status;
    end if;

    if old.status = 'completed'
       and new.status <> 'completed' then
      raise exception
        'Completed investment status cannot be changed.';
    end if;

  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_investment_status_update
on public.investments;

create trigger trg_validate_investment_status_update
before update on public.investments
for each row
execute function public.validate_investment_status_update();