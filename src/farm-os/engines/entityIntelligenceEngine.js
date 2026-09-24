const EVENT_CAPABILITY_MAP = {
  feed: "feed",
  Feed_given: "feed",
  weight: "weight",
  egg_production: "egg",
  Egg_count: "egg",
  mortality: "health",
  treatment: "health",
  health_note: "health",
  breeding: "breeding",
  harvest: "harvest",
};

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
  const counts = events.reduce((result, event) => {
    const capability = EVENT_CAPABILITY_MAP[event.type];

    if (!capability) {
      return result;
    }

    result[capability] = (result[capability] || 0) + 1;

    return result;
  }, {});

  return counts;
}
function getEventDate(event) {
  const value = event.occurred_at || event.event_date || event.created_at;

  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function buildTrendSummary(events, capabilities = {}) {
  if (!events.length) {
    return {
      recentEventCount: 0,
      previousEventCount: 0,
      trend: "no-data",
      daysSinceLastEvent: null,
      capabilityTrends: [],
    };
  }

  const now = new Date();

  const recentStart = new Date(now);
  recentStart.setDate(recentStart.getDate() - 7);

  const previousStart = new Date(now);
  previousStart.setDate(previousStart.getDate() - 14);

  const recentEvents = events.filter((event) => {
    const date = getEventDate(event);
    return date && date >= recentStart;
  });

  const previousEvents = events.filter((event) => {
    const date = getEventDate(event);
    return date && date >= previousStart && date < recentStart;
  });

  const latestEvent = [...events]
    .map(getEventDate)
    .filter((date) => date)
    .sort((a, b) => b - a)[0];

  const daysSinceLastEvent = latestEvent
    ? Math.floor(
        (now.getTime() - latestEvent.getTime()) / (1000 * 60 * 60 * 24),
      )
    : null;

  let trend = "stable";

  if (recentEvents.length > previousEvents.length) {
    trend = "increasing";
  } else if (recentEvents.length < previousEvents.length) {
    trend = "decreasing";
  }

  const capabilityKeys = Object.entries(capabilities)
    .filter(([, enabled]) => enabled)
    .map(([capability]) => capability);

  const capabilityTrends = capabilityKeys.map((capability) => {
    const recentCount = recentEvents.filter(
      (event) => EVENT_CAPABILITY_MAP[event.type] === capability,
    ).length;

    const previousCount = previousEvents.filter(
      (event) => EVENT_CAPABILITY_MAP[event.type] === capability,
    ).length;
    const inactive = recentCount === 0;

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
      inactive,
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
      capability: EVENT_CAPABILITY_MAP[event.type] ?? null,
      date: getEventDate(event),
      payload: event.payload ?? {},
    })),

    analysis: {
      detectedPurposes,
      activitySummary,
      trendSummary,
      observations,
    },
  };
}
