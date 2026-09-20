-- 0031: Fix entity event numeric payload validation.
--
-- The numeric payload constraint applies only to numeric operational events.
-- Lifecycle/non-numeric events such as status_changed are validated separately.

alter table public.entity_events
  drop constraint if exists entity_events_numeric_payload_check;

alter table public.entity_events
  add constraint entity_events_numeric_payload_check
  check (
    (
      type not in (
        'feed_given',
        'egg_count',
        'weight_check',
        'harvest',
        'mortality'
      )
    )
    or
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

alter table public.entity_events
  validate constraint entity_events_numeric_payload_check;