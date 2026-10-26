// Crop forecast engine — pure deterministic calculations only.

/**
 * Find the most recent valid planting event and calculate
 * its expected harvest date.
 *
 * Reversed planting events are ignored.
 * Invalid or missing growing durations are ignored.
 */
export function computeExpectedHarvest(events = []) {
  const plantings = events
    .filter((event) => {
      if (event.type !== "planting") return false;

      // Ignore reversed events.
      if (event.reversed_at) return false;

      const duration = Number(event.payload?.expectedDurationDays);

      // Require a positive, finite duration.
      if (!Number.isFinite(duration) || duration <= 0) {
        return false;
      }

      // Require a valid planting date.
      if (!event.occurred_at) return false;

      const date = new Date(event.occurred_at);

      return !Number.isNaN(date.getTime());
    })
    .sort(
      (a, b) =>
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
    );

  if (plantings.length === 0) return null;

  const latest = plantings[0];
  const duration = Number(latest.payload.expectedDurationDays);

  // Use the date portion to avoid timezone-related date shifts.
  const plantedAt = String(latest.occurred_at).slice(0, 10);
  const [year, month, day] = plantedAt.split("-").map(Number);

  const expected = new Date(Date.UTC(year, month - 1, day + duration));

  if (Number.isNaN(expected.getTime())) return null;

  return {
    plantedAt,
    variety: latest.payload?.variety ?? null,
    expectedDurationDays: duration,
    expectedHarvestDate: expected.toISOString().slice(0, 10),
  };
}
