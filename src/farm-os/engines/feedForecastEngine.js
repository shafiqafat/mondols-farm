// Feed forecast engine — pure functions only.
//
// Deliberately item-level rather than per-animal: it forecasts "how fast
// is this feed bag emptying", aggregated across every entity drawing from
// it, using feed_given events tagged with item_id. This is simpler than
// per-animal-rate modeling and matches the brief's own flock-level example
// (§7: "100 quail... 2.2 kg/day" is a whole-flock number). A population
// jump (e.g. +50 quail) will show up in the rate within a few days of new
// data rather than instantly — a known, documented limitation, not a bug.

/**
 * Group feed_given events (already filtered to one item_id) into a
 * date -> total kg map. Multiple entities feeding from the same item on
 * the same day are summed together.
 */
export function aggregateDailyConsumption(feedEvents = []) {
  const byDate = {};
  for (const event of feedEvents) {
    const qty = Number(event.payload?.qty_kg ?? 0);
    byDate[event.occurred_at] = (byDate[event.occurred_at] ?? 0) + qty;
  }
  return byDate;
}

/**
 * Exponentially-weighted moving average of daily consumption — recent
 * days count more than older ones, so the rate reacts to real trends
 * without being thrown off by one unusually high or low day.
 * Returns null when there isn't enough history to trust a rate yet.
 */
export function computeDailyRate(dailyMap, alpha = 0.3) {
  const dates = Object.keys(dailyMap).sort();
  if (dates.length < 2) return null;

  let rate = dailyMap[dates[0]];
  for (let i = 1; i < dates.length; i++) {
    rate = alpha * dailyMap[dates[i]] + (1 - alpha) * rate;
  }
  return rate;
}

/**
 * Days of stock remaining at the current rate. Null (not Infinity/0) when
 * there's no reliable rate to divide by — callers should show "not enough
 * data" rather than a misleading number.
 */
export function daysRemaining(currentStock, dailyRate) {
  if (dailyRate == null || dailyRate <= 0) return null;
  return currentStock / dailyRate;
}

/**
 * Green/yellow/red classification against a supplier lead time.
 * Red: stock could run out before a reorder placed today would arrive.
 * Yellow: within 2x lead time — worth reordering soon.
 * 'unknown' when there isn't enough data for a number at all.
 */
export function classifyAlert(remainingDays, leadTimeDays) {
  if (remainingDays == null) return "unknown";
  const lead = leadTimeDays ?? 7;
  if (remainingDays <= lead) return "red";
  if (remainingDays <= lead * 2) return "yellow";
  return "green";
}

export function estimateMonthlyRequirement(dailyRate) {
  if (dailyRate == null) return null;
  return dailyRate * 30;
}
