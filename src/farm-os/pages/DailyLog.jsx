import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { todayFarmDate } from "../lib/farmDate";
import {
  getQuickFieldsForCapabilities,
  buildEventRows,
} from "../engines/dailyLogEngine";
import { consumeFIFO } from "../engines/inventoryEngine";
import "./DailyLog.css";


function DailyLog() {
  const [entities, setEntities] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [lotsByItem, setLotsByItem] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [date, setDate] = useState(todayFarmDate());
  const [entityValues, setEntityValues] = useState({});
  const [feedItemSelection, setFeedItemSelection] = useState({});
  const [expense, setExpense] = useState({ amount: "", category: "", entityId: "" });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitWarning, setSubmitWarning] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError("");

      const [entitiesRes, itemsRes, lotsRes] = await Promise.all([
        supabase
          .from("farm_entities")
          .select("id, label, quantity, species_config:species_config_id(id, name, category, capabilities)")
          .eq("status", "active")
          .order("label"),
        supabase.from("inventory_items").select("*").order("name"),
        supabase.from("inventory_lots").select("*"),
      ]);

      if (entitiesRes.error) {
        setLoadError(entitiesRes.error.message);
        setLoading(false);
        return;
      }

      setEntities(entitiesRes.data ?? []);
      setInventoryItems(itemsRes.data ?? []);

      const grouped = {};
      for (const lot of lotsRes.data ?? []) {
        if (!grouped[lot.item_id]) grouped[lot.item_id] = [];
        grouped[lot.item_id].push(lot);
      }
      setLotsByItem(grouped);

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

      // Work out FIFO inventory consumption for every feed_given row that has
      // a linked inventory item, before writing anything — so a stock
      // problem surfaces before we commit events, not after.
      const lotUpdatesById = {};
      const shortfalls = [];
      // Lots get consumed cumulatively across entities sharing one item
      // (e.g. two quail batches drawing from the same feed bag), so track
      // running remaining quantities locally rather than re-reading per entity.
      const workingLots = structuredClone(lotsByItem);

      for (const row of allRows) {
        if (row.type !== "feed_given") continue;
        const itemId = feedItemSelection[row.entity_id];
        if (!itemId) continue;

        const result = consumeFIFO(workingLots[itemId] ?? [], row.payload.qty_kg);
        for (const updated of result.updatedLots) {
          lotUpdatesById[updated.id] = updated.qty_remaining;
          const lotIndex = (workingLots[itemId] ?? []).findIndex((l) => l.id === updated.id);
          if (lotIndex !== -1) workingLots[itemId][lotIndex].qty_remaining = updated.qty_remaining;
        }
        if (result.shortfall > 0) {
          const itemName = inventoryItems.find((i) => i.id === itemId)?.name ?? "item";
          shortfalls.push(`${itemName}: short by ${result.shortfall.toFixed(2)}`);
        }
      }

      const eventsToInsert = allRows;

      if (eventsToInsert.length > 0) {
        const { error } = await supabase.from("entity_events").insert(eventsToInsert);
        if (error) throw error;
      }

      const lotUpdateIds = Object.keys(lotUpdatesById);
      if (lotUpdateIds.length > 0) {
        const results = await Promise.all(
          lotUpdateIds.map((lotId) =>
            supabase
              .from("inventory_lots")
              .update({ qty_remaining: lotUpdatesById[lotId] })
              .eq("id", lotId)
          )
        );
        const failed = results.find((r) => r.error);
        if (failed) throw failed.error;
      }

      if (expense.amount !== "" && !Number.isNaN(Number(expense.amount))) {
        const { error } = await supabase.from("finance_transactions").insert({
          type: "expense",
          amount: Number(expense.amount),
          category: expense.category || null,
          entity_id: expense.entityId || null,
          occurred_at: date,
        });
        if (error) throw error;
      }

      if (shortfalls.length > 0) {
        setSubmitWarning(`Saved, but stock ran short: ${shortfalls.join("; ")}. Record a purchase in Inventory.`);
      }

      setEntityValues({});
      setExpense({ amount: "", category: "", entityId: "" });
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
