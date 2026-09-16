// Inventory engine — pure functions only, no Supabase/React.
// Handles FIFO costing: oldest lot consumed first, explicitly split across
// multiple lots when a single day's usage exceeds what's left in one lot.

/**
 * Given all lots for one item, return current total stock and the
 * weighted-average cost of what's actually remaining.
 */
export function computeStock(lots = []) {
  const totalRemaining = lots.reduce((sum, lot) => sum + Number(lot.qty_remaining), 0);
  const totalValue = lots.reduce(
    (sum, lot) => sum + Number(lot.qty_remaining) * Number(lot.cost_per_unit),
    0
  );
  return {
    totalRemaining,
    weightedAvgCost: totalRemaining > 0 ? totalValue / totalRemaining : 0,
  };
}

/**
 * Consume `qtyToConsume` units FIFO across lots (oldest purchased_at first).
 * Returns which lots changed (so the caller can persist just those rows),
 * the true cost of what was consumed, and any shortfall if stock ran out
 * mid-consumption — this is reported explicitly rather than silently
 * letting a lot go negative.
 */
export function consumeFIFO(lots = [], qtyToConsume) {
  const sorted = [...lots].sort(
    (a, b) => new Date(a.purchased_at) - new Date(b.purchased_at)
  );

  let remainingNeeded = Number(qtyToConsume);
  let totalCost = 0;
  const updatedLots = [];

  for (const lot of sorted) {
    if (remainingNeeded <= 0) break;
    const available = Number(lot.qty_remaining);
    if (available <= 0) continue;

    const takeFromThisLot = Math.min(available, remainingNeeded);
    const newRemaining = available - takeFromThisLot;

    updatedLots.push({ id: lot.id, qty_remaining: newRemaining });
    totalCost += takeFromThisLot * Number(lot.cost_per_unit);
    remainingNeeded -= takeFromThisLot;
  }

  return {
    updatedLots,
    consumed: Number(qtyToConsume) - remainingNeeded,
    cost: totalCost,
    shortfall: remainingNeeded > 0 ? remainingNeeded : 0,
  };
}
