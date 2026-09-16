// Scenario engine — pure functions only.
// Composes with capacityEngine.summarizeCapacity for the resource side;
// this handles the financial side of "what if I add N of X".

export function computeScenarioFinancials({
  count,
  initialInvestmentPerUnit = 0,
  monthlyCostPerUnit = 0,
  monthlyRevenuePerUnit = 0,
}) {
  const totalInvestment = count * initialInvestmentPerUnit;
  const totalMonthlyCost = count * monthlyCostPerUnit;
  const totalMonthlyRevenue = count * monthlyRevenuePerUnit;
  const monthlyMargin = totalMonthlyRevenue - totalMonthlyCost;

  return {
    totalInvestment,
    totalMonthlyCost,
    totalMonthlyRevenue,
    monthlyMargin,
    paybackMonths:
      monthlyMargin > 0 && totalInvestment > 0 ? totalInvestment / monthlyMargin : null,
  };
}

/**
 * A plain-language recommendation combining capacity classification and
 * financial margin — the "Level 3: what should I do" layer from the brief.
 * Deliberately conservative: a capacity problem always overrides a good
 * margin, since running out of feed/space is the more urgent risk.
 */
export function recommendationFor(capacityLevel, monthlyMargin) {
  if (capacityLevel === "over") {
    return "Not recommended without increasing capacity on the constrained resource first.";
  }
  if (capacityLevel === "stretch") {
    return monthlyMargin >= 0
      ? "Possible, but will require additional resources — margin looks positive if you can supply them."
      : "Possible on resources, but the projected margin is negative — reconsider the cost/revenue assumptions.";
  }
  // safe
  return monthlyMargin >= 0
    ? "Within current capacity with a positive projected margin — reasonable to proceed."
    : "Within current capacity, but projected margin is negative — check your cost/revenue inputs.";
}
