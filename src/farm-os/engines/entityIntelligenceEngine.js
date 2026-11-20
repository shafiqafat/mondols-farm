const EVENT_CAPABILITY_MAP = {
  // Current canonical event types.
  feed_given: "feed",
  weight_check: "weight",
  egg_count: "egg",
  mortality: "health",
  treatment: "health",
  health_note: "health",
  breeding: "breeding",
  harvest: "harvest",

  // Legacy event types.
  feed: "feed",
  Feed_given: "feed",
  weight: "weight",
  egg_production: "egg",
  Egg_count: "egg",
};

function getEventCapability(event) {
  const type = String(event?.type ?? "").trim();

  return (
    EVENT_CAPABILITY_MAP[type] ??
    EVENT_CAPABILITY_MAP[type.toLowerCase()] ??
    null
  );
}

function isEffectiveEvent(event) {
  return !event?.reversed_at;
}

const CAPABILITY_LABELS = {
  feed: "Feed",
  health: "Health",
  weight: "Weight",
  egg: "Egg production",
  breeding: "Breeding",
  milk: "Milk production",
  harvest: "Harvest",
};

const PURPOSE_KEYWORDS = [
  {
    capability: "breeding",
    keywords: ["breeding", "breed", "breeder", "reproduction"],
    label: "Breeding",
  },
  {
    capability: "egg",
    keywords: ["egg", "eggs", "laying", "layer"],
    label: "Egg production",
  },
  {
    capability: "milk",
    keywords: ["milk", "dairy", "milking"],
    label: "Milk production",
  },
  {
    capability: "harvest",
    keywords: ["harvest", "seed", "crop", "production"],
    label: "Harvest / production",
  },
  {
    capability: "weight",
    keywords: ["weight", "growth", "grow", "growth monitoring"],
    label: "Growth monitoring",
  },
  {
    capability: "feed",
    keywords: ["feed", "feeding", "fodder", "food"],
    label: "Feed management",
  },
];

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function detectPurposes(notes, capabilities) {
  const normalizedNotes = normalizeText(notes);

  if (!normalizedNotes) {
    return [];
  }

  return PURPOSE_KEYWORDS.filter((item) => {
    const capabilityEnabled = capabilities?.[item.capability] !== false;

    if (!capabilityEnabled) {
      return false;
    }

    return item.keywords.some((keyword) => normalizedNotes.includes(keyword));
  }).map((item) => item.label);
}

function buildActivitySummary(events) {
  return events.reduce((result, event) => {
    if (!isEffectiveEvent(event)) return result;

    const capability = getEventCapability(event);

    if (!capability) return result;

    result[capability] = (result[capability] || 0) + 1;

    return result;
  }, {});
}

// Parse PostgreSQL DATE values in local time.
function getEventDate(event) {
  const value = event?.occurred_at || event?.event_date || event?.created_at;

  if (!value) return null;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfLocalDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function buildTrendSummary(events, capabilities = {}) {
  const effectiveEvents = events.filter(isEffectiveEvent);

  if (!effectiveEvents.length) {
    return {
      recentEventCount: 0,
      previousEventCount: 0,
      trend: "no-data",
      daysSinceLastEvent: null,
      capabilityTrends: [],
    };
  }

  const today = startOfLocalDay(new Date());

  // Last 7 calendar days, including today.
  const recentStart = new Date(today);
  recentStart.setDate(recentStart.getDate() - 6);

  // The 7 calendar days immediately before that.
  const previousStart = new Date(today);
  previousStart.setDate(previousStart.getDate() - 13);

  const recentEvents = effectiveEvents.filter((event) => {
    const date = getEventDate(event);

    return date && date >= recentStart && date <= today;
  });

  const previousEvents = effectiveEvents.filter((event) => {
    const date = getEventDate(event);

    return date && date >= previousStart && date < recentStart;
  });

  const latestEvent = effectiveEvents
    .map(getEventDate)
    .filter((date) => date && date <= today)
    .sort((a, b) => b - a)[0];

  const daysSinceLastEvent = latestEvent
    ? Math.floor(
        (today.getTime() - startOfLocalDay(latestEvent).getTime()) / 86400000,
      )
    : null;

  let trend = "stable";

  if (recentEvents.length > previousEvents.length) {
    trend = "increasing";
  } else if (recentEvents.length < previousEvents.length) {
    trend = "decreasing";
  }

  const capabilityKeys = Object.entries(capabilities)
    .filter(([, enabled]) => enabled !== false)
    .map(([capability]) => capability);

  const capabilityTrends = capabilityKeys.map((capability) => {
    const recentCount = recentEvents.filter(
      (event) => getEventCapability(event) === capability,
    ).length;

    const previousCount = previousEvents.filter(
      (event) => getEventCapability(event) === capability,
    ).length;

    let capabilityTrend = "stable";

    if (recentCount > previousCount) {
      capabilityTrend = "increasing";
    } else if (recentCount < previousCount) {
      capabilityTrend = "decreasing";
    }

    return {
      capability,
      recentCount,
      previousCount,
      trend: capabilityTrend,
      inactive: recentCount === 0,
    };
  });

  return {
    recentEventCount: recentEvents.length,
    previousEventCount: previousEvents.length,
    trend,
    daysSinceLastEvent,
    capabilityTrends,
  };
}


function buildOperationalFocus({ activitySummary, detectedPurposes, species }) {
  const entries = Object.entries(activitySummary).sort(([, a], [, b]) => b - a);

  const classifiedCount = entries.reduce((sum, [, count]) => sum + count, 0);

  if (classifiedCount > 0) {
    const [capability, count] = entries[0];
    const share = Math.round((count / classifiedCount) * 100);

    const labels = {
      feed: "Feed management",
      weight: "Growth monitoring",
      health: "Health management",
      egg: "Egg production",
      breeding: "Breeding management",
      milk: "Milk production",
      harvest: "Harvest management",
    };

    const label = labels[capability] ?? capability;

    if (classifiedCount >= 3 && share >= 40) {
      return {
        title: label,
        description: `${label} represents ${share}% of classified activity records for this entity.`,
        evidence: `${count} of ${classifiedCount} classified activity records`,
        source: "activity",
        capability,
        count,
        classifiedCount,
        share,
      };
    }

    return {
      title: "Multiple active management areas",
      description: `${label} is currently the most frequently recorded activity, but no single area dominates.`,
      evidence: `${classifiedCount} classified activity records`,
      source: "activity",
      capability,
      count,
      classifiedCount,
      share,
    };
  }

  if (detectedPurposes.length > 0) {
    return {
      title: detectedPurposes[0],
      description:
        "This purpose was inferred from registration notes and configured capabilities. No classified activity records are available yet.",
      evidence: "Registration information",
      source: "registration",
      capability: null,
      count: 0,
      classifiedCount: 0,
      share: 0,
    };
  }

  return {
    title: "Not enough information yet",
    description: species?.name
      ? `${species.name} is registered, but its operational focus cannot yet be determined from the available information.`
      : "Add registration context or record activities to establish an operational focus.",
    evidence: "Insufficient context",
    source: "none",
    capability: null,
    count: 0,
    classifiedCount: 0,
    share: 0,
  };
}


function buildObservations({
  entity,
  events,
  activitySummary,
  detectedPurposes,
  trendSummary,
}) {
  const observations = [];

  if (detectedPurposes.length > 0) {
    observations.push(
      `The registration note indicates a focus on ${detectedPurposes.join(
        " and ",
      )}.`,
    );
  }

  if (events.length > 0) {
    observations.push(
      `${events.length} ${
        events.length === 1 ? "activity has" : "activities have"
      } been recorded for this entity.`,
    );

    const reversedCount = events.filter(
      (event) => !isEffectiveEvent(event),
    ).length;

    if (reversedCount > 0) {
      observations.push(
        `${reversedCount} reversed ${
          reversedCount === 1 ? "record is" : "records are"
        } excluded from current activity totals.`,
      );
    }
  } else {
    observations.push("No activity has been recorded for this entity yet.");
  }

  const activityEntries = Object.entries(activitySummary).sort(
    ([, a], [, b]) => b - a,
  );

  if (activityEntries.length > 0) {
    const [capability, count] = activityEntries[0];

    observations.push(
      `${count} ${
        count === 1 ? "record" : "records"
      } currently relate to ${capability}.`,
    );
  }

  if (entity.quantity != null) {
    observations.push(`The current recorded quantity is ${entity.quantity}.`);
  }

  const inactiveCapabilities =
    trendSummary?.capabilityTrends?.filter((item) => item.inactive) ?? [];

  inactiveCapabilities.forEach((item) => {
    const label = CAPABILITY_LABELS[item.capability] ?? item.capability;

    observations.push(
      `No ${label.toLowerCase()} activity has been recorded in the last 7 days.`,
    );
  });

  return observations;
}

export function buildEntityIntelligenceContext({ entity, events = [] }) {
  const capabilities = entity.species_config?.capabilities ?? {};

  const activitySummary = buildActivitySummary(events);

  const trendSummary = buildTrendSummary(events, capabilities);

  const detectedPurposes = detectPurposes(entity.notes, capabilities);
  const operationalFocus = buildOperationalFocus({
    activitySummary,
    detectedPurposes,
    species: entity.species_config,
  });

  const observations = buildObservations({
    entity,
    events,
    activitySummary,
    detectedPurposes,
    trendSummary,
  });

  return {
    entity: {
      id: entity.id,
      label: entity.label,
      quantity: entity.quantity,
      status: entity.status,
      location: entity.location,
      notes: entity.notes,
    },

    species: {
      id: entity.species_config?.id,
      name: entity.species_config?.name,
      category: entity.species_config?.category,
      capabilities,
    },

    activity: events.map((event) => ({
      type: event.type,
      capability: getEventCapability(event),
      date: getEventDate(event),
      payload: event.payload ?? {},
      isEffective: isEffectiveEvent(event),
    })),

    analysis: {
      detectedPurposes,
      activitySummary,
      trendSummary,
      observations,
      operationalFocus,
    },
  };
}
