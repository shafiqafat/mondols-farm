-- 7.7H.5
-- Prevent direct client mutation/deletion of entity event history.
-- Event creation/reversal must go through controlled RPCs.

drop policy if exists farmos_write on public.entity_events;

revoke insert, update, delete
on public.entity_events
from anon, authenticated;