/*
 * 0054_event_reversal_metadata.sql
 *
 * Adds explicit reversal state to entity events.
 *
 * Lifecycle-impacting events are not physically deleted.
 * They can later be marked as reversed by an atomic RPC.
 */

alter table public.entity_events
  add column if not exists reversed_at timestamptz;

alter table public.entity_events
  add column if not exists reversed_by uuid references auth.users(id);

alter table public.entity_events
  add column if not exists reversal_reason text;

alter table public.entity_events
  add constraint entity_events_reversal_reason_check
  check (
    reversed_at is null
    or nullif(trim(reversal_reason), '') is not null
  );