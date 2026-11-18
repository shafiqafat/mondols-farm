-- 0128_individual_entity_registration.sql
-- Safe species-scoped entity codes and atomic individual registration.
-- This schema is currently single-admin and has no farm_id column.

begin;

-- Refuse to install a uniqueness rule over conflicting historical codes.
do $$
begin
  if exists (
    select 1
    from public.farm_entities
    where entity_code is not null
    group by entity_code
    having count(*) > 1
  ) then
    raise exception 'Duplicate entity_code values already exist. Resolve them before applying migration 0130.';
  end if;
end;
$$;

create unique index if not exists uq_farm_entities_entity_code
  on public.farm_entities(entity_code)
  where entity_code is not null;

create table if not exists public.entity_code_counters (
  species_config_id uuid primary key
    references public.species_config(id) on delete restrict,
  prefix text not null,
  last_number bigint not null default 0 check (last_number >= 0),
  updated_at timestamptz not null default now()
);

alter table public.entity_code_counters enable row level security;

-- Counters are deliberately not directly exposed to clients. The RPC below
-- runs as its owner and performs the allocation and inserts in one transaction.
revoke all on public.entity_code_counters from anon, authenticated;

create or replace function public.register_farm_entity(
  p_species_config_id uuid,
  p_label text,
  p_tracking_mode text,
  p_quantity numeric,
  p_acquired_at date default null,
  p_location text default null,
  p_notes text default null,
  p_origin_type text default null,
  p_birth_date date default null,
  p_birth_date_precision text default 'unknown',
  p_age_at_acquisition_days integer default null,
  p_parentage jsonb default '[]'::jsonb
)
returns table(entity_id uuid, entity_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_species_name text;
  v_prefix text;
  v_last bigint;
  v_code text;
  v_id uuid;
  v_parent jsonb;
begin
  if auth.uid() is null or not public.farm_can_write() then
    raise exception 'You do not have permission to register farm entities.';
  end if;

  if p_species_config_id is null then
    raise exception 'Species is required.';
  end if;
  if nullif(btrim(p_label), '') is null then
    raise exception 'Entity name is required.';
  end if;
  if p_tracking_mode not in ('individual', 'group', 'area') then
    raise exception 'Invalid tracking mode.';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero.';
  end if;
  if p_tracking_mode = 'individual' and p_quantity <> 1 then
    raise exception 'An individual entity must have quantity 1.';
  end if;

  select s.name into v_species_name
  from public.species_config s
  where s.id = p_species_config_id
    and s.archived_at is null;

  if not found then
    raise exception 'Selected species does not exist or is archived.';
  end if;

  -- Known species get stable business prefixes; custom species get a
  -- deterministic three-character fallback. Adjust the CASE as species grow.
  v_prefix := case lower(v_species_name)
    when 'black bengal goat' then 'GOT'
    when 'goat' then 'GOT'
    when 'broiler' then 'BRO'
    when 'broiler chicken' then 'BRO'
    when 'sonali' then 'SON'
    when 'sonali chicken' then 'SON'
    when 'deshi chicken' then 'CHK'
    when 'duck' then 'DUC'
    when 'quail' then 'QUA'
    else upper(left(regexp_replace(v_species_name, '[^A-Za-z0-9]', '', 'g'), 3))
  end;

  if v_prefix is null or length(v_prefix) = 0 then
    raise exception 'Could not derive an entity-code prefix for species %.', v_species_name;
  end if;

  if p_tracking_mode = 'individual' then
    insert into public.entity_code_counters(species_config_id, prefix, last_number)
    values (p_species_config_id, v_prefix, 0)
    on conflict (species_config_id) do nothing;

    -- Row lock serializes allocations for this species under concurrent calls.
    select c.last_number into v_last
    from public.entity_code_counters c
    where c.species_config_id = p_species_config_id
    for update;

    -- Seed the counter from existing codes of this species, so historical IDs
    -- are never reissued even when the counter table is first introduced.
    select greatest(
      v_last,
      coalesce(max((substring(e.entity_code from '([0-9]+)$'))::bigint), 0)
    )
    into v_last
    from public.farm_entities e
    where e.species_config_id = p_species_config_id
      and e.entity_code like v_prefix || '-%';

    v_last := v_last + 1;
    v_code := v_prefix || '-' || lpad(v_last::text, 3, '0');

    update public.entity_code_counters
    set prefix = v_prefix, last_number = v_last, updated_at = now()
    where species_config_id = p_species_config_id;
  end if;

  insert into public.farm_entities (
    species_config_id, label, tracking_mode, entity_code, entity_name,
    quantity, acquired_at, location, notes, status
  )
  values (
    p_species_config_id, btrim(p_label), p_tracking_mode, v_code, btrim(p_label),
    p_quantity, p_acquired_at, nullif(btrim(p_location), ''),
    nullif(btrim(p_notes), ''), 'active'
  )
  returning id into v_id;

  if p_tracking_mode = 'individual' then
    if p_origin_type is null then
      raise exception 'Origin type is required for individual registration.';
    end if;

    insert into public.entity_lifecycle (
      entity_id, origin_type, birth_date, birth_date_precision,
      age_at_acquisition_days
    )
    values (
      v_id, p_origin_type, p_birth_date, p_birth_date_precision,
      p_age_at_acquisition_days
    );

    if jsonb_typeof(coalesce(p_parentage, '[]'::jsonb)) <> 'array' then
      raise exception 'Parentage must be an array.';
    end if;

    for v_parent in select value from jsonb_array_elements(coalesce(p_parentage, '[]'::jsonb))
    loop
      insert into public.entity_parentage (
        child_entity_id, parent_role, parent_type, parent_entity_id, external_reference
      )
      values (
        v_id,
        v_parent->>'parent_role',
        v_parent->>'parent_type',
        nullif(v_parent->>'parent_entity_id', '')::uuid,
        nullif(v_parent->>'external_reference', '')
      );
    end loop;
  end if;

  return query select v_id, v_code;
end;
$$;

revoke all on function public.register_farm_entity(
  uuid, text, text, numeric, date, text, text, text, date, text, integer, jsonb
) from public, anon;
grant execute on function public.register_farm_entity(
  uuid, text, text, numeric, date, text, text, text, date, text, integer, jsonb
) to authenticated;

commit;
