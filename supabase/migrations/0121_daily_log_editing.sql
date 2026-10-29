-- 0121 — Daily log batches and safe editing for newly recorded logs
create table if not exists public.daily_log_batches (
  id uuid primary key default gen_random_uuid(),
  log_date date not null,
  event_ids uuid[] not null default '{}',
  event_data jsonb not null default '[]'::jsonb,
  expense_transaction_id uuid references public.finance_transactions(id) on delete set null,
  expense_data jsonb,
  content_item_id uuid references public.content_items(id) on delete set null,
  content_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daily_log_batches enable row level security;
drop policy if exists "daily_log_batches_read" on public.daily_log_batches;
drop policy if exists "daily_log_batches_write" on public.daily_log_batches;
create policy "daily_log_batches_read" on public.daily_log_batches for select using (farm_can_read());
create policy "daily_log_batches_write" on public.daily_log_batches for all using (farm_can_write()) with check (farm_can_write());

create index if not exists daily_log_batches_date_idx on public.daily_log_batches(log_date desc, created_at desc);

create or replace function public.process_daily_log(
  p_events jsonb default '[]'::jsonb,
  p_expense jsonb default null::jsonb,
  p_content jsonb default null::jsonb
) returns jsonb
language plpgsql security definer set search_path = public
as $function$
declare
  v_event jsonb; v_lot record; v_event_id uuid; v_item_id uuid; v_item_name text;
  v_needed numeric; v_taken numeric; v_shortfalls jsonb := '[]'::jsonb;
  v_expense_entity_id uuid; v_expense_date date; v_project_id uuid;
  v_event_ids uuid[] := '{}'; v_expense_id uuid; v_content_id uuid; v_log_date date;
begin
  if not farm_can_write() then raise exception 'You do not have permission to record daily logs'; end if;
  if jsonb_typeof(p_events) <> 'array' then raise exception 'p_events must be a JSON array'; end if;
  v_log_date := coalesce(nullif(p_events->0->>'occurred_at','')::date,
                         nullif(p_expense->>'occurred_at','')::date,
                         nullif(p_content->>'occurred_at','')::date, current_date);

  for v_event in select value from jsonb_array_elements(p_events) loop
    insert into entity_events(entity_id,type,payload,occurred_at)
    values ((v_event->>'entity_id')::uuid, v_event->>'type', coalesce(v_event->'payload','{}'::jsonb), (v_event->>'occurred_at')::date)
    returning id into v_event_id;
    v_event_ids := array_append(v_event_ids, v_event_id);
    if v_event->>'type' <> 'feed_given' or nullif(v_event->'payload'->>'item_id','') is null then continue; end if;
    v_item_id := (v_event->'payload'->>'item_id')::uuid;
    v_needed := greatest(coalesce((v_event->'payload'->>'qty_kg')::numeric,0),0);
    if v_needed = 0 then continue; end if;
    select name into v_item_name from inventory_items where id = v_item_id;
    for v_lot in select id,qty_remaining,cost_per_unit from inventory_lots where item_id=v_item_id and qty_remaining>0 order by purchased_at,id for update loop
      exit when v_needed <= 0;
      v_taken := least(v_lot.qty_remaining,v_needed);
      update inventory_lots set qty_remaining=qty_remaining-v_taken where id=v_lot.id;
      insert into inventory_consumptions(event_id,item_id,lot_id,quantity,unit_cost,total_cost)
      values(v_event_id,v_item_id,v_lot.id,v_taken,v_lot.cost_per_unit,v_taken*v_lot.cost_per_unit);
      v_needed := v_needed-v_taken;
    end loop;
    if v_needed>0 then v_shortfalls := v_shortfalls || jsonb_build_array(jsonb_build_object('item_name',coalesce(v_item_name,'item'),'shortfall',v_needed)); end if;
  end loop;

  if p_expense is not null then
    v_expense_entity_id := nullif(p_expense->>'entity_id','')::uuid;
    v_expense_date := (p_expense->>'occurred_at')::date; v_project_id := null;
    if v_expense_entity_id is not null then
      select fpe.project_id into v_project_id from farm_project_entities fpe
      where fpe.entity_id=v_expense_entity_id and fpe.started_at<=v_expense_date
        and (fpe.ended_at is null or v_expense_date<fpe.ended_at)
      order by fpe.started_at desc limit 1;
    end if;
    insert into finance_transactions(type,amount,category,project_id,entity_id,occurred_at,notes)
    values('expense',(p_expense->>'amount')::numeric,p_expense->>'category',v_project_id,v_expense_entity_id,v_expense_date,p_expense->>'notes')
    returning id into v_expense_id;
  end if;
  if p_content is not null then
    insert into content_items(title,type,stage,notes,occurred_at)
    values(p_content->>'title',coalesce(p_content->>'type','mixed'),coalesce(p_content->>'stage','idea'),p_content->>'notes',coalesce(nullif(p_content->>'occurred_at','')::date,current_date))
    returning id into v_content_id;
  end if;
  insert into daily_log_batches(log_date,event_ids,event_data,expense_transaction_id,expense_data,content_item_id,content_data)
  values(v_log_date,v_event_ids,p_events,v_expense_id,p_expense,v_content_id,p_content);
  return jsonb_build_object('shortfalls',v_shortfalls);
end;
$function$;

create or replace function public.edit_daily_log(
  p_batch_id uuid, p_events jsonb, p_expense jsonb default null, p_content jsonb default null
) returns jsonb
language plpgsql security definer set search_path = public
as $function$
declare
  v_batch daily_log_batches%rowtype; v_i integer; v_event jsonb; v_event_id uuid;
  v_lot record; v_item_id uuid; v_item_name text; v_needed numeric; v_taken numeric;
  v_shortfalls jsonb := '[]'::jsonb; v_expense_entity_id uuid; v_expense_date date; v_project_id uuid;
  v_new_event_ids uuid[] := '{}'; v_expense_id uuid; v_content_id uuid; v_old_count integer; v_has_reconciliations boolean;
begin
  if not farm_can_write() then raise exception 'You do not have permission to edit daily logs'; end if;
  if jsonb_typeof(p_events) <> 'array' then raise exception 'p_events must be a JSON array'; end if;
  select * into v_batch from daily_log_batches where id=p_batch_id for update;
  if not found then raise exception 'Daily log not found or is not editable'; end if;
  v_old_count := coalesce(array_length(v_batch.event_ids,1),0);

  -- Restore old stock allocations before recalculating the same events.
  if v_old_count > 0 then
    if exists(select 1 from inventory_consumptions ic where ic.event_id = any(v_batch.event_ids)) then
      -- Do not alter inventory ledger history if any lot has reconciliation history.
      if to_regclass('public.inventory_lot_reconciliations') is not null and exists (
        select 1 from inventory_lot_reconciliations r
        where r.lot_id in (select distinct ic.lot_id from inventory_consumptions ic where ic.event_id=any(v_batch.event_ids))
      ) then raise exception 'This log uses inventory with reconciliation history and cannot be edited safely'; end if;
      if to_regclass('public.inventory_consumption_reconciliations') is not null then
        execute 'select exists(select 1 from public.inventory_consumption_reconciliations)' into v_has_reconciliations;
        if v_has_reconciliations then
          raise exception 'Inventory consumption reconciliation records exist; feed-related log edits are temporarily blocked to protect the ledger';
        end if;
      end if;
      for v_lot in select ic.lot_id, sum(ic.quantity) qty from inventory_consumptions ic where ic.event_id=any(v_batch.event_ids) group by ic.lot_id loop
        update inventory_lots set qty_remaining=qty_remaining+v_lot.qty where id=v_lot.lot_id;
      end loop;
      delete from inventory_consumptions where event_id=any(v_batch.event_ids);
    end if;
  end if;

  if v_old_count > jsonb_array_length(p_events) then
    delete from entity_events where id = any(v_batch.event_ids[jsonb_array_length(p_events)+1:v_old_count]);
  end if;
  for v_i in 0..jsonb_array_length(p_events)-1 loop
    v_event := p_events->v_i;
    if v_i < v_old_count then
      v_event_id := v_batch.event_ids[v_i+1];
      update entity_events set entity_id=(v_event->>'entity_id')::uuid,type=v_event->>'type',
        payload=coalesce(v_event->'payload','{}'::jsonb),occurred_at=(v_event->>'occurred_at')::date
      where id=v_event_id;
      if not found then raise exception 'An activity in this log no longer exists; edit was cancelled'; end if;
    else
      insert into entity_events(entity_id,type,payload,occurred_at)
      values((v_event->>'entity_id')::uuid,v_event->>'type',coalesce(v_event->'payload','{}'::jsonb),(v_event->>'occurred_at')::date)
      returning id into v_event_id;
    end if;
    v_new_event_ids := array_append(v_new_event_ids,v_event_id);
    if v_event->>'type' <> 'feed_given' or nullif(v_event->'payload'->>'item_id','') is null then continue; end if;
    v_item_id := (v_event->'payload'->>'item_id')::uuid;
    v_needed := greatest(coalesce((v_event->'payload'->>'qty_kg')::numeric,0),0);
    if v_needed=0 then continue; end if;
    select name into v_item_name from inventory_items where id=v_item_id;
    for v_lot in select id,qty_remaining,cost_per_unit from inventory_lots where item_id=v_item_id and qty_remaining>0 order by purchased_at,id for update loop
      exit when v_needed<=0; v_taken:=least(v_lot.qty_remaining,v_needed);
      update inventory_lots set qty_remaining=qty_remaining-v_taken where id=v_lot.id;
      insert into inventory_consumptions(event_id,item_id,lot_id,quantity,unit_cost,total_cost) values(v_event_id,v_item_id,v_lot.id,v_taken,v_lot.cost_per_unit,v_taken*v_lot.cost_per_unit);
      v_needed:=v_needed-v_taken;
    end loop;
    if v_needed>0 then v_shortfalls:=v_shortfalls||jsonb_build_array(jsonb_build_object('item_name',coalesce(v_item_name,'item'),'shortfall',v_needed)); end if;
  end loop;

  if v_batch.expense_transaction_id is not null then
    if p_expense is null then delete from finance_transactions where id=v_batch.expense_transaction_id;
    else
      v_expense_entity_id:=nullif(p_expense->>'entity_id','')::uuid; v_expense_date:=(p_expense->>'occurred_at')::date; v_project_id:=null;
      if v_expense_entity_id is not null then select fpe.project_id into v_project_id from farm_project_entities fpe where fpe.entity_id=v_expense_entity_id and fpe.started_at<=v_expense_date and (fpe.ended_at is null or v_expense_date<fpe.ended_at) order by fpe.started_at desc limit 1; end if;
      update finance_transactions set type='expense',amount=(p_expense->>'amount')::numeric,category=p_expense->>'category',project_id=v_project_id,entity_id=v_expense_entity_id,occurred_at=v_expense_date,notes=p_expense->>'notes' where id=v_batch.expense_transaction_id;
    end if;
    if p_expense is null then v_expense_id:=null; else v_expense_id:=v_batch.expense_transaction_id; end if;
  elsif p_expense is not null then
    v_expense_entity_id:=nullif(p_expense->>'entity_id','')::uuid; v_expense_date:=(p_expense->>'occurred_at')::date; v_project_id:=null;
    if v_expense_entity_id is not null then select fpe.project_id into v_project_id from farm_project_entities fpe where fpe.entity_id=v_expense_entity_id and fpe.started_at<=v_expense_date and (fpe.ended_at is null or v_expense_date<fpe.ended_at) order by fpe.started_at desc limit 1; end if;
    insert into finance_transactions(type,amount,category,project_id,entity_id,occurred_at,notes) values('expense',(p_expense->>'amount')::numeric,p_expense->>'category',v_project_id,v_expense_entity_id,v_expense_date,p_expense->>'notes') returning id into v_expense_id;
  end if;

  if v_batch.content_item_id is not null then
    if p_content is null then delete from content_items where id=v_batch.content_item_id; v_content_id:=null;
    else update content_items set title=p_content->>'title',type=coalesce(p_content->>'type','mixed'),stage=coalesce(p_content->>'stage','idea'),notes=p_content->>'notes',occurred_at=coalesce(nullif(p_content->>'occurred_at','')::date,current_date) where id=v_batch.content_item_id; v_content_id:=v_batch.content_item_id; end if;
  elsif p_content is not null then
    insert into content_items(title,type,stage,notes,occurred_at) values(p_content->>'title',coalesce(p_content->>'type','mixed'),coalesce(p_content->>'stage','idea'),p_content->>'notes',coalesce(nullif(p_content->>'occurred_at','')::date,current_date)) returning id into v_content_id;
  end if;
  update daily_log_batches set log_date=coalesce(nullif(p_events->0->>'occurred_at','')::date,nullif(p_expense->>'occurred_at','')::date,nullif(p_content->>'occurred_at','')::date,log_date),event_ids=v_new_event_ids,event_data=p_events,expense_transaction_id=v_expense_id,expense_data=p_expense,content_item_id=v_content_id,content_data=p_content,updated_at=now() where id=p_batch_id;
  return jsonb_build_object('shortfalls',v_shortfalls,'batch_id',p_batch_id);
end;
$function$;

revoke all on function public.process_daily_log(jsonb,jsonb,jsonb) from public;
revoke all on function public.edit_daily_log(uuid,jsonb,jsonb,jsonb) from public;
grant execute on function public.process_daily_log(jsonb,jsonb,jsonb) to authenticated;
grant execute on function public.edit_daily_log(uuid,jsonb,jsonb,jsonb) to authenticated;
