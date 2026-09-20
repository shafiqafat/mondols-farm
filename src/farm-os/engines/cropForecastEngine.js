// Crop forecast engine — pure deterministic calculations only.

/**
 * Given event history, find the most recent planting event and compute
 * an expected harvest date from its expectedDurationDays.
 */
export function computeExpectedHarvest(events = []) {
  const plantings = events
    .filter(
      (event) =>
        event.type === "planting" && event.payload?.expectedDurationDays,
    )
    .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));

  if (plantings.length === 0) return null;

  const latest = plantings[0];
  const plantedDate = new Date(latest.occurred_at);
  const expected = new Date(plantedDate);

  expected.setDate(
    expected.getDate() + Number(latest.payload.expectedDurationDays),
  );

  return {
    plantedAt: latest.occurred_at,
    variety: latest.payload.variety ?? null,
    expectedDurationDays: latest.payload.expectedDurationDays,
    expectedHarvestDate: expected.toISOString().slice(0, 10),
  };
}
