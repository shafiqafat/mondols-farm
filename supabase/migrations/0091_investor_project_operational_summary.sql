create or replace function public.get_investor_project_operational_summary(
  p_project_id uuid
)
returns table (
  project_id uuid,
  exposure_scope text,
  entity_count bigint,
  active_entity_count bigint,
  total_quantity numeric,
  species_count bigint,
  total_income numeric,
  total_expense numeric,
  net_financial_position numeric
)
language sql
security definer
set search_path = public
as $$
  with investor_allocations as (
    select
      ia.scope_type,
      ia.species_config_id
    from investment_allocations ia
    join investments i
      on i.id = ia.investment_id
    join investors inv
      on inv.id = i.investor_id
    where ia.project_id = p_project_id
      and inv.user_id = auth.uid()
      and inv.status = 'active'
      and i.status = 'active'
  ),

  scope_resolution as (
    select
      case
        when bool_or(scope_type = 'full_project')
          then 'full_project'
        when count(*) > 0
          then 'partial'
        else null
      end as exposure_scope
    from investor_allocations
  ),

  allowed_entities as (
    select
      fe.id,
      fe.species_config_id,
      fe.status,
      fe.quantity
    from farm_entities fe
    cross join scope_resolution sr
    where fe.project_id = p_project_id
      and sr.exposure_scope is not null
      and (
        sr.exposure_scope = 'full_project'
        or exists (
          select 1
          from investor_allocations ia
          where ia.scope_type in ('species_activity', 'partial')
            and ia.species_config_id is not null
            and ia.species_config_id = fe.species_config_id
        )
      )
  ),

  entity_summary as (
    select
      count(*) as entity_count,
      count(*) filter (
        where status = 'active'
      ) as active_entity_count,
      coalesce(sum(quantity), 0) as total_quantity,
      count(distinct species_config_id) as species_count
    from allowed_entities
  ),

  financial_summary as (
    select
      coalesce(
        sum(amount) filter (where type = 'income'),
        0
      ) as total_income,
      coalesce(
        sum(amount) filter (where type = 'expense'),
        0
      ) as total_expense
    from finance_transactions ft
    cross join scope_resolution sr
    where ft.project_id = p_project_id
      and sr.exposure_scope = 'full_project'
  )

  select
    p_project_id,
    sr.exposure_scope,
    es.entity_count,
    es.active_entity_count,
    es.total_quantity,
    es.species_count,
    case
      when sr.exposure_scope = 'full_project'
        then fs.total_income
      else null
    end as total_income,
    case
      when sr.exposure_scope = 'full_project'
        then fs.total_expense
      else null
    end as total_expense,
    case
      when sr.exposure_scope = 'full_project'
        then fs.total_income - fs.total_expense
      else null
    end as net_financial_position
  from scope_resolution sr
  cross join entity_summary es
  cross join financial_summary fs
  where sr.exposure_scope is not null;
$$;

revoke all
on function public.get_investor_project_operational_summary(uuid)
from public;

grant execute
on function public.get_investor_project_operational_summary(uuid)
to authenticated;