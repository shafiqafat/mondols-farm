import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { todayFarmDate } from "../lib/farmDate";
import {
  getQuickFieldsForCapabilities,
  buildEventRows,
} from "../engines/dailyLogEngine";
import "./DailyLog.css";

function DailyLog() {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [date, setDate] = useState(todayFarmDate());
  const [entityValues, setEntityValues] = useState({});
  const [expense, setExpense] = useState({ amount: "", category: "", entityId: "" });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError("");

      const { data, error } = await supabase
        .from("farm_entities")
        .select("id, label, quantity, species_config:species_config_id(id, name, category, capabilities)")
        .eq("status", "active")
        .order("label");

      if (error) {
        setLoadError(error.message);
      } else {
        setEntities(data ?? []);
      }
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
        });
      });

      const hasExpense = expense.amount !== "";
      const expenseAmount = hasExpense ? Number(expense.amount) : null;

      if (hasExpense && (!Number.isFinite(expenseAmount) || expenseAmount <= 0)) {
        throw new Error("Expense amount must be greater than 0.");
      }

      if (allRows.length === 0 && !hasExpense) {
        throw new Error("Add at least one farm log entry or expense before saving.");
      }

      const expensePayload = hasExpense
        ? {
            amount: expenseAmount,
            category: expense.category || null,
            entity_id: expense.entityId || null,
            occurred_at: date,
          }
        : null;

      const { error } = await supabase.rpc("save_daily_log", {
        p_events: allRows,
        p_expense: expensePayload,
      });

      if (error) throw error;

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
