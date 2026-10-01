-- 0046_extend_entity_lifecycle.sql
--
-- Extends the existing lifecycle model introduced in 0045.
-- Does not replace or recreate lifecycle/parentage tables.

begin;

-- ============================================================
-- 1. EXTEND BIRTH DATE PRECISION
-- ============================================================

alter table public.entity_lifecycle
  drop constraint if exists entity_lifecycle_birth_precision_check;

alter table public.entity_lifecycle
  drop constraint if exists entity_lifecycle_birth_date_precision_check;

alter table public.entity_lifecycle
  add constraint entity_lifecycle_birth_precision_check
  check (
    birth_date_precision in (
      'exact',
      'estimated',
      'approximate',
      'unknown'
    )
  );


-- ============================================================
-- 2. MAKE AGE AT ACQUISITION EXPLICITLY NON-NEGATIVE
--    (Already present in 0045, kept here only as a safety
--     reconciliation for databases created from older states.)
-- ============================================================

alter table public.entity_lifecycle
  drop constraint if exists entity_lifecycle_age_check;

alter table public.entity_lifecycle
  add constraint entity_lifecycle_age_check
  check (
    age_at_acquisition_days is null
    or age_at_acquisition_days >= 0
  );


-- ============================================================
-- 3. ENSURE BIRTH-DATE PRECISION IS CONSISTENT
-- ============================================================

alter table public.entity_lifecycle
  drop constraint if exists entity_lifecycle_birth_precision_consistency_check;

alter table public.entity_lifecycle
  add constraint entity_lifecycle_birth_precision_consistency_check
  check (
    (
      birth_date is not null
      and birth_date_precision in (
        'exact',
        'estimated',
        'approximate'
      )
    )
    or
    (
      birth_date is null
      and birth_date_precision = 'unknown'
    )
  );


-- ============================================================
-- 4. PARENTAGE SAFETY
-- ============================================================

-- Ensure a farm entity cannot be simultaneously treated as
-- an external parent.

alter table public.entity_parentage
  drop constraint if exists entity_parentage_external_check;

alter table public.entity_parentage
  add constraint entity_parentage_external_check
  check (
    parent_type <> 'external'
    or (
      parent_entity_id is null
      and external_reference is not null
    )
  );


-- ============================================================
-- 5. PARENT TYPE CONSISTENCY
-- ============================================================

alter table public.entity_parentage
  drop constraint if exists entity_parentage_farm_parent_check;

alter table public.entity_parentage
  add constraint entity_parentage_farm_parent_check
  check (
    (
      parent_type = 'farm_entity'
      and parent_entity_id is not null
      and external_reference is null
    )
    or
    (
      parent_type <> 'farm_entity'
    )
  );


-- ============================================================
-- 6. DOCUMENTATION
-- ============================================================

comment on column public.entity_lifecycle.birth_date is
  'Known or estimated date of birth for an animal/entity. For crops, this may remain null and planting lifecycle data can be added separately.';

comment on column public.entity_lifecycle.birth_date_precision is
  'Confidence of birth date: exact, estimated, approximate, or unknown.';

comment on column public.entity_lifecycle.age_at_acquisition_days is
  'Age of the entity in days when acquired. Stored as days for consistent calculations.';

comment on column public.entity_parentage.parent_type is
  'Parent source: farm_entity, external, unknown, or not_recorded.';

comment on column public.entity_parentage.external_reference is
  'Human-readable reference for an external parent, such as a neighboring farm bull.';

commit;