// Capacity engine — pure functions only.
//
// Each constraint is { name, capacity, measured }. `measured` distinguishes
// a number backed by real records (e.g. fodder yield from harvest events)
// from one you typed in as a best guess (e.g. "labour capacity: 4 goats").
// Both are used the same way mathematically, but the UI must show which
// is which — an estimate presented with the same confidence as a measured
// figure is the specific flaw this engine exists to avoid (Part C, idea 5).

/**
 * Find the scarcest resource — the bottleneck is whichever constraint
 * allows the fewest animals/units, by definition.
 */
export function findBottleneck(constraints = []) {
  if (constraints.length === 0) return null;
  return [...constraints].sort((a, b) => a.capacity - b.capacity)[0];
}

/**
 * Classify a proposed count against safe (the bottleneck capacity) and
 * stretch (a configurable multiplier beyond safe, default 1.5x).
 */
export function classifyCapacity(proposedCount, safeCapacity, stretchMultiplier = 1.5) {
  const stretchCapacity = safeCapacity * stretchMultiplier;
  if (proposedCount <= safeCapacity) return "safe";
  if (proposedCount <= stretchCapacity) return "stretch";
  return "over";
}

/**
 * Full summary: bottleneck, safe/stretch capacities, and classification
 * of a proposed count — the shape the Capacity page renders directly.
 */
export function summarizeCapacity(constraints, proposedCount, stretchMultiplier = 1.5) {
  const bottleneck = findBottleneck(constraints);
  if (!bottleneck) return null;

  const safeCapacity = bottleneck.capacity;
  const stretchCapacity = safeCapacity * stretchMultiplier;
  const level = classifyCapacity(proposedCount, safeCapacity, stretchMultiplier);

  return {
    bottleneck,
    safeCapacity,
    stretchCapacity,
    level,
    allConstraints: [...constraints].sort((a, b) => a.capacity - b.capacity),
  };
}
