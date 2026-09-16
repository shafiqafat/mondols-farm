// Entity event type catalogue — pure data + small helpers, no framework.
// Each type declares which entity categories it applies to and which
// small set of fields it needs. Adding a new lifecycle event later means
// adding one entry here, not touching any page component.

export const EVENT_TYPES = [
  {
    value: "planting",
    label: "Planting",
    categories: ["crop", "fodder"],
    fields: ["variety", "expectedDurationDays"],
  },
  {
    value: "fertilizer_applied",
    label: "Fertilizer applied",
    categories: ["crop", "fodder"],
    fields: ["amount", "unit"],
  },
  {
    value: "irrigation",
    label: "Irrigation",
    categories: ["crop", "fodder"],
    fields: ["note"],
  },
  {
    value: "pest_observation",
    label: "Pest / disease observation",
    categories: ["crop", "fodder"],
    fields: ["note"],
  },
  {
    value: "growth_stage",
    label: "Growth stage update",
    categories: ["crop", "fodder"],
    fields: ["note"],
  },
  {
    value: "harvest",
    label: "Harvest",
    categories: ["crop", "fodder"],
    fields: ["amount", "unit", "note"],
  },
  {
    value: "processing",
    label: "Processing",
    categories: ["crop", "fodder"],
    fields: ["note"],
  },
  {
    value: "health_note",
    label: "Health observation",
    categories: ["poultry", "livestock"],
    fields: ["note"],
  },
  {
    value: "weight_check",
    label: "Weight check",
    categories: ["poultry", "livestock"],
    fields: ["amount", "unit"],
  },
  {
    value: "note",
    label: "General note",
    categories: ["poultry", "livestock", "crop", "fodder"],
    fields: ["note"],
  },
];

export function eventTypesForCategory(category) {
  return EVENT_TYPES.filter((t) => t.categories.includes(category));
}

export function eventTypeLabel(value) {
  return EVENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

/**
 * Build the payload object for a selected event type from raw form values.
 * Blank optional fields are simply omitted from the payload.
 */
export function buildEventPayload(typeDef, values) {
  const payload = {};
  for (const field of typeDef.fields) {
    const raw = values[field];
    if (raw === undefined || raw === null || raw === "") continue;

    if (field === "amount" || field === "expectedDurationDays") {
      const num = Number(raw);
      if (!Number.isNaN(num)) payload[field] = num;
    } else {
      payload[field] = raw;
    }
  }
  return payload;
}

/**
 * Given event history, find the most recent planting event and compute
 * an expected harvest date from its expectedDurationDays — this is the
 * simple deterministic half of "what's going to happen" (Part 27, Level 2)
 * for crops, ahead of the full forecasting engine.
 */
export function computeExpectedHarvest(events) {
  const plantings = events
    .filter((e) => e.type === "planting" && e.payload?.expectedDurationDays)
    .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));

  if (plantings.length === 0) return null;

  const latest = plantings[0];
  const plantedDate = new Date(latest.occurred_at);
  const expected = new Date(plantedDate);
  expected.setDate(expected.getDate() + Number(latest.payload.expectedDurationDays));

  return {
    plantedAt: latest.occurred_at,
    variety: latest.payload.variety ?? null,
    expectedDurationDays: latest.payload.expectedDurationDays,
    expectedHarvestDate: expected.toISOString().slice(0, 10),
  };
}
