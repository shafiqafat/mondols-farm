-- 7.7H.8
-- Remove the legacy record_entity_event overload.
-- The canonical signature is:
-- record_entity_event(uuid, text, jsonb, date)

drop function if exists public.record_entity_event(
  uuid,
  text,
  date,
  jsonb
);