import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  BadgeDollarSign,
  CircleDot,
  CalendarDays,
  ClipboardPlus,
  Dna,
  Droplets,
  Egg,
  HeartPulse,
  Leaf,
  Pill,
  Scale,
  ShoppingCart,
  Sprout,
  Wheat,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { computeExpectedHarvest } from "../engines/cropForecastEngine";

import { EVENT_SCHEMAS } from "../config/eventDefinitions";

import {
  formatEventDate,
  getAvailableEventTypes,
  getEventDisplayLabel,
  getEventImpact,
  getEventSemantics,
  getEventStatusImpact,
  getEventSummary,
  validateEventPayload,
} from "../lib/eventUtils";
import { recommendationsFor } from "../engines/cropRotationEngine";
import { localDateISO } from "../lib/localDate";
import { useAuth } from "../hooks/useAuth";
import { canWrite } from "../lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import EntityIntelligence from "../components/entity/EntityIntelligence";

const todayISO = localDateISO;
function calculateCurrentAge(
  birthDate,
  ageAtAcquisitionDays = null,
  acquiredAt = null,
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Preferred source: known birth date
  if (birthDate) {
    const birth = new Date(`${birthDate}T00:00:00`);

    if (!Number.isNaN(birth.getTime()) && birth <= today) {
      return Math.floor(
        (today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24),
      );
    }
  }

  // Fallback: age at acquisition + time since acquisition
  if (
    ageAtAcquisitionDays !== null &&
    Number.isFinite(Number(ageAtAcquisitionDays)) &&
    Number(ageAtAcquisitionDays) >= 0 &&
    acquiredAt
  ) {
    const acquiredDate = new Date(`${acquiredAt}T00:00:00`);

    if (!Number.isNaN(acquiredDate.getTime()) && acquiredDate <= today) {
      const daysSinceAcquisition = Math.floor(
        (today.getTime() - acquiredDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      return Number(ageAtAcquisitionDays) + daysSinceAcquisition;
    }
  }

  return null;
}

function formatAge(ageInDays) {
  if (ageInDays === null || ageInDays === undefined) {
    return "Unknown";
  }

  if (ageInDays < 30) {
    return `${ageInDays} day${ageInDays === 1 ? "" : "s"}`;
  }

  if (ageInDays < 365) {
    const months = Math.floor(ageInDays / 30.4375);
    const days = Math.round(ageInDays % 30.4375);

    if (days === 0) {
      return `${months} month${months === 1 ? "" : "s"}`;
    }

    return `${months} month${months === 1 ? "" : "s"} ${days} day${days === 1 ? "" : "s"}`;
  }

  const years = Math.floor(ageInDays / 365.25);
  const remainingDays = Math.round(ageInDays % 365.25);
  const months = Math.floor(remainingDays / 30.4375);

  if (months === 0) {
    return `${years} year${years === 1 ? "" : "s"}`;
  }

  return `${years} year${years === 1 ? "" : "s"} ${months} month${months === 1 ? "" : "s"}`;
}
function formatLifecycleDate(dateValue) {
  if (!dateValue) {
    return "Unknown";
  }

  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getBirthDateDisplay(lifecycle) {
  if (!lifecycle?.birth_date) {
    return "Unknown";
  }

  return formatLifecycleDate(lifecycle.birth_date);
}

function getParentDisplay(parent) {
  if (!parent) {
    return {
      title: "Not recorded",
      description: "No parent information was recorded.",
    };
  }

  switch (parent.parent_type) {
    case "farm_entity":
      return {
        title: parent.parent_entity?.label || "Farm entity",
        description: parent.parent_entity?.species_config?.name
          ? `Farm entity · ${parent.parent_entity.species_config.name}`
          : "Farm entity",
      };

    case "external":
      return {
        title: parent.external_reference || "External parent",
        description: "External parent reference",
      };

    case "unknown":
      return {
        title: "Unknown",
        description: "The parent is unknown.",
      };

    case "not_recorded":
      return {
        title: "Not recorded",
        description: "Parent information was not recorded.",
      };

    default:
      return {
        title: "Unknown",
        description: "Parent information is unavailable.",
      };
  }
}

function eventIcon(type) {
  switch (type) {
    case "feed_given":
    case "feed":
    case "Feed_given":
      return Wheat;

    case "weight_check":
    case "weight":
      return Scale;

    case "egg_count":
    case "egg_production":
    case "Egg_count":
      return Egg;

    case "mortality":
      return HeartPulse;

    case "treatment":
    case "health_note":
      return Pill;

    case "breeding":
      return Dna;

    case "harvest":
      return Wheat;

    case "planting":
      return Sprout;

    case "fertilizer_applied":
      return Leaf;

    case "irrigation":
      return Droplets;

    case "purchase":
      return ShoppingCart;

    case "sale":
      return BadgeDollarSign;

    case "status_changed":
      return CircleDot;

    default:
      return Activity;
  }
}

function buildPayloadFromSchema(type, values) {
  const schema = EVENT_SCHEMAS[type];

  if (!schema) {
    return {};
  }

  const payload = {};

  for (const field of schema.fields) {
    const raw = values[field.key];

    if (raw === undefined || raw === null || raw === "") {
      continue;
    }

    if (field.type === "number") {
      const numericValue = Number(raw);

      if (Number.isFinite(numericValue)) {
        payload[field.key] = numericValue;
      }

      continue;
    }

    payload[field.key] = raw;
  }
  return payload;
}

function validateEventDate(eventDate, entity, lifecycle) {
  if (!eventDate) {
    return "Event date is required.";
  }

  const selectedDate = new Date(`${eventDate}T00:00:00`);

  if (Number.isNaN(selectedDate.getTime())) {
    return "Event date is invalid.";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate > today) {
    return "Event date cannot be in the future.";
  }

  if (entity?.tracking_mode === "individual") {
    if (lifecycle?.birth_date) {
      const birthDate = new Date(`${lifecycle.birth_date}T00:00:00`);

      if (!Number.isNaN(birthDate.getTime()) && selectedDate < birthDate) {
        return "Event date cannot be before the entity's birth date.";
      }
    }

    if (entity?.acquired_at) {
      const acquiredDate = new Date(`${entity.acquired_at}T00:00:00`);

      if (
        !Number.isNaN(acquiredDate.getTime()) &&
        selectedDate < acquiredDate
      ) {
        return "Event date cannot be before the entity's acquisition date.";
      }
    }
  }

  return "";
}

function EntityDetail() {
  const { id } = useParams();
  const { role } = useAuth();
  const canEdit = canWrite(role);
  const [entity, setEntity] = useState(null);
  const [events, setEvents] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [rotationRules, setRotationRules] = useState([]);
  const [lifecycle, setLifecycle] = useState(null);
  const [parentage, setParentage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pageError, setPageError] = useState("");

  const [form, setForm] = useState({
    type: "",
    date: todayISO(),
    values: {},
  });
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    setLoading(true);
    setLoadError("");

    const [entityRes, eventsRes, speciesRes, lifecycleRes, parentageRes] =
      await Promise.all([
        supabase
          .from("farm_entities")
          .select(
            "*, species_config:species_config_id(id, name, category, capabilities)",
          )
          .eq("id", id)
          .single(),
        supabase
          .from("entity_events")
          .select("*")
          .eq("entity_id", id)
          .order("occurred_at", { ascending: false })
          .order("created_at", { ascending: false }),

        supabase
          .from("species_config")
          .select("id, name, category, capabilities")
          .order("name"),

        supabase
          .from("entity_lifecycle")
          .select("*")
          .eq("entity_id", id)
          .maybeSingle(),

        supabase
          .from("entity_parentage")
          .select(
            `*, parent_entity:parent_entity_id ( id, label, species_config:species_config_id (name))`,
          )
          .eq("child_entity_id", id)
          .order("parent_role"),
      ]);

    if (entityRes.error) {
      setLoadError(entityRes.error.message);
      setLoading(false);
      return;
    }

    if (
      eventsRes.error ||
      speciesRes.error ||
      lifecycleRes.error ||
      parentageRes.error
    ) {
      setLoadError(
        eventsRes.error?.message ||
          speciesRes.error?.message ||
          lifecycleRes.error?.message ||
          parentageRes.error?.message ||
          "Unable to load entity details.",
      );
      setLoading(false);
      return;
    }

    setEntity(entityRes.data);
    setEvents(eventsRes.data ?? []);
    setSpeciesList(speciesRes.data ?? []);
    setLifecycle(lifecycleRes.data ?? null);
    setParentage(parentageRes.data ?? []);

    const speciesId = entityRes.data?.species_config_id;
    if (speciesId) {
      const { data: rules } = await supabase
        .from("crop_rotation_rules")
        .select("*, to_species:to_species_id(name)")
        .eq("from_species_id", speciesId);
      setRotationRules(rules ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
    // loadAll intentionally re-runs only when the route's :id changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleAddEvent(e) {
    e.preventDefault();
    const typeDef = EVENT_SCHEMAS[form.type];

    if (!typeDef) {
      return;
    }

    setSaving(true);
    setPageError("");

    const validationError = validateEventPayload(
      form.type,
      form.values,
      entity,
    );

    if (validationError) {
      setSaving(false);
      setPageError(validationError);
      return;
    }

    const dateError = validateEventDate(form.date, entity, lifecycle);

    if (dateError) {
      setSaving(false);
      setPageError(dateError);
      return;
    }

    const payload = buildPayloadFromSchema(form.type, form.values);

    const { data, error } = await supabase.rpc("record_entity_event", {
      p_entity_id: id,
      p_event_type: form.type,
      p_payload: payload,
      p_occurred_at: form.date,
    });

    setSaving(false);

    if (error) {
      setPageError(error.message);
      return;
    }

    if (!data?.event_id) {
      setPageError("Event could not be recorded.");
      return;
    }

    setForm({
      type: "",
      date: todayISO(),
      values: {},
    });

    loadAll();
  }

  if (loading) {
    return (
      <Card className="border-border/70 bg-card shadow-sm">
        <CardContent className="flex min-h-32 items-center justify-center p-5">
          <p className="text-sm text-muted-foreground">Loading entity…</p>
        </CardContent>
      </Card>
    );
  }
  if (loadError) {
    return (
      <Card className="border-destructive/30 bg-card shadow-sm">
        <CardContent className="p-5">
          <p className="text-sm text-destructive">{loadError}</p>
        </CardContent>
      </Card>
    );
  }
  if (!entity) {
    return (
      <Card className="border-border/70 bg-card shadow-sm">
        <CardContent className="space-y-2 p-5">
          <h2 className="text-base font-semibold">Entity not found</h2>
          <p className="text-sm text-muted-foreground">
            This farm entity may have been removed or the link may be invalid.
          </p>

          <Link
            to="/farm-os/species"
            className="inline-flex text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            ← Back to Species & Entities
          </Link>
        </CardContent>
      </Card>
    );
  }

  const category = entity.species_config?.category;
  const currentAgeInDays =
    entity.tracking_mode === "individual"
      ? calculateCurrentAge(
          lifecycle?.birth_date,
          lifecycle?.age_at_acquisition_days,
          entity.acquired_at,
        )
      : null;

  const currentAge = formatAge(currentAgeInDays);

  const mother = parentage.find((parent) => parent.parent_role === "mother");

  const father = parentage.find((parent) => parent.parent_role === "father");

  const motherDisplay = getParentDisplay(mother);
  const fatherDisplay = getParentDisplay(father);

  const availableTypes = getAvailableEventTypes(entity, speciesList);
  const isClosedEntity = ["sold", "deceased", "harvested"].includes(
    entity.status,
  );

  const selectedTypeDef = EVENT_SCHEMAS[form.type];
  const harvestOutlook =
    category === "crop" || category === "fodder"
      ? computeExpectedHarvest(events)
      : null;
  const rotationSuggestions =
    category === "crop" || category === "fodder"
      ? recommendationsFor(rotationRules, entity.species_config_id)
      : [];

  return (
    <div className="space-y-6">
      <Link
        to="/farm-os/species"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Species & Entities
      </Link>

      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sprout className="size-5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-[-0.03em]">
                  {entity.label}
                </h1>

                <Badge variant="secondary" className="capitalize">
                  {entity.status}
                </Badge>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{entity.species_config?.name}</span>
                <span>·</span>
                <span className="capitalize">{category}</span>

                {entity.quantity != null && (
                  <>
                    <span>·</span>
                    <span>{entity.quantity} currently</span>
                  </>
                )}

                {entity.location && (
                  <>
                    <span>·</span>
                    <span>{entity.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                  isClosedEntity
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-primary/10 text-primary"
                }`}
              >
                <Activity className="size-4" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Lifecycle status
                </p>

                <p className="mt-0.5 text-sm font-semibold capitalize">
                  {entity.status}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground sm:max-w-md sm:text-right">
              {isClosedEntity
                ? `This entity is ${entity.status}. Operational events can no longer be recorded.`
                : "This entity is currently active and operational events can be recorded."}
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="border-border/70 bg-card shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sprout className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Quantity
                </p>
                <p className="mt-0.5 text-lg font-semibold">
                  {entity.quantity ?? "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <CalendarDays className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Last activity
                </p>
                <p className="mt-0.5 text-sm font-semibold">
                  {events[0]?.occurred_at
                    ? formatEventDate(events[0].occurred_at)
                    : "No activity"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Activity className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Events
                </p>
                <p className="mt-0.5 text-lg font-semibold">{events.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {entity.tracking_mode === "individual" && (
        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="p-5">
            <div className="mb-4">
              <h2 className="text-base font-semibold">Lifecycle</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Birth, acquisition, and current age information for this
                individual.
              </p>
            </div>

            {!lifecycle ? (
              <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-4">
                <p className="text-sm font-medium">
                  Lifecycle information is not recorded.
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Birth date, origin, and age information are unavailable for
                  this individual.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Tracking mode
                  </p>

                  <p className="mt-1 text-sm font-semibold capitalize">
                    {entity.tracking_mode}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Origin
                  </p>

                  <p className="mt-1 text-sm font-semibold capitalize">
                    {lifecycle.origin_type.replaceAll("_", " ")}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Current age
                  </p>

                  <p className="mt-1 text-sm font-semibold">{currentAge}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Birth date
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {getBirthDateDisplay(lifecycle)}
                  </p>

                  {lifecycle.birth_date_precision === "estimated" && (
                    <p className="mt-1 text-xs text-amber-600">
                      Estimated from age at acquisition.
                    </p>
                  )}

                  {lifecycle.birth_date_precision === "approximate" && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Approximate date.
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Birth date precision
                  </p>

                  <p className="mt-1 text-sm font-semibold capitalize">
                    {lifecycle.birth_date_precision?.replaceAll("_", " ") ||
                      "Unknown"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Acquired
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {entity.acquired_at
                      ? formatLifecycleDate(entity.acquired_at)
                      : "Not recorded"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {entity.tracking_mode === "individual" &&
        lifecycle?.origin_type === "born_on_farm" && (
          <Card className="border-border/70 bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="mb-4">
                <h2 className="text-base font-semibold">Parentage</h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Recorded parent information for this farm-born individual.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Mother */}
                <div className="rounded-lg border border-border/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Mother
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {motherDisplay.title}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {motherDisplay.description}
                  </p>

                  {mother?.parent_type === "farm_entity" &&
                    mother.parent_entity?.id && (
                      <Link
                        to={`/farm-os/entities/${mother.parent_entity.id}`}
                        className="mt-3 inline-flex text-xs font-medium text-primary transition-colors hover:text-primary/80"
                      >
                        View mother →
                      </Link>
                    )}
                </div>

                {/* Father */}
                <div className="rounded-lg border border-border/60 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Father
                  </p>

                  <p className="mt-1 text-sm font-semibold">
                    {fatherDisplay.title}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {fatherDisplay.description}
                  </p>

                  {father?.parent_type === "farm_entity" &&
                    father.parent_entity?.id && (
                      <Link
                        to={`/farm-os/entities/${father.parent_entity.id}`}
                        className="mt-3 inline-flex text-xs font-medium text-primary transition-colors hover:text-primary/80"
                      >
                        View father →
                      </Link>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      <EntityIntelligence entity={entity} events={events} />

      {harvestOutlook && (
        <Card className="border-border/70 bg-secondary/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Planted {harvestOutlook.plantedAt}
              {harvestOutlook.variety ? ` (${harvestOutlook.variety})` : ""} —
              expected harvest around{" "}
              <strong className="font-semibold text-foreground">
                {harvestOutlook.expectedHarvestDate}
              </strong>
            </p>
          </CardContent>
        </Card>
      )}

      {rotationSuggestions.length > 0 && (
        <Card className="border-border/70 border-l-4 border-l-accent bg-card shadow-sm">
          <CardContent className="space-y-3 p-4">
            <div>
              <h2 className="text-base font-semibold">Suggested next crop</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Based on the current crop rotation rules for this plot.
              </p>
            </div>

            <ul className="space-y-2 pl-5 text-sm text-muted-foreground">
              {rotationSuggestions.map((r) => (
                <li key={r.id}>
                  <strong className="font-semibold text-foreground">
                    {r.to_species?.name}
                  </strong>{" "}
                  — {r.reason}
                </li>
              ))}
            </ul>

            <Link
              to="/farm-os/species"
              className="inline-flex text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              Register it once this plot is free →
            </Link>
          </CardContent>
        </Card>
      )}

      {pageError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{pageError}</p>
        </div>
      )}

      {canEdit && (
        <section className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardPlus className="size-4" />
            </div>

            <div>
              <h2 className="text-base font-semibold">Log an event</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Record an event for this farm entity.
              </p>
            </div>
          </div>

          {isClosedEntity && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
              This entity is {entity.status}. Operational events can no longer
              be recorded.
            </div>
          )}

          <form
            onSubmit={handleAddEvent}
            className={`rounded-xl border border-border/70 bg-card p-5 shadow-sm ${
              isClosedEntity ? "opacity-70" : ""
            }`}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="entity-event-type"
                  className="text-sm font-medium"
                >
                  Event type
                </label>

                <select
                  id="entity-event-type"
                  disabled={isClosedEntity}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                  value={form.type}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      type: e.target.value,
                      values: {},
                    }))
                  }
                  required
                >
                  <option value="">Select an event…</option>

                  {availableTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="entity-event-date"
                  className="text-sm font-medium"
                >
                  Date
                </label>

                <Input
                  id="entity-event-date"
                  type="date"
                  disabled={isClosedEntity}
                  value={form.date}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      date: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {selectedTypeDef && (
              <div className="mt-5 border-t border-border/60 pt-5">
                <div className="mb-4">
                  <p className="text-sm font-medium">Event details</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Add the information available for this event.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {selectedTypeDef.fields
                    .filter(
                      (field) =>
                        !field.trackingModes ||
                        field.trackingModes.includes(entity.tracking_mode),
                    )
                    .map((field) => {
                      const isWide =
                        field.key === "notes" ||
                        field.key === "reason" ||
                        field.key === "quality";

                      return (
                        <div
                          key={field.key}
                          className={
                            isWide
                              ? "space-y-2 sm:col-span-2 lg:col-span-3"
                              : "space-y-2"
                          }
                        >
                          <label
                            htmlFor={`entity-event-${field.key}`}
                            className="text-sm font-medium"
                          >
                            {field.label}
                          </label>

                          <div className="relative">
                            <Input
                              id={`entity-event-${field.key}`}
                              type={field.type}
                              min={field.min}
                              step={field.step}
                              placeholder={field.placeholder ?? ""}
                              value={form.values[field.key] ?? ""}
                              onChange={(e) =>
                                setForm((prev) => ({
                                  ...prev,
                                  values: {
                                    ...prev.values,
                                    [field.key]: e.target.value,
                                  },
                                }))
                              }
                              className={field.unit ? "pr-12" : ""}
                            />

                            {field.unit && (
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                                {field.unit}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="mt-5 flex justify-end border-t border-border/60 pt-5">
              <Button
                type="submit"
                disabled={!form.type || saving || isClosedEntity}
              >
                {saving ? "Saving…" : "Log event"}
              </Button>
            </div>
          </form>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Activity className="size-4" />
          </div>

          <div>
            <h2 className="text-base font-semibold">Activity history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Events recorded for this entity.
            </p>
          </div>
        </div>

        {events.length === 0 ? (
          <Card className="border-border/70 bg-card shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">
                No events logged yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            <div className="absolute bottom-5 left-[18px] top-5 w-px bg-border" />

            <div className="space-y-3">
              {events.map((event) => {
                const Icon = eventIcon(event.type);

                return (
                  <Card
                    key={event.id}
                    className="relative border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <CardContent className="flex gap-3 p-4 sm:gap-4">
                      <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-primary">
                        <Icon className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">
                              {getEventDisplayLabel(event.type)}
                            </h3>

                            {getEventSemantics(event, entity).terminal && (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                Lifecycle transition
                              </span>
                            )}

                            {!getEventSemantics(event, entity).terminal &&
                              getEventSemantics(event, entity)
                                .statusChanged && (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  Status change
                                </span>
                              )}

                            {!getEventSemantics(event, entity).terminal &&
                              !getEventSemantics(event, entity).statusChanged &&
                              getEventSemantics(event, entity)
                                .quantityChanged && (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  Quantity movement
                                </span>
                              )}
                          </div>

                          <time className="shrink-0 text-xs text-muted-foreground">
                            {formatEventDate(event.occurred_at)}
                          </time>
                        </div>

                        {getEventSummary(event) && (
                          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                            {getEventSummary(event)}
                          </p>
                        )}

                        {getEventImpact(event, entity) && (
                          <p className="mt-1 text-xs font-medium text-primary">
                            {getEventImpact(event, entity)}
                          </p>
                        )}
                        {getEventStatusImpact(event, entity) && (
                          <p className="mt-1 text-xs font-medium text-muted-foreground">
                            {getEventStatusImpact(event, entity)}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
export default EntityDetail;
