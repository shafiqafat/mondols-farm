import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  eventTypesForCategory,
  eventTypeLabel,
  buildEventPayload,
  computeExpectedHarvest,
} from "../engines/entityEventTypes";
import { recommendationsFor } from "../engines/cropRotationEngine";
import "./EntityDetail.css";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

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
        .select("*, species_config:species_config_id(id, name, category, capabilities)")
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

  if (loading) return <p className="farmos-entitydetail__status">Loading…</p>;
  if (loadError)
    return <p className="farmos-entitydetail__status farmos-entitydetail__status--error">{loadError}</p>;
  if (!entity) return <p className="farmos-entitydetail__status">Entity not found.</p>;

  const category = entity.species_config?.category;
  const availableTypes = eventTypesForCategory(category);
  const selectedTypeDef = availableTypes.find((t) => t.value === form.type);
  const harvestOutlook =
    category === "crop" || category === "fodder" ? computeExpectedHarvest(events) : null;
  const rotationSuggestions =
    category === "crop" || category === "fodder"
      ? recommendationsFor(rotationRules, entity.species_config_id)
      : [];

  return (
    <div className="farmos-entitydetail">
      <Link to="/farm-os/species" className="farmos-entitydetail__back">
        ← Species & Entities
      </Link>

      <h1 className="farmos-entitydetail__title">{entity.label}</h1>
      <p className="farmos-entitydetail__meta">
        {entity.species_config?.name} · {category}
        {entity.quantity != null ? ` · ${entity.quantity}` : ""}
        {entity.location ? ` · ${entity.location}` : ""} · {entity.status}
      </p>

      {harvestOutlook && (
        <div className="farmos-entitydetail__outlook">
          Planted {harvestOutlook.plantedAt}
          {harvestOutlook.variety ? ` (${harvestOutlook.variety})` : ""} — expected harvest
          around <strong>{harvestOutlook.expectedHarvestDate}</strong>
        </div>
      )}

      {rotationSuggestions.length > 0 && (
        <div className="farmos-entitydetail__rotation">
          <h2>Suggested next crop</h2>
          <ul>
            {rotationSuggestions.map((r) => (
              <li key={r.id}>
                <strong>{r.to_species?.name}</strong> — {r.reason}
              </li>
            ))}
          </ul>
          <Link to="/farm-os/species">Register it once this plot is free →</Link>
        </div>
      )}

      {pageError && (
        <p className="farmos-entitydetail__status farmos-entitydetail__status--error">{pageError}</p>
      )}

      <section className="farmos-entitydetail__section">
        <h2>Log an event</h2>
        <form onSubmit={handleAddEvent} className="farmos-entitydetail__form">
          <div className="farmos-entitydetail__form-row">
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value, values: {} }))}
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
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
          </div>

          {selectedTypeDef && (
            <div className="farmos-entitydetail__form-fields">
              {selectedTypeDef.fields.includes("variety") && (
                <input
                  type="text"
                  placeholder="Variety"
                  value={form.values.variety ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, values: { ...p.values, variety: e.target.value } }))
                  }
                />
              )}
              {selectedTypeDef.fields.includes("expectedDurationDays") && (
                <input
                  type="number"
                  placeholder="Expected duration (days)"
                  value={form.values.expectedDurationDays ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      values: { ...p.values, expectedDurationDays: e.target.value },
                    }))
                  }
                />
              )}
              {selectedTypeDef.fields.includes("amount") && (
                <input
                  type="number"
                  step="any"
                  placeholder="Amount"
                  value={form.values.amount ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, values: { ...p.values, amount: e.target.value } }))
                  }
                />
              )}
              {selectedTypeDef.fields.includes("unit") && (
                <input
                  type="text"
                  placeholder="Unit, e.g. kg"
                  value={form.values.unit ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, values: { ...p.values, unit: e.target.value } }))
                  }
                />
              )}
              {selectedTypeDef.fields.includes("note") && (
                <input
                  type="text"
                  placeholder="Note"
                  value={form.values.note ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, values: { ...p.values, note: e.target.value } }))
                  }
                />
              )}
            </div>
          )}

          <button type="submit" disabled={!form.type || saving}>
            {saving ? "Saving…" : "Log event"}
          </button>
        </form>
      </section>

      <section className="farmos-entitydetail__section">
        <h2>History</h2>
        {events.length === 0 ? (
          <p className="farmos-entitydetail__status">No events logged yet.</p>
        ) : (
          <ul className="farmos-entitydetail__timeline">
            {events.map((event) => (
              <li key={event.id}>
                <span className="farmos-entitydetail__timeline-date">{event.occurred_at}</span>
                <span className="farmos-entitydetail__timeline-type">
                  {eventTypeLabel(event.type)}
                </span>
                <span className="farmos-entitydetail__timeline-payload">
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
