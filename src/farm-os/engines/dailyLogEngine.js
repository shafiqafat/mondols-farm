// Daily Log engine — pure functions only.
// Given a species' capabilities, decide which quick-entry fields apply.
// Given form values, build the rows to insert into entity_events.
// No Supabase or React imports here on purpose: this logic should be
// testable and reusable (e.g. by a future bulk-import tool) on its own.

// Capability key -> quick field definition.
// `key` is the form-state field name; `eventType`/`payloadKey` define the
// entity_events row this field produces when filled in.
export const CAPABILITY_FIELDS = {
  feed: {
    key: "feed_kg",
    label: "Feed (kg)",
    eventType: "feed_given",
    payloadKey: "qty_kg",
    inputMode: "decimal",
  },
  egg: {
    key: "egg_count",
    label: "Eggs",
    eventType: "egg_count",
    payloadKey: "count",
    inputMode: "numeric",
  },
  weight: {
    key: "weight_kg",
    label: "Weight (kg)",
    eventType: "weight_check",
    payloadKey: "kg",
    inputMode: "decimal",
  },
  harvest: {
    key: "harvest_kg",
    label: "Harvest (kg)",
    eventType: "harvest",
    payloadKey: "qty_kg",
    inputMode: "decimal",
  },
};

// Health capability doesn't map 1:1 to a single field — it unlocks the
// mortality count specifically. Kept separate from CAPABILITY_FIELDS
// since "health" as a capability is broader than this one quick field.
export const MORTALITY_FIELD = {
  key: "mortality",
  label: "Mortality",
  eventType: "mortality",
  payloadKey: "count",
  inputMode: "numeric",
};

/**
 * Given a species_config.capabilities object, return the ordered list of
 * quick-entry field definitions that apply. A brand-new species with a
 * capability we haven't built a dedicated field for yet is simply skipped
 * here rather than breaking — it still gets the universal Note field.
 */
export function getQuickFieldsForCapabilities(capabilities = {}) {
  const fields = [];
  for (const capKey of Object.keys(CAPABILITY_FIELDS)) {
    if (capabilities[capKey]) {
      fields.push(CAPABILITY_FIELDS[capKey]);
    }
  }
  if (capabilities.health) {
    fields.push(MORTALITY_FIELD);
  }
  return fields;
}

/**
 * Build the entity_events rows for one entity's form values.
 * Blank fields are skipped — Daily Log should only record what you
 * actually typed, not create noise rows for every unfilled field.
 */
export function buildEventRows({ entityId, occurredAt, fields, values }) {
  const rows = [];

  for (const field of fields) {
    const raw = values[field.key];
    if (raw === undefined || raw === null || raw === "") continue;

    const numericValue = Number(raw);

    if (!Number.isFinite(numericValue)) {
      continue;
    }

    if (field.eventType === "mortality") {
      if (!Number.isInteger(numericValue) || numericValue < 1) {
        continue;
      }
    }

    if (
      field.eventType !== "mortality" &&
      numericValue < 0
    ) {
      continue;
    }

    rows.push({
      entity_id: entityId,
      type: field.eventType,
      payload: { [field.payloadKey]: numericValue },
      occurred_at: occurredAt,
    });
  }

  const note = values.note;
  if (note && note.trim() !== "") {
    rows.push({
      entity_id: entityId,
      type: "note",
      payload: { text: note.trim() },
      occurred_at: occurredAt,
    });
  }

  return rows;
}
