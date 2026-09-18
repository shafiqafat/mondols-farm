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
      'weight_check',
      'feed_given',
      'egg_count',
      'note'
    )
  ) not valid;