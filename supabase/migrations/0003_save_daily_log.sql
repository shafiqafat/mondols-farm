create or replace function public.save_daily_log(
  p_events jsonb,
  p_expense jsonb default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  /*
    Save entity events first.
    If the expense insert fails later,
    PostgreSQL rolls the entire function back.
  */
  if p_events is not null
     and jsonb_array_length(p_events) > 0 then

    insert into public.entity_events (
      entity_id,
      type,
      payload,
      occurred_at
    )
    select
      (event->>'entity_id')::uuid,
      event->>'type',
      coalesce(event->'payload', '{}'::jsonb),
      (event->>'occurred_at')::date
    from jsonb_array_elements(p_events) as event;

  end if;


  /*
    Save the optional finance transaction.
  */
  if p_expense is not null then

    insert into public.finance_transactions (
      type,
      amount,
      category,
      entity_id,
      occurred_at,
      notes
    )
    values (
      'expense',
      (p_expense->>'amount')::numeric,
      p_expense->>'category',
      nullif(p_expense->>'entity_id', '')::uuid,
      (p_expense->>'occurred_at')::date,
      p_expense->>'notes'
    );

  end if;

end;
$$;