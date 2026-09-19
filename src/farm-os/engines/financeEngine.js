// Finance engine — pure functions only.

/**
 * Sum a set of finance_transactions into totals by type, plus net
 * (income - expense). Assets are tracked separately and deliberately
 * excluded from net — a breeding goat purchase isn't a loss the day
 * you buy it, per the brief's cash-expense-vs-asset distinction.
 */
export function computeTotals(transactions = []) {
  const totals = { income: 0, expense: 0, asset: 0 };
  for (const t of transactions) {
    if (t.type in totals) totals[t.type] += Number(t.amount);
  }
  return {
    ...totals,
    net: totals.income - totals.expense,
  };
}


/**
 * Calculate break-even quantity and revenue.
 *
 * fixedCost:
 *   Costs that do not change with the number of units produced/sold.
 *
 * variableCostPerUnit:
 *   Cost associated with producing one additional unit.
 *
 * sellingPricePerUnit:
 *   Expected selling price for one unit.
 *
 * Returns null when the contribution margin is zero or negative.
 */
export function computeBreakEven(
  fixedCost,
  variableCostPerUnit,
  sellingPricePerUnit,
) {
  const fixed = Number(fixedCost);
  const variable = Number(variableCostPerUnit);
  const price = Number(sellingPricePerUnit);

  if (
    !Number.isFinite(fixed) ||
    !Number.isFinite(variable) ||
    !Number.isFinite(price) ||
    fixed < 0 ||
    variable < 0 ||
    price <= 0
  ) {
    return null;
  }

  const contributionPerUnit = price - variable;

  if (contributionPerUnit <= 0) {
    return null;
  }

  const quantity = fixed / contributionPerUnit;

  return {
    quantity,
    revenue: quantity * price,
    contributionPerUnit,
  };
}

/**
 * Cost per unit of yield, e.g. cost/kg for a crop project.
 * Returns null when there's no yield to divide by, rather than Infinity —
 * callers should treat null as "not enough data" and show that plainly.
 */
export function computeCostPerUnit(totalCost, totalYield) {
  if (!totalYield || totalYield <= 0) return null;
  return totalCost / totalYield;
}

/**
 * Split a total amount across a set of {projectId, percent} allocations.
 * Percentages should sum to 100 — this doesn't enforce that, it just
 * computes amounts; the caller validates before inserting rows.
 */
export function splitByPercent(totalAmount, allocations = []) {
  return allocations.map((a) => ({
    projectId: a.projectId,
    amount: Number(((Number(totalAmount) * Number(a.percent)) / 100).toFixed(2)),
  }));
}
