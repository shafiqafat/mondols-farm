-- Make multi-table farm operations atomic and FIFO consumption safe across devices.
create or replace function public.process_daily_log(
  p_events jsonb default '[]'::jsonb,
  p_expense jsonb default null,
  p_content jsonb default null
)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  v_event jsonb; v_lot record; v_item_id uuid; v_item_name text;
  v_needed numeric; v_taken numeric; v_shortfalls jsonb := '[]'::jsonb;
begin
  if jsonb_typeof(p_events) <> 'array' then raise exception 'p_events must be a JSON array'; end if;

  -- Row locks serialize concurrent consumption of the same inventory lots.
  for v_event in select value from jsonb_array_elements(p_events) loop
    if v_event->>'type' <> 'feed_given'
       or nullif(v_event->'payload'->>'item_id', '') is null then continue; end if;
    v_item_id := (v_event->'payload'->>'item_id')::uuid;
    v_needed := greatest(coalesce((v_event->'payload'->>'qty_kg')::numeric, 0), 0);
    if v_needed = 0 then continue; end if;
    select name into v_item_name from inventory_items where id = v_item_id;
    for v_lot in
      select id, qty_remaining from inventory_lots
      where item_id = v_item_id and qty_remaining > 0
      order by purchased_at, id for update
    loop
      exit when v_needed <= 0;
      v_taken := least(v_lot.qty_remaining, v_needed);
      update inventory_lots set qty_remaining = qty_remaining - v_taken where id = v_lot.id;
      v_needed := v_needed - v_taken;
    end loop;
    if v_needed > 0 then
      v_shortfalls := v_shortfalls || jsonb_build_array(
        jsonb_build_object('item_name', coalesce(v_item_name, 'item'), 'shortfall', v_needed)
      );
    end if;
  end loop;

  if jsonb_array_length(p_events) > 0 then
    insert into entity_events (entity_id, type, payload, occurred_at)
    select (event->>'entity_id')::uuid, event->>'type',
      coalesce(event->'payload', '{}'::jsonb), (event->>'occurred_at')::date
    from jsonb_array_elements(p_events) as event;
  end if;
  if p_expense is not null then
    insert into finance_transactions (type, amount, category, entity_id, occurred_at, notes)
    values ('expense', (p_expense->>'amount')::numeric, p_expense->>'category',
      nullif(p_expense->>'entity_id', '')::uuid, (p_expense->>'occurred_at')::date,
      p_expense->>'notes');
  end if;
  if p_content is not null then
    insert into content_items (title, type, stage, notes, occurred_at)
    values (p_content->>'title', coalesce(p_content->>'type', 'mixed'),
      coalesce(p_content->>'stage', 'idea'), p_content->>'notes',
      coalesce((p_content->>'occurred_at')::date, current_date));
  end if;
  return jsonb_build_object('shortfalls', v_shortfalls);
end;
$$;

create or replace function public.record_inventory_purchase(
  p_item_id uuid, p_qty numeric, p_cost_per_unit numeric,
  p_purchased_at date default current_date
)
returns void language plpgsql security invoker set search_path = public as $$
declare v_item_name text;
begin
  if p_qty <= 0 or p_cost_per_unit < 0 then
    raise exception 'Quantity must be positive and cost cannot be negative';
  end if;
  select name into v_item_name from inventory_items where id = p_item_id;
  if v_item_name is null then raise exception 'Inventory item not found'; end if;
  insert into inventory_lots (item_id, qty_purchased, qty_remaining, cost_per_unit, purchased_at)
  values (p_item_id, p_qty, p_qty, p_cost_per_unit, coalesce(p_purchased_at, current_date));
  insert into finance_transactions (type, amount, category, occurred_at)
  values ('expense', p_qty * p_cost_per_unit, v_item_name, coalesce(p_purchased_at, current_date));
end;
$$;
