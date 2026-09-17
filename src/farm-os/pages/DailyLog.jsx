import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  getQuickFieldsForCapabilities,
  buildEventRows,
} from "../engines/dailyLogEngine";
import { enqueue } from "../lib/offlineQueue";
import { localDateISO } from "../lib/localDate";
import "./DailyLog.css";

function DailyLog() {
  const [entities, setEntities] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [date, setDate] = useState(localDateISO());
  const [entityValues, setEntityValues] = useState({});
  const [feedItemSelection, setFeedItemSelection] = useState({});
  const [expense, setExpense] = useState({ amount: "", category: "", entityId: "" });
  const [content, setContent] = useState({ photos: "", videos: "", note: "" });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitWarning, setSubmitWarning] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError("");

      const [entitiesRes, itemsRes] = await Promise.all([
        supabase
          .from("farm_entities")
          .select("id, label, quantity, species_config:species_config_id(id, name, category, capabilities)")
          .eq("status", "active")
          .order("label"),
        supabase.from("inventory_items").select("*").order("name"),
      ]);

      if (entitiesRes.error) {
        setLoadError(entitiesRes.error.message);
        setLoading(false);
        return;
      }

      setEntities(entitiesRes.data ?? []);
      setInventoryItems(itemsRes.data ?? []);

      setLoading(false);
    }

    load();
  }, []);

  function updateEntityField(entityId, fieldKey, value) {
    setEntityValues((prev) => ({
      ...prev,
      [entityId]: { ...prev[entityId], [fieldKey]: value },
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    setSubmitWarning("");
    setSubmitted(false);
    setSubmitting(true);

    try {
      const allRows = entities.flatMap((entity) => {
        const capabilities = entity.species_config?.capabilities ?? {};
        const fields = getQuickFieldsForCapabilities(capabilities);
        const values = entityValues[entity.id] ?? {};
        return buildEventRows({
          entityId: entity.id,
          occurredAt: date,
          fields,
          values,
        }).map((row) => {
          if (row.type === "feed_given" && feedItemSelection[entity.id]) {
            return { ...row, payload: { ...row.payload, item_id: feedItemSelection[entity.id] } };
          }
          return row;
        });
      });

      const photos = content.photos !== "" ? Number(content.photos) : 0;
      const videos = content.videos !== "" ? Number(content.videos) : 0;
      const hasContent = photos > 0 || videos > 0 || content.note.trim() !== "";
      const contentParts = [];
      if (photos > 0) contentParts.push(`${photos} photo${photos > 1 ? "s" : ""}`);
      if (videos > 0) contentParts.push(`${videos} video${videos > 1 ? "s" : ""}`);
      const contentRow = hasContent
        ? {
            title: `Daily capture — ${date}`,
            type: photos > 0 && videos > 0 ? "mixed" : videos > 0 ? "video" : photos > 0 ? "photo" : "note",
            stage: "captured",
            notes: [contentParts.join(", "), content.note.trim()].filter(Boolean).join(" — "),
            occurred_at: date,
          }
        : null;

      const expenseRow =
        expense.amount !== "" && !Number.isNaN(Number(expense.amount))
          ? {
              type: "expense",
              amount: Number(expense.amount),
              category: expense.category || null,
              entity_id: expense.entityId || null,
              occurred_at: date,
            }
          : null;

      // A complete daily log is one durable unit, online or offline.
      if (!navigator.onLine) {
        enqueue("daily_log", { events: allRows, expense: expenseRow, content: contentRow });

        setEntityValues({});
        setExpense({ amount: "", category: "", entityId: "" });
        setContent({ photos: "", videos: "", note: "" });
        setSubmitWarning(
          "You're offline — saved on this device and queued to sync automatically once you're back online."
        );
        setSubmitted(true);
        return;
      }

      const { data, error } = await supabase.rpc("process_daily_log", {
        p_events: allRows,
        p_expense: expenseRow,
        p_content: contentRow,
      });
      if (error) throw error;
      if (data?.shortfalls?.length > 0) {
        const warning = data.shortfalls
          .map((item) => `${item.item_name ?? "item"}: short by ${Number(item.shortfall).toFixed(2)}`)
          .join("; ");
        setSubmitWarning(`Saved, but stock ran short: ${warning}. Record a purchase in Inventory.`);
      }

      setEntityValues({});
      setExpense({ amount: "", category: "", entityId: "" });
      setContent({ photos: "", videos: "", note: "" });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message ?? "Something went wrong saving today's log.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="farmos-dailylog__status">Loading today's entities…</p>;
  }

  if (loadError) {
    return <p className="farmos-dailylog__status farmos-dailylog__status--error">{loadError}</p>;
  }

  return (
    <div className="farmos-dailylog">
      <h1 className="farmos-dailylog__title">Daily Log</h1>

      <div className="farmos-dailylog__date-row">
        <label htmlFor="log-date">Date</label>
        <input
          id="log-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {entities.length === 0 ? (
        <p className="farmos-dailylog__status">
          No active farm entities yet — register some in the database before logging against them.
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="farmos-dailylog__entities">
            {entities.map((entity) => {
              const capabilities = entity.species_config?.capabilities ?? {};
              const fields = getQuickFieldsForCapabilities(capabilities);
              const values = entityValues[entity.id] ?? {};

              return (
                <div key={entity.id} className="farmos-entity-card">
                  <div className="farmos-entity-card__header">
                    <span className="farmos-entity-card__label">{entity.label}</span>
                    <span className="farmos-entity-card__species">
                      {entity.species_config?.name}
                    </span>
                  </div>

                  <div className="farmos-entity-card__fields">
                    {fields.map((field) => (
                      <label key={field.key} className="farmos-entity-card__field">
                        <span>{field.label}</span>
                        <input
                          type="number"
                          inputMode={field.inputMode}
                          step="any"
                          value={values[field.key] ?? ""}
                          onChange={(e) =>
                            updateEntityField(entity.id, field.key, e.target.value)
                          }
                        />
                        {field.key === "feed_kg" && inventoryItems.length > 0 && (
                          <select
                            className="farmos-entity-card__feed-item"
                            value={feedItemSelection[entity.id] ?? ""}
                            onChange={(e) =>
                              setFeedItemSelection((prev) => ({
                                ...prev,
                                [entity.id]: e.target.value,
                              }))
                            }
                          >
                            <option value="">From stock…</option>
                            {inventoryItems.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </label>
                    ))}
                  </div>

                  <label className="farmos-entity-card__note">
                    <span>Note</span>
                    <input
                      type="text"
                      placeholder="Optional — e.g. field inspection, health observation"
                      value={values.note ?? ""}
                      onChange={(e) => updateEntityField(entity.id, "note", e.target.value)}
                    />
                  </label>
                </div>
              );
            })}
          </div>

          <div className="farmos-dailylog__expense">
            <h2 className="farmos-dailylog__section-title">Today's expense (optional)</h2>
            <div className="farmos-dailylog__expense-fields">
              <label>
                <span>Amount (৳)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={expense.amount}
                  onChange={(e) => setExpense((p) => ({ ...p, amount: e.target.value }))}
                />
              </label>
              <label>
                <span>Category</span>
                <input
                  type="text"
                  placeholder="e.g. feed, transport, medicine"
                  value={expense.category}
                  onChange={(e) => setExpense((p) => ({ ...p, category: e.target.value }))}
                />
              </label>
              <label>
                <span>For</span>
                <select
                  value={expense.entityId}
                  onChange={(e) => setExpense((p) => ({ ...p, entityId: e.target.value }))}
                >
                  <option value="">General (not entity-specific)</option>
                  {entities.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="farmos-dailylog__expense">
            <h2 className="farmos-dailylog__section-title">Today's content (optional)</h2>
            <div className="farmos-dailylog__expense-fields">
              <label>
                <span>Photos</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={content.photos}
                  onChange={(e) => setContent((p) => ({ ...p, photos: e.target.value }))}
                />
              </label>
              <label>
                <span>Videos</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={content.videos}
                  onChange={(e) => setContent((p) => ({ ...p, videos: e.target.value }))}
                />
              </label>
              <label>
                <span>Note</span>
                <input
                  type="text"
                  placeholder="What did you capture?"
                  value={content.note}
                  onChange={(e) => setContent((p) => ({ ...p, note: e.target.value }))}
                />
              </label>
            </div>
          </div>

          {submitError && (
            <p className="farmos-dailylog__status farmos-dailylog__status--error">
              {submitError}
            </p>
          )}
          {submitWarning && (
            <p className="farmos-dailylog__status farmos-dailylog__status--warning">
              {submitWarning}
            </p>
          )}
          {submitted && (
            <p className="farmos-dailylog__status farmos-dailylog__status--success">
              Saved today's log.
            </p>
          )}

          <button type="submit" className="farmos-dailylog__submit" disabled={submitting}>
            {submitting ? "Saving…" : "Save today's log"}
          </button>
        </form>
      )}
    </div>
  );
}

export default DailyLog;
