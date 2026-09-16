export const EVENT_TYPE_OPTIONS = [
  { value: "weight", label: "Weight" },
  { value: "feed", label: "Feed" },
  { value: "egg_production", label: "Egg production" },
  { value: "harvest", label: "Harvest" },
  { value: "treatment", label: "Treatment" },
  { value: "mortality", label: "Mortality" },
  { value: "breeding", label: "Breeding" },
  { value: "purchase", label: "Purchase" },
  { value: "sale", label: "Sale" },
  { value: "other", label: "Other" },
];

export const EVENT_SCHEMAS = {
  weight: {
    fields: [
      {
        key: "weightKg",
        label: "Weight",
        type: "number",
        unit: "kg",
        min: 0,
        step: "0.01",
      },
    ],
  },

  feed: {
    fields: [
      {
        key: "feedType",
        label: "Feed type",
        type: "text",
      },
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
        placeholder: "kg",
      },
    ],
  },

  egg_production: {
    fields: [
      {
        key: "eggs",
        label: "Eggs produced",
        type: "number",
        min: 0,
        step: "1",
      },
      {
        key: "broken",
        label: "Broken",
        type: "number",
        min: 0,
        step: "1",
      },
      {
        key: "saleable",
        label: "Saleable",
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

  other: {
    fields: [],
  },
};

export const EVENT_CAPABILITY_MAP = {
  weight: "weight",
  feed: "feed",
  egg_production: "egg",
  breeding: "breeding",
  treatment: "health",
  harvest: "harvest",
};

export const LEGACY_EVENT_LABELS = {
  Feed_given: "Feed given",
  Egg_count: "Egg production",
};
