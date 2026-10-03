-- Mondol's Farm OS
-- 0060: Investment integrity rules
--
-- Rules:
--   1. Actual contributions cannot exceed committed amount.
--   2. Allocations cannot exceed committed amount.
--   3. Allocations cannot exceed actual contributions.
--   4. Multiple allocations are allowed.
--   5. Full allocation is NOT required.
--
-- This allows money to be received before the final allocation
-- decision is made.


-- ---------------------------------------------------------------------
-- Helper: total actual contributions for an investment
-- ---------------------------------------------------------------------

create or replace function public.get_investment_contributed_amount(
  p_investment_id uuid
)
returns numeric
language sql
stable
set search_path = public
as $function$
  select coalesce(
    sum(
      case
        when type = 'contribution' then amount
        when type = 'refund' then -amount
        else 0
      end
    ),
    0
  )
  from public.investment_transactions
  where investment_id = p_investment_id;
$function$;


-- ---------------------------------------------------------------------
-- Helper: total allocated amount for an investment
-- ---------------------------------------------------------------------

create or replace function public.get_investment_allocated_amount(
  p_investment_id uuid
)
returns numeric
language sql
stable
set search_path = public
as $function$
  select coalesce(
    sum(amount_allocated),
    0
  )
  from public.investment_allocations
  where investment_id = p_investment_id;
$function$;


-- ---------------------------------------------------------------------
-- Validate investment transactions
-- ---------------------------------------------------------------------

create or replace function public.validate_investment_transaction()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  v_committed numeric;
  v_contributed numeric;
  v_new_contributed numeric;
begin

  select committed_amount
    into v_committed
  from public.investments
  where id = new.investment_id
  for update;

  if not found then
    raise exception 'Investment not found';
  end if;


  /*
    Calculate the contribution balance after this transaction.

    contribution → adds capital
    refund       → removes returned capital
    distribution → does not reduce contributed capital
    adjustment   → does not affect contribution balance here
  */

  v_contributed :=
    public.get_investment_contributed_amount(new.investment_id);

  if tg_op = 'INSERT' then
    if new.type = 'contribution' then
      v_new_contributed := v_contributed + new.amount;
    elsif new.type = 'refund' then
      v_new_contributed := v_contributed - new.amount;
    else
      v_new_contributed := v_contributed;
    end if;

  else
    /*
      Remove the old transaction's contribution/refund effect,
      then apply the new row.
    */

    if old.type = 'contribution' then
      v_new_contributed := v_contributed - old.amount;
    elsif old.type = 'refund' then
      v_new_contributed := v_contributed + old.amount;
    else
      v_new_contributed := v_contributed;
    end if;

    if new.type = 'contribution' then
      v_new_contributed := v_new_contributed + new.amount;
    elsif new.type = 'refund' then
      v_new_contributed := v_new_contributed - new.amount;
    end if;
  end if;


  if v_new_contributed < 0 then
    raise exception
      'Investment contribution balance cannot be negative';
  end if;


  if v_new_contributed > v_committed then
    raise exception
      'Investment contributions (%) cannot exceed committed amount (%)',
      v_new_contributed,
      v_committed;
  end if;


  /*
    A contribution/refund must also leave enough received capital
    to support existing allocations.
  */

  if public.get_investment_allocated_amount(new.investment_id)
     > v_new_contributed then

    raise exception
      'Investment allocations cannot exceed contributed amount (%)',
      public.get_investment_allocated_amount(new.investment_id);
  end if;


  return new;
end;
$function$;


drop trigger if exists trg_validate_investment_transaction
on public.investment_transactions;

create trigger trg_validate_investment_transaction
before insert or update
on public.investment_transactions
for each row
execute function public.validate_investment_transaction();


-- ---------------------------------------------------------------------
-- Validate investment allocations
-- ---------------------------------------------------------------------

create or replace function public.validate_investment_allocation()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  v_committed numeric;
  v_contributed numeric;
  v_allocated numeric;
begin

  select committed_amount
    into v_committed
  from public.investments
  where id = new.investment_id
  for update;

  if not found then
    raise exception 'Investment not found';
  end if;


  /*
    Calculate allocation total including the new/updated row.
  */

  v_allocated :=
    public.get_investment_allocated_amount(new.investment_id);

  if tg_op = 'INSERT' then
    v_allocated := v_allocated + new.amount_allocated;
  else
    v_allocated := v_allocated - old.amount_allocated
      + new.amount_allocated;
  end if;


  if v_allocated > v_committed then
    raise exception
      'Investment allocations (%) cannot exceed committed amount (%)',
      v_allocated,
      v_committed;
  end if;


  v_contributed :=
    public.get_investment_contributed_amount(new.investment_id);


  if v_allocated > v_contributed then
    raise exception
      'Investment allocations (%) cannot exceed contributed amount (%)',
      v_allocated,
      v_contributed;
  end if;


  return new;
end;
$function$;


drop trigger if exists trg_validate_investment_allocation
on public.investment_allocations;

create trigger trg_validate_investment_allocation
before insert or update
on public.investment_allocations
for each row
execute function public.validate_investment_allocation();