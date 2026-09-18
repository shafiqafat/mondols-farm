-- 0012_validate_entity_events.sql
--
-- Protect entity_events from invalid core event data.
-- Existing historical rows are not rewritten by this migration.


-- ------------------------------------------------------------
-- 1. Event type validation
-- ------------------------------------------------------------

alter table public.entity_events
  drop constraint if exists entity_events_type_check;

alter table public.entity_events
  add constraint entity_events_type_check
  check (
    type in (
      'weight',
      'feed',
      'egg_production',
      'harvest',
      'treatment',
      'mortality',
      'breeding',
      'purchase',
      'sale',
      'planting',
      'fertilizer_applied',
      'irrigation',
      'pest_observation',
      'growth_stage',
      'processing',
      'health_note',
      'other',

      -- Legacy event types already present in historical data.
      'weight_check',
      'feed_given',
      'egg_count'
    )
  ) not valid;


-- ------------------------------------------------------------
-- 2. Payload must be a JSON object
-- ------------------------------------------------------------

alter table public.entity_events
  drop constraint if exists entity_events_payload_object_check;

alter table public.entity_events
  add constraint entity_events_payload_object_check
  check (
    jsonb_typeof(payload) = 'object'
  ) not valid;


-- ------------------------------------------------------------
-- 3. Core numeric payload validation
--
-- These constraints allow historical invalid rows to remain
-- queryable while preventing invalid NEW/UPDATED rows.
-- ------------------------------------------------------------

alter table public.entity_events
  drop constraint if exists entity_events_numeric_payload_check;

alter table public.entity_events
  add constraint entity_events_numeric_payload_check
  check (
    (
      type in ('mortality', 'egg_count')
      and payload ? 'count'
      and (payload->>'count') ~ '^[0-9]+$'
      and (payload->>'count')::numeric >= 0
    )
    or
    (
      type in ('feed_given', 'harvest')
      and payload ? 'qty_kg'
      and (payload->>'qty_kg') ~ '^[0-9]+(\.[0-9]+)?$'
      and (payload->>'qty_kg')::numeric >= 0
    )
    or
    (
      type = 'weight_check'
      and payload ? 'kg'
      and (payload->>'kg') ~ '^[0-9]+(\.[0-9]+)?$'
      and (payload->>'kg')::numeric >= 0
    )
    or
    (
      type in (
        'weight',
        'feed',
        'egg_production',
        'treatment',
        'breeding',
        'purchase',
        'sale',
        'planting',
        'fertilizer_applied',
        'irrigation',
        'pest_observation',
        'growth_stage',
        'processing',
        'health_note',
        'other'
      )
    )
  ) not valid;