-- Validate the existing entity event payload object constraint.
-- Existing data has already been checked and contains no invalid payloads.

alter table public.entity_events
  validate constraint entity_events_payload_object_check;