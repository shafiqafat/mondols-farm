import {
  EVENT_CAPABILITY_MAP,
  EVENT_CATEGORY_MAP,
  EVENT_TYPE_OPTIONS,
  LEGACY_EVENT_LABELS,
} from "../config/eventDefinitions";

const EVENT_DISPLAY_LABELS = {
  ...Object.fromEntries(
    EVENT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
  ),
  ...LEGACY_EVENT_LABELS,
};

export function getEventCapability(eventType) {
  return EVENT_CAPABILITY_MAP[eventType] || null;
}

export function canEntityUseEvent(entity, speciesList, eventType) {
  const requiredCapability = getEventCapability(eventType);
  const allowedCategories = EVENT_CATEGORY_MAP[eventType];

  const species = speciesList.find(
    (item) => item.id === entity?.species_config?.id,
  );

  if (!species) {
    return false;
  }

  if (allowedCategories?.includes(species.category)) {
    return true;
  }

  if (!requiredCapability) {
    return true;
  }

  const capabilities = species.capabilities ?? {};

  return Object.prototype.hasOwnProperty.call(capabilities, requiredCapability);
}

export function getAvailableEventTypes(entity, speciesList) {
  if (!entity) {
    return EVENT_TYPE_OPTIONS;
  }

  const lifecycleRestrictedStatuses = new Set([
    "sold",
    "deceased",
    "harvested",
  ]);

  if (lifecycleRestrictedStatuses.has(entity.status)) {
    return EVENT_TYPE_OPTIONS.filter((option) => option.value === "other");
  }

  return EVENT_TYPE_OPTIONS.filter((option) =>
    canEntityUseEvent(entity, speciesList, option.value),
  );
}

export function getDefaultEventType(entity, speciesList) {
  const availableTypes = getAvailableEventTypes(entity, speciesList);

  return (
    availableTypes.find((option) => option.value !== "other")?.value || "other"
  );
}

export function getEventDisplayLabel(type) {
  return (
    EVENT_DISPLAY_LABELS[type] ||
    type?.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) ||
    "Event"
  );
}

export function formatEventDate(dateString) {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-").map(Number);

  if (!year || !month || !day) {
    return dateString;
  }

  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getEventSummary(event) {
  const payload = event?.payload ?? {};
  const type = event?.type;

  if (type === "status_changed") {
    const formatStatus = (value) =>
      value
        ? value
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
        : null;

    const from = formatStatus(payload.from);
    const to = formatStatus(payload.to);

    const transition =
      from && to
        ? `${from} → ${to}`
        : to
          ? `Changed to ${to}`
          : "Status changed";

    return payload.reason ? `${transition} · ${payload.reason}` : transition;
  }

  if (type === "feed") {
    const quantity = payload.quantity;
    const unit = payload.unit || "";
    const feedType = payload.feedType;

    if (quantity != null) {
      return [feedType, `${quantity} ${unit}`.trim()]
        .filter(Boolean)
        .join(" · ");
    }

    return feedType || "Feed recorded";
  }

  if (type === "Feed_given") {
    return payload.qty_kg != null ? `${payload.qty_kg} kg` : "Feed recorded";
  }

  if (type === "egg_production") {
    const parts = [];

    if (payload.eggs != null) {
      parts.push(`${payload.eggs} eggs`);
    }

    if (payload.broken != null) {
      parts.push(`${payload.broken} broken`);
    }

    if (payload.saleable != null) {
      parts.push(`${payload.saleable} saleable`);
    }

    return parts.join(" · ") || "Egg production recorded";
  }

  if (type === "Egg_count") {
    return payload.count != null
      ? `${payload.count} eggs`
      : "Egg production recorded";
  }

  if (type === "weight") {
    return payload.weightKg != null
      ? `${payload.weightKg} kg`
      : "Weight recorded";
  }

  if (type === "harvest") {
    return payload.quantity != null
      ? `${payload.quantity} ${payload.unit || ""}`.trim()
      : "Harvest recorded";
  }

  if (type === "treatment") {
    const parts = [];

    if (payload.medicine) {
      parts.push(payload.medicine);
    }

    if (payload.dose != null) {
      parts.push(`${payload.dose} ${payload.unit || ""}`.trim());
    }

    if (payload.reason) {
      parts.push(payload.reason);
    }

    return parts.join(" · ") || "Treatment recorded";
  }

  if (type === "mortality") {
    return payload.quantity != null
      ? `${payload.quantity} died`
      : "Mortality recorded";
  }

  if (type === "breeding") {
    return payload.quantity != null
      ? `${payload.quantity} recorded`
      : "Breeding event recorded";
  }

  if (type === "purchase" || type === "sale") {
    return payload.quantity != null
      ? `${payload.quantity} ${payload.unit || ""}`.trim()
      : `${type === "purchase" ? "Purchase" : "Sale"} recorded`;
  }
  if (type === "planting") {
    const parts = [];

    if (payload.variety) {
      parts.push(payload.variety);
    }

    if (payload.expectedDurationDays != null) {
      parts.push(`${payload.expectedDurationDays} days`);
    }

    return parts.join(" · ") || "Planting recorded";
  }

  if (
    type === "fertilizer_applied" ||
    type === "irrigation" ||
    type === "pest_observation" ||
    type === "growth_stage" ||
    type === "processing" ||
    type === "health_note"
  ) {
    return payload.notes || "Event recorded";
  }

  return payload.notes || "Event recorded";
}

export function validateEventPayload(type, payload, entity) {
  const value = payload ?? {};

  if (type === "weight") {
    const weight = Number(value.weightKg);

    if (!Number.isFinite(weight) || weight <= 0) {
      return "Weight must be greater than 0 kg.";
    }
  }

  if (type === "feed") {
    const quantity = Number(value.quantity);

    if (!value.feedType?.trim()) {
      return "Feed type is required.";
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return "Feed quantity must be greater than 0.";
    }

    if (!value.unit?.trim()) {
      return "Feed unit is required.";
    }
  }

  if (type === "egg_production") {
    const eggs = Number(value.eggs);
    const broken = Number(value.broken);
    const saleable = Number(value.saleable);

    if (!Number.isInteger(eggs) || eggs < 0) {
      return "Eggs produced must be a whole number of 0 or more.";
    }

    if (!Number.isInteger(broken) || broken < 0) {
      return "Broken eggs must be a whole number of 0 or more.";
    }

    if (!Number.isInteger(saleable) || saleable < 0) {
      return "Saleable eggs must be a whole number of 0 or more.";
    }

    if (broken > eggs) {
      return "Broken eggs cannot exceed eggs produced.";
    }

    if (saleable > eggs) {
      return "Saleable eggs cannot exceed eggs produced.";
    }

    if (broken + saleable > eggs) {
      return "Broken and saleable eggs cannot exceed eggs produced.";
    }
  }

  if (type === "harvest") {
    const quantity = Number(value.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return "Harvest quantity must be greater than 0.";
    }

    if (!value.unit?.trim()) {
      return "Harvest unit is required.";
    }
  }

  if (type === "treatment") {
    const dose = Number(value.dose);

    if (!value.medicine?.trim()) {
      return "Medicine / treatment is required.";
    }

    if (!Number.isFinite(dose) || dose <= 0) {
      return "Treatment dose must be greater than 0.";
    }

    if (!value.unit?.trim()) {
      return "Dose unit is required.";
    }
  }

  if (type === "mortality") {
    const quantity = Number(value.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return "Mortality quantity must be at least 1.";
    }

    if (entity?.quantity != null && quantity > Number(entity.quantity)) {
      return "Mortality quantity cannot exceed the current entity quantity.";
    }
  }

  if (type === "breeding") {
    const quantity = Number(value.quantity);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return "Breeding quantity must be at least 1.";
    }
  }

  if (type === "purchase" || type === "sale") {
    const quantity = Number(value.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return `${
        type === "purchase" ? "Purchase" : "Sale"
      } quantity must be greater than 0.`;
    }

    if (!value.unit?.trim()) {
      return "Unit is required.";
    }
  }

  return "";
}
