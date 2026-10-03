-- 0063: Protect the one-to-one investment/finance relationship.
--
-- Once an investment transaction is linked to a finance transaction,
-- both records become immutable through normal table writes.
--
-- New linked records may establish the relationship exactly once.

create or replace function public.validate_investment_finance_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_finance_investment_id uuid;
begin
  /*
   * Investment transaction side.
   *
   * The only allowed transition for finance_transaction_id is:
   *
   * NULL -> one matching finance transaction
   *
   * Once linked, the investment transaction cannot be changed.
   */
  if tg_table_name = 'investment_transactions' then

    if tg_op = 'UPDATE' then

      if old.finance_transaction_id is not null then
        raise exception
          'Linked investment transaction % is immutable',
          old.id;
      end if;

      if new.finance_transaction_id is not null then

        select investment_transaction_id
        into v_finance_investment_id
        from public.finance_transactions
        where id = new.finance_transaction_id;

        if not found then
          raise exception
            'Finance transaction % does not exist',
            new.finance_transaction_id;
        end if;

        if v_finance_investment_id is distinct from new.id then
          raise exception
            'Finance transaction % is not linked to investment transaction %',
            new.finance_transaction_id,
            new.id;
        end if;

      end if;

    end if;

    return new;
  end if;


  /*
   * Finance transaction side.
   *
   * A finance transaction linked to an investment transaction must
   * point to an existing investment transaction.
   */
  if tg_table_name = 'finance_transactions' then

    if tg_op = 'INSERT' then

      if new.investment_transaction_id is not null then

        select finance_transaction_id
        into v_finance_investment_id
        from public.investment_transactions
        where id = new.investment_transaction_id;

        if not found then
          raise exception
            'Investment transaction % does not exist',
            new.investment_transaction_id;
        end if;

        /*
         * The investment side is allowed to be NULL at this stage.
         * 0062 will establish the reverse link immediately afterward.
         */

        if v_finance_investment_id is not null
           and v_finance_investment_id is distinct from new.id then
          raise exception
            'Investment transaction % is already linked to another finance transaction',
            new.investment_transaction_id;
        end if;

      end if;

      return new;
    end if;


    if tg_op = 'UPDATE' then

      if old.investment_transaction_id is not null then
        raise exception
          'Investment-linked finance transaction % is immutable',
          old.id;
      end if;

      if new.investment_transaction_id is not null then

        select finance_transaction_id
        into v_finance_investment_id
        from public.investment_transactions
        where id = new.investment_transaction_id;

        if not found then
          raise exception
            'Investment transaction % does not exist',
            new.investment_transaction_id;
        end if;

        if v_finance_investment_id is not null
           and v_finance_investment_id is distinct from new.id then
          raise exception
            'Investment transaction % is already linked to another finance transaction',
            new.investment_transaction_id;
        end if;

      end if;

      return new;
    end if;

    if tg_op = 'DELETE' then

      if old.investment_transaction_id is not null then
        raise exception
          'Investment-linked finance transaction % cannot be deleted',
          old.id;
      end if;

      return old;
    end if;

  end if;

  return new;
end;
$$;


drop trigger if exists trg_validate_investment_finance_link
on public.investment_transactions;

create trigger trg_validate_investment_finance_link
before update
on public.investment_transactions
for each row
execute function public.validate_investment_finance_link();


drop trigger if exists trg_validate_finance_investment_link
on public.finance_transactions;

create trigger trg_validate_finance_investment_link
before insert or update or delete
on public.finance_transactions
for each row
execute function public.validate_investment_finance_link();