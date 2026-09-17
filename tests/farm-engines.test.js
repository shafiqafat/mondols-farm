import test from "node:test";
import assert from "node:assert/strict";
import { consumeFIFO, computeStock } from "../src/farm-os/engines/inventoryEngine.js";
import { computeTotals, computeCostPerUnit, splitByPercent } from "../src/farm-os/engines/financeEngine.js";
import { computeNextDueDate } from "../src/farm-os/engines/taskEngine.js";

test("FIFO inventory consumes the oldest lots first without going negative", () => {
  const result = consumeFIFO([
    { id: "old", purchased_at: "2026-01-01", qty_remaining: 3, cost_per_unit: 10 },
    { id: "new", purchased_at: "2026-01-02", qty_remaining: 5, cost_per_unit: 12 },
  ], 6);

  assert.deepEqual(result.updatedLots, [
    { id: "old", qty_remaining: 0 },
    { id: "new", qty_remaining: 2 },
  ]);
  assert.equal(result.cost, 66);
  assert.equal(result.shortfall, 0);
});

test("FIFO reports a stock shortfall explicitly", () => {
  const result = consumeFIFO([{ id: "lot", purchased_at: "2026-01-01", qty_remaining: 2, cost_per_unit: 10 }], 3);
  assert.equal(result.consumed, 2);
  assert.equal(result.shortfall, 1);
  assert.equal(computeStock([{ qty_remaining: 2, cost_per_unit: 10 }]).weightedAvgCost, 10);
});

test("finance totals keep assets out of operating net", () => {
  const totals = computeTotals([
    { type: "income", amount: 1000 },
    { type: "expense", amount: 350 },
    { type: "asset", amount: 500 },
  ]);
  assert.deepEqual(totals, { income: 1000, expense: 350, asset: 500, net: 650 });
  assert.equal(computeCostPerUnit(100, 0), null);
  assert.deepEqual(splitByPercent(1000, [{ projectId: "a", percent: 60 }]), [{ projectId: "a", amount: 600 }]);
});

test("recurring task dates use local calendar arithmetic", () => {
  assert.equal(computeNextDueDate("2026-01-31", "monthly"), "2026-03-03");
  assert.equal(computeNextDueDate("2026-02-28", "daily"), "2026-03-01");
});
