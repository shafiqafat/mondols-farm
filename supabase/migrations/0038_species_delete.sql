create or replace function public.delete_species_config(
  p_species_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_species public.species_config%rowtype;
  v_entity_count integer;
  v_variant_count integer;
  v_rotation_rule_count integer;
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

  select count(*)
  into v_entity_count
  from public.farm_entities
  where species_config_id = p_species_id;

  select count(*)
  into v_variant_count
  from public.species_variants
  where species_config_id = p_species_id;

  select count(*)
  into v_rotation_rule_count
  from public.crop_rotation_rules
  where from_species_id = p_species_id
     or to_species_id = p_species_id;

  if v_entity_count > 0
     or v_variant_count > 0
     or v_rotation_rule_count > 0 then

    return jsonb_build_object(
      'deleted', false,
      'can_delete', false,
      'species_id', p_species_id,
      'species_name', v_species.name,
      'entity_count', v_entity_count,
      'variant_count', v_variant_count,
      'rotation_rule_count', v_rotation_rule_count
    );
  end if;

  delete from public.species_config
  where id = p_species_id;

  if not found then
    raise exception 'Species configuration could not be deleted';
  end if;

  return jsonb_build_object(
    'deleted', true,
    'can_delete', true,
    'species_id', p_species_id,
    'species_name', v_species.name
  );
end;
$$;

revoke all on function public.delete_species_config(uuid)
from public;

grant execute on function public.delete_species_config(uuid)
to authenticated;