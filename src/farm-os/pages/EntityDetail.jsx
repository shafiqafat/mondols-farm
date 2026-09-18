import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Sprout } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import {
  eventTypesForCategory,
  eventTypeLabel,
  buildEventPayload,
  computeExpectedHarvest,
} from "../engines/entityEventTypes";
import { recommendationsFor } from "../engines/cropRotationEngine";
import { localDateISO } from "../lib/localDate";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const todayISO = localDateISO;

function summarizePayload(payload) {
  if (!payload || Object.keys(payload).length === 0) return "";
  return Object.entries(payload)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

function EntityDetail() {
  const { id } = useParams();
  const [entity, setEntity] = useState(null);
  const [events, setEvents] = useState([]);
  const [rotationRules, setRotationRules] = useState([]);
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

    const [entityRes, eventsRes] = await Promise.all([
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
        .order("occurred_at", { ascending: false }),
    ]);

    if (entityRes.error) {
      setLoadError(entityRes.error.message);
      setLoading(false);
      return;
    }

    setEntity(entityRes.data);
    setEvents(eventsRes.data ?? []);

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
    const typeDef = availableTypes.find((t) => t.value === form.type);
    if (!typeDef) return;

    setSaving(true);
    setPageError("");

    const payload = buildEventPayload(typeDef, form.values);

    const { error } = await supabase.from("entity_events").insert({
      entity_id: id,
      type: form.type,
      payload,
      occurred_at: form.date,
    });

    setSaving(false);
    if (error) {
      setPageError(error.message);
      return;
    }

    setForm({ type: "", date: todayISO(), values: {} });
    loadAll();
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
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
      <div className="text-sm text-muted-foreground">Entity not found.</div>
    );
  }

  const category = entity.species_config?.category;
  const availableTypes = eventTypesForCategory(category);
  const selectedTypeDef = availableTypes.find((t) => t.value === form.type);
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

      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sprout className="size-5" />
        </div>

        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">
            {entity.label}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{entity.species_config?.name}</span>
            <span>·</span>
            <span className="capitalize">{category}</span>

            {entity.quantity != null && (
              <>
                <span>·</span>
                <span>{entity.quantity}</span>
              </>
            )}

            {entity.location && (
              <>
                <span>·</span>
                <span>{entity.location}</span>
              </>
            )}

            <Badge variant="secondary" className="capitalize">
              {entity.status}
            </Badge>
          </div>
        </div>
      </div>

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

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Log an event</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Record an event for this farm entity.
          </p>
        </div>
        <form
          onSubmit={handleAddEvent}
          className="rounded-xl border border-border/70 bg-card p-5 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
              value={form.type}
              onChange={(e) =>
                setForm((p) => ({ ...p, type: e.target.value, values: {} }))
              }
              required
            >
              <option value="">Event type…</option>
              {availableTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={form.date}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
          </div>

          {selectedTypeDef && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selectedTypeDef.fields.includes("variety") && (
                <input
                  value={form.values.variety ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      values: {
                        ...prev.values,
                        variety: e.target.value,
                      },
                    }))
                  }
                  placeholder="Variety"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              )}
              {selectedTypeDef.fields.includes("expectedDurationDays") && (
                <input
                  type="number"
                  placeholder="Expected duration (days)"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                  value={form.values.expectedDurationDays ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      values: {
                        ...p.values,
                        expectedDurationDays: e.target.value,
                      },
                    }))
                  }
                />
              )}
              {selectedTypeDef.fields.includes("amount") && (
                <input
                  type="number"
                  step="any"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                  placeholder="Amount"
                  value={form.values.amount ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      values: { ...p.values, amount: e.target.value },
                    }))
                  }
                />
              )}
              {selectedTypeDef.fields.includes("unit") && (
                <input
                  type="text"
                  placeholder="Unit, e.g. kg"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                  value={form.values.unit ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      values: { ...p.values, unit: e.target.value },
                    }))
                  }
                />
              )}
              {selectedTypeDef.fields.includes("note") && (
                <input
                  type="text"
                  placeholder="Note"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 sm:col-span-2 lg:col-span-3"
                  value={form.values.note ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      values: { ...p.values, note: e.target.value },
                    }))
                  }
                />
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!form.type || saving}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {saving ? "Saving…" : "Log event"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">History</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Events recorded for this entity.
          </p>
        </div>
        {events.length === 0 ? (
          <p className="rounded-lg border border-border/70 bg-card px-4 py-4 text-sm text-muted-foreground">
            No events logged yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {events.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-start gap-x-4 gap-y-1 rounded-lg border border-border/70 bg-card px-4 py-3 text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="min-w-[90px] text-muted-foreground">
                  {event.occurred_at}
                </span>

                <span className="min-w-[140px] font-semibold text-foreground">
                  {eventTypeLabel(event.type)}
                </span>

                <span className="text-muted-foreground">
                  {summarizePayload(event.payload)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default EntityDetail;
