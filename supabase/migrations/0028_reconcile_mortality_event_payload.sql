-- 0028: Reconcile legacy and modern mortality event payloads.
--
-- Daily Log uses:
--   mortality -> { "count": N }
--
-- Entity Detail uses:
--   mortality -> { "quantity": N }
--
-- Keep both temporarily so historical/legacy events remain readable while
-- the newer Entity Detail event schema is supported.

alter table public.entity_events
  drop constraint if exists entity_events_numeric_payload_check;


alter table public.entity_events
  add constraint entity_events_numeric_payload_check
  check (
    (
      type = 'feed_given'
      and jsonb_typeof(payload -> 'qty_kg') = 'number'
      and (payload ->> 'qty_kg')::numeric >= 0
    )
    or
    (
      type = 'egg_count'
      and jsonb_typeof(payload -> 'count') = 'number'
      and (payload ->> 'count')::numeric >= 0
    )
    or
    (
      type = 'weight_check'
      and jsonb_typeof(payload -> 'kg') = 'number'
      and (payload ->> 'kg')::numeric > 0
    )
    or
    (
      type = 'harvest'
      and jsonb_typeof(payload -> 'qty_kg') = 'number'
      and (payload ->> 'qty_kg')::numeric > 0
    )
    or
    (
      type = 'mortality'
      and jsonb_typeof(payload -> 'count') = 'number'
      and (payload ->> 'count')::numeric >= 0
    )
    or
    (
      type = 'mortality'
      and jsonb_typeof(payload -> 'quantity') = 'number'
      and (payload ->> 'quantity')::numeric >= 1
    )
  )
  not valid;