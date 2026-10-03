export const EVENT_TYPE_OPTIONS = [
  { value: "weight_check", label: "Weight" },
  { value: "feed_given", label: "Feed" },
  { value: "egg_count", label: "Egg production" },
  { value: "harvest", label: "Harvest" },
  { value: "treatment", label: "Treatment" },
  { value: "mortality", label: "Mortality" },
  { value: "breeding", label: "Breeding" },
  { value: "purchase", label: "Purchase" },
  { value: "sale", label: "Sale" },

  { value: "planting", label: "Planting" },
  { value: "fertilizer_applied", label: "Fertilizer applied" },
  { value: "irrigation", label: "Irrigation" },
  { value: "pest_observation", label: "Pest / disease observation" },
  { value: "growth_stage", label: "Growth stage update" },
  { value: "processing", label: "Processing" },

  { value: "health_note", label: "Health observation" },
  { value: "other", label: "Other" },
];

export const EVENT_SCHEMAS = {
  weight_check: {
    fields: [
      {
        key: "kg",
        label: "Weight",
        type: "number",
        unit: "kg",
        min: 0,
        step: "0.01",
        validation: {
          minExclusive: true,
        },
      },
    ],
  },

  feed_given: {
    fields: [
      {
        key: "qty_kg",
        label: "Feed quantity",
        type: "number",
        unit: "kg",
        min: 0,
        step: "0.01",
        validation: {
          minExclusive: true,
        },
      },
    ],
  },

  egg_count: {
    fields: [
      {
        key: "count",
        label: "Eggs produced",
        type: "number",
        min: 0,
        step: "1",
      },
    ],
  },

  harvest: {
    fields: [
      {
        key: "quantity",
        label: "Harvest quantity",
        type: "number",
        min: 0,
        step: "0.01",
        validation: {
          minExclusive: true,
        },
      },
      {
        key: "unit",
        label: "Unit",
        type: "text",
        placeholder: "kg",
      },
      {
        key: "quality",
        label: "Quality",
        type: "text",
      },
    ],
  },

  treatment: {
    fields: [
      {
        key: "medicine",
        label: "Medicine / treatment",
        type: "text",
      },
      {
        key: "dose",
        label: "Dose",
        type: "number",
        min: 0,
        step: "0.01",
        validation: {
          minExclusive: true,
          optional: true,
        },
      },
      {
        key: "unit",
        label: "Dose unit",
        type: "text",
        placeholder: "ml",
      },
      {
        key: "reason",
        label: "Reason",
        type: "text",
      },
    ],
  },

  mortality: {
    fields: [
      {
        key: "quantity",
        label: "Quantity",
        type: "number",
        min: 1,
        step: "1",
        trackingModes: ["group"],
      },
      {
        key: "reason",
        label: "Reason",
        type: "text",
      },
    ],
  },

  breeding: {
    fields: [
      {
        key: "quantity",
        label: "Breeding count",
        type: "number",
        min: 1,
        step: "1",
      },
      {
        key: "notes",
        label: "Breeding notes",
        type: "text",
      },
    ],
  },

  purchase: {
    fields: [
      {
        key: "quantity",
        label: "Quantity",
        type: "number",
        min: 0,
        step: "0.01",
        trackingModes: ["group"],
      },
      {
        key: "unit",
        label: "Unit",
        type: "text",
        trackingModes: ["group"],
      },
    ],
  },

  sale: {
    fields: [
      {
        key: "quantity",
        label: "Quantity",
        type: "number",
        min: 0,
        step: "0.01",
        trackingModes: ["group"],
      },
      {
        key: "unit",
        label: "Unit",
        type: "text",
        trackingModes: ["group"],
      },
    ],
  },
  planting: {
    fields: [
      {
        key: "variety",
        label: "Variety",
        type: "text",
      },
      {
        key: "expectedDurationDays",
        label: "Expected duration (days)",
        type: "number",
        min: 1,
        step: "1",
      },
    ],
  },

  fertilizer_applied: {
    fields: [
      {
        key: "amount",
        label: "Amount",
        type: "number",
        min: 0,
        step: "0.01",
        validation: {
          minExclusive: true,
          optional: true,
        },
      },
      {
        key: "unit",
        label: "Unit",
        type: "text",
        placeholder: "kg",
      },
    ],
  },

  irrigation: {
    fields: [
      {
        key: "notes",
        label: "Details",
        type: "text",
      },
    ],
  },

  pest_observation: {
    fields: [
      {
        key: "notes",
        label: "Observation",
        type: "text",
      },
    ],
  },

  growth_stage: {
    fields: [
      {
        key: "notes",
        label: "Growth stage",
        type: "text",
      },
    ],
  },

  processing: {
    fields: [
      {
        key: "notes",
        label: "Processing details",
        type: "text",
      },
    ],
  },

  health_note: {
    fields: [
      {
        key: "notes",
        label: "Health observation",
        type: "text",
      },
    ],
  },

  other: {
    fields: [],
  },
};
export const EVENT_CAPABILITY_MAP = {
  weight_check: "weight",
  feed_given: "feed",
  egg_count: "egg",
  breeding: "breeding",
  treatment: "health",
  health_note: "health",
  harvest: "harvest",

  // Legacy event types kept readable for historical records.
  weight: "weight",
  feed: "feed",
  egg_production: "egg",
};

export const EVENT_CATEGORY_MAP = {
  planting: ["crop", "fodder"],
  fertilizer_applied: ["crop", "fodder"],
  irrigation: ["crop", "fodder"],
  pest_observation: ["crop", "fodder"],
  growth_stage: ["crop", "fodder"],
  processing: ["crop", "fodder"],
};
export const EVENT_TRACKING_MODE_MAP = {
  weight_check: ["individual", "group"],
  feed_given: ["individual", "group"],
  egg_count: ["individual", "group"],
  harvest: ["group", "area"],
  treatment: ["individual", "group"],
  mortality: ["individual", "group"],
  breeding: ["individual", "group"],
  purchase: ["individual", "group"],
  sale: ["individual", "group"],
  planting: ["area"],
  fertilizer_applied: ["area"],
  irrigation: ["area"],
  pest_observation: ["area"],
  growth_stage: ["area"],
  processing: ["group", "area"],
  health_note: ["individual", "group", "area"],
  other: ["individual", "group", "area"],
};
export const EVENT_SEMANTICS = {
  purchase: {
    quantityMovement: true,
    reversible: true,
  },

  sale: {
    quantityMovement: true,
    statusTransition: true,
    terminalForIndividual: true,
    reversible: true,
  },

  mortality: {
    quantityMovement: true,
    statusTransition: true,
    terminalForIndividual: true,
    reversible: true,
  },

  breeding: {
    activity: true,
  },

  weight_check: {
    activity: true,
  },

  feed_given: {
    activity: true,
  },

  egg_count: {
    activity: true,
  },

  treatment: {
    activity: true,
  },

  harvest: {
    activity: true,
  },

  planting: {
    activity: true,
  },

  fertilizer_applied: {
    activity: true,
  },

  irrigation: {
    activity: true,
  },

  pest_observation: {
    activity: true,
  },

  growth_stage: {
    activity: true,
  },

  processing: {
    activity: true,
  },

  health_note: {
    activity: true,
  },

  other: {
    activity: true,
  },
};

export const EVENT_SEMANTIC_LABELS = {
  terminal: "Terminal lifecycle event",
  statusChanged: "Status change",
  quantityChanged: "Quantity movement",
};

export const LEGACY_EVENT_LABELS = {
  weight: "Weight",
  feed: "Feed",
  egg_production: "Egg production",
  Feed_given: "Feed given",
  Egg_count: "Egg production",
};
export const EVENT_DISPLAY_LABELS = {
  weight_check: "Weight Check",
  feed_given: "Feed Given",
  egg_count: "Egg Count",
  breeding: "Breeding",
  treatment: "Treatment",
  health_note: "Health Note",

  purchase: "Purchase",
  sale: "Sale",
  mortality: "Mortality",

  harvest: "Harvest",
  planting: "Planting",
  fertilizer_applied: "Fertilizer Applied",
  irrigation: "Irrigation",
  pest_observation: "Pest Observation",
  growth_stage: "Growth Stage",
  processing: "Processing",

  status_changed: "Status Changed",
  other: "Other",
};

export const ENTITY_STATUS_LABELS = {
  active: "Active",
  sold: "Sold",
  deceased: "Deceased",
  harvested: "Harvested",
};

export const LIFECYCLE_RESTRICTED_STATUSES = ["sold", "deceased", "harvested"];

export function validateEventPayload(eventType, payload) {
  const schema = EVENT_SCHEMAS[eventType];

  if (!schema) {
    return {
      valid: false,
      message: `Unsupported event type: ${eventType}`,
    };
  }

  for (const field of schema.fields || []) {
    const value = payload?.[field.key];
    const validation = field.validation;

    if (!validation) {
      continue;
    }

    const isEmpty = value === undefined || value === null || value === "";

    if (isEmpty) {
      if (validation.optional) {
        continue;
      }

      if (validation.required) {
        return {
          valid: false,
          message: `${field.label} is required.`,
        };
      }

      continue;
    }

    if (validation.minExclusive) {
      const numericValue = Number(value);

      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return {
          valid: false,
          message: `${field.label} must be greater than 0.`,
        };
      }
    }

    if (validation.min !== undefined) {
      const numericValue = Number(value);

      if (!Number.isFinite(numericValue) || numericValue < validation.min) {
        return {
          valid: false,
          message: `${field.label} must be at least ${validation.min}.`,
        };
      }
    }
  }

  return {
    valid: true,
    message: "",
  };
}