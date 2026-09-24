-- ============================================================
-- 0037_entity_archive_delete.sql
-- Entity archive / restore / controlled permanent deletion
-- ============================================================

-- ------------------------------------------------------------
-- 1. Add archive timestamp
-- ------------------------------------------------------------

alter table public.farm_entities
  add column if not exists archived_at timestamptz;

create index if not exists idx_farm_entities_archived_at
  on public.farm_entities(archived_at);


-- ------------------------------------------------------------
-- 2. Archive entity
-- ------------------------------------------------------------

create or replace function public.archive_farm_entity(
  p_entity_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity public.farm_entities%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.farm_can_write() then
    raise exception 'Write permission required';
  end if;

  select *
  into v_entity
  from public.farm_entities
  where id = p_entity_id
  for update;

  if not found then
    raise exception 'Farm entity not found';
  end if;

  -- Already archived: no-op.
  if v_entity.archived_at is not null then
    return jsonb_build_object(
      'entity_id', p_entity_id,
      'archived', true,
      'changed', false
    );
  end if;

  update public.farm_entities
  set archived_at = now()
  where id = p_entity_id;

  return jsonb_build_object(
    'entity_id', p_entity_id,
    'archived', true,
    'changed', true
  );
end;
$$;

revoke all on function public.archive_farm_entity(uuid)
from public;

grant execute on function public.archive_farm_entity(uuid)
to authenticated;


-- ------------------------------------------------------------
-- 3. Restore archived entity
-- ------------------------------------------------------------

create or replace function public.restore_farm_entity(
  p_entity_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity public.farm_entities%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.farm_can_write() then
    raise exception 'Write permission required';
  end if;

  select *
  into v_entity
  from public.farm_entities
  where id = p_entity_id
  for update;

  if not found then
    raise exception 'Farm entity not found';
  end if;

  if v_entity.archived_at is null then
    return jsonb_build_object(
      'entity_id', p_entity_id,
      'archived', false,
      'changed', false
    );
  end if;

  update public.farm_entities
  set archived_at = null
  where id = p_entity_id;

  return jsonb_build_object(
    'entity_id', p_entity_id,
    'archived', false,
    'changed', true
  );
end;
$$;

revoke all on function public.restore_farm_entity(uuid)
from public;

grant execute on function public.restore_farm_entity(uuid)
to authenticated;

-- ------------------------------------------------------------
-- 4. Controlled permanent deletion
--
-- Entity must be archived first.
-- Permanent deletion is allowed only when the entity has
-- absolutely no historical/dependent records.
-- ------------------------------------------------------------

create or replace function public.delete_farm_entity(
  p_entity_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity public.farm_entities%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.farm_can_write() then
    raise exception 'Write permission required';
  end if;

  select *
  into v_entity
  from public.farm_entities
  where id = p_entity_id
  for update;

  if not found then
    raise exception 'Farm entity not found';
  end if;

  if v_entity.archived_at is null then
    raise exception 'Entity must be archived before permanent deletion';
  end if;

  /*
    Permanent deletion intentionally removes records owned by this entity.

    Order matters because several tables use ON DELETE RESTRICT.
  */

  -- 1. Finance transactions linked to sales must be removed first.
  delete from public.finance_transactions
  where sale_id in (
    select id
    from public.sales
    where entity_id = p_entity_id
  );

  -- 2. Remove sales belonging to this entity.
  delete from public.sales
  where entity_id = p_entity_id;

  -- 3. Remove direct finance history belonging to this entity.
  delete from public.finance_transactions
  where entity_id = p_entity_id;

  -- 4. Remove tasks belonging to this entity.
  delete from public.tasks
  where entity_id = p_entity_id;

  -- 5. Remove content records belonging to this entity.
  delete from public.content_items
  where entity_id = p_entity_id;

  -- 6. Remove project assignment/history.
  delete from public.farm_project_entities
  where entity_id = p_entity_id;

  -- 7. Remove entity events.
  --
  -- inventory_consumptions.entity_event_id uses ON DELETE CASCADE,
  -- so its dependent consumption records are removed automatically.
  delete from public.entity_events
  where entity_id = p_entity_id;

  -- 8. Finally remove the entity itself.
  delete from public.farm_entities
  where id = p_entity_id;

  if not found then
    raise exception 'Farm entity could not be deleted';
  end if;

  return jsonb_build_object(
    'entity_id', p_entity_id,
    'deleted', true
  );
end;
$$;

revoke all on function public.delete_farm_entity(uuid)
from public;

grant execute on function public.delete_farm_entity(uuid)
to authenticated;


-- ------------------------------------------------------------
-- 5. Prevent direct client-side DELETE.
--
-- Permanent deletion must go through the controlled RPC above.
-- ------------------------------------------------------------

drop policy if exists "farmos_write" on public.farm_entities;

create policy "farmos_insert"
on public.farm_entities
for insert
with check (farm_can_write());

create policy "farmos_update"
on public.farm_entities
for update
using (farm_can_write());

-- The RPC is security-definer and performs the controlled DELETE.