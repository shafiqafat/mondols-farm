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

export function validateDailyLogInput({
  entityValues = {},
  entities = [],
  expense = null,
  content = null,
  feedItemSelection = {},
}) {
  const errors = [];

  for (const entity of entities) {
    const values = entityValues[entity.id] ?? {};
    const capabilities = entity.species_config?.capabilities ?? {};
    const fields = getQuickFieldsForCapabilities(capabilities);

    const feedValue = values.feed_kg;

    if (
      feedValue !== undefined &&
      feedValue !== null &&
      feedValue !== "" &&
      Number(feedValue) > 0 &&
      !feedItemSelection[entity.id]
    ) {
      errors.push(`Select a feed inventory item for ${entity.label}.`);
    }

    for (const field of fields) {
      const raw = values[field.key];

      if (raw === undefined || raw === null || raw === "") {
        continue;
      }

      const value = Number(raw);

      if (!Number.isFinite(value)) {
        errors.push(`${field.label} must be a valid number.`);
        continue;
      }

      if (field.eventType === "mortality") {
        if (!Number.isInteger(value) || value < 0) {
          errors.push("Mortality must be a whole number of 0 or greater.");
        }
        continue;
      }

      if (field.eventType === "weight_check" && value <= 0) {
        errors.push("Weight must be greater than 0.");
        continue;
      }

      if (field.eventType === "harvest" && value <= 0) {
        errors.push("Harvest quantity must be greater than 0.");
        continue;
      }

      if (value < 0) {
        errors.push(`${field.label} cannot be negative.`);
      }
    }
  }

  if (expense?.amount !== undefined && expense.amount !== "") {
    const amount = Number(expense.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push("Expense amount must be greater than 0.");
    }
  }

  if (content) {
    const photos = content.photos === "" ? 0 : Number(content.photos);

    const videos = content.videos === "" ? 0 : Number(content.videos);

    if (!Number.isInteger(photos) || photos < 0) {
      errors.push("Photo count must be a whole number of 0 or greater.");
    }

    if (!Number.isInteger(videos) || videos < 0) {
      errors.push("Video count must be a whole number of 0 or greater.");
    }
  }

  return errors;
}

export function validateDailyLog({
  entityRows = [],
  expense = null,
  content = null,
}) {
  const errors = [];

  for (const row of entityRows) {
    const payload = row.payload ?? {};

    if (row.type === "feed_given") {
      const value = Number(payload.qty_kg);

      if (!Number.isFinite(value) || value < 0) {
        errors.push("Feed must be 0 or greater.");
      }
    }

    if (row.type === "egg_count") {
      const value = Number(payload.count);

      if (!Number.isFinite(value) || value < 0) {
        errors.push("Egg count must be 0 or greater.");
      }
    }

    if (row.type === "weight_check") {
      const value = Number(payload.kg);

      if (!Number.isFinite(value) || value <= 0) {
        errors.push("Weight must be greater than 0.");
      }
    }

    if (row.type === "harvest") {
      const value = Number(payload.qty_kg);

      if (!Number.isFinite(value) || value <= 0) {
        errors.push("Harvest quantity must be greater than 0.");
      }
    }

    if (row.type === "mortality") {
      const value = Number(payload.count);

      if (!Number.isFinite(value) || value < 0) {
        errors.push("Mortality must be 0 or greater.");
      }
    }
  }

  if (expense) {
    const amount = Number(expense.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push("Expense amount must be greater than 0.");
    }
  }

  if (content) {
    const photos = Number(content.photos ?? 0);
    const videos = Number(content.videos ?? 0);

    if (!Number.isFinite(photos) || photos < 0) {
      errors.push("Photo count must be 0 or greater.");
    }

    if (!Number.isFinite(videos) || videos < 0) {
      errors.push("Video count must be 0 or greater.");
    }
  }

  return errors;
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
