-- ============================================================
-- 0033 — Harden inventory consumption ledger integrity
-- ============================================================

-- ------------------------------------------------------------
-- 1. Create a composite key that can be referenced by
--    (item_id, lot_id).
-- ------------------------------------------------------------

create unique index if not exists
  inventory_lots_item_id_id_unique
on public.inventory_lots (item_id, id);


-- ------------------------------------------------------------
-- 2. Ensure the consumption item and lot belong together.
-- ------------------------------------------------------------

alter table public.inventory_consumptions
  add constraint inventory_consumptions_item_lot_fk
  foreign key (item_id, lot_id)
  references public.inventory_lots (item_id, id)
  on delete restrict
  not valid;


-- ------------------------------------------------------------
-- 3. Ensure the recorded total cost is mathematically correct.
-- ------------------------------------------------------------

alter table public.inventory_consumptions
  add constraint inventory_consumptions_total_cost_calculation_check
  check (
    total_cost = quantity * unit_cost
  )
  not valid;


-- ------------------------------------------------------------
-- 4. Validate existing data.
-- ------------------------------------------------------------

alter table public.inventory_consumptions
  validate constraint inventory_consumptions_item_lot_fk;

alter table public.inventory_consumptions
  validate constraint inventory_consumptions_total_cost_calculation_check;