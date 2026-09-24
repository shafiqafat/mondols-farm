alter table public.species_config
add column if not exists archived_at timestamptz;

create index if not exists idx_species_config_archived_at
on public.species_config (archived_at);

create or replace function public.archive_species_config(
  p_species_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_species public.species_config%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.farm_can_write() then
    raise exception 'Write permission required';
  end if;

  select *
  into v_species
  from public.species_config
  where id = p_species_id
  for update;

  if not found then
    raise exception 'Species configuration not found';
  end if;

  if v_species.archived_at is not null then
    raise exception 'Species configuration is already archived';
  end if;

  update public.species_config
  set archived_at = now()
  where id = p_species_id;

  return jsonb_build_object(
    'species_id', p_species_id,
    'archived', true,
    'archived_at', now()
  );
end;
$$;

create or replace function public.restore_species_config(
  p_species_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_species public.species_config%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.farm_can_write() then
    raise exception 'Write permission required';
  end if;

  select *
  into v_species
  from public.species_config
  where id = p_species_id
  for update;

  if not found then
    raise exception 'Species configuration not found';
  end if;

  if v_species.archived_at is null then
    raise exception 'Species configuration is already active';
  end if;

  update public.species_config
  set archived_at = null
  where id = p_species_id;

  return jsonb_build_object(
    'species_id', p_species_id,
    'archived', false
  );
end;
$$;

revoke all on function public.archive_species_config(uuid)
from public;

revoke all on function public.restore_species_config(uuid)
from public;

grant execute on function public.archive_species_config(uuid)
to authenticated;

grant execute on function public.restore_species_config(uuid)
to authenticated;