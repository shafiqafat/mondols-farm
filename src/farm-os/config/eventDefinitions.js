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
        label: "Quantity",
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
      },
      {
        key: "unit",
        label: "Unit",
        type: "text",
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
      },
      {
        key: "unit",
        label: "Unit",
        type: "text",
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

export const LEGACY_EVENT_LABELS = {
  weight: "Weight",
  feed: "Feed",
  egg_production: "Egg production",
  Feed_given: "Feed given",
  Egg_count: "Egg production",
};
