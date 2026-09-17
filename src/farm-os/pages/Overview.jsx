import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { computeStock } from "../engines/inventoryEngine";
import {
  aggregateDailyConsumption,
  computeDailyRate,
  daysRemaining,
  classifyAlert,
  estimateMonthlyRequirement,
} from "../engines/feedForecastEngine";
import { classifyTask } from "../engines/taskEngine";
import "./Overview.css";

const ALERT_LABEL = {
  green: "🟢 Healthy",
  yellow: "🟡 Reorder soon",
  red: "🔴 Reorder now",
  unknown: "⚪ Not enough data yet",
};

function Overview() {
  const [species, setSpecies] = useState([]);
  const [entityCount, setEntityCount] = useState(null);
  const [feedAlerts, setFeedAlerts] = useState([]);
  const [taskSummary, setTaskSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      const [speciesRes, entitiesRes, itemsRes, lotsRes, feedEventsRes, tasksRes] = await Promise.all([
        supabase.from("species_config").select("id, name, category").order("name"),
        supabase.from("farm_entities").select("id", { count: "exact", head: true }),
        supabase.from("inventory_items").select("*"),
        supabase.from("inventory_lots").select("*"),
        supabase.from("entity_events").select("occurred_at, payload").eq("type", "feed_given"),
        supabase.from("tasks").select("due_at, priority, completed_at").is("completed_at", null),
      ]);

      if (speciesRes.error) {
        setError(speciesRes.error.message);
      } else {
        setSpecies(speciesRes.data ?? []);
      }

      if (!entitiesRes.error) {
        setEntityCount(entitiesRes.count ?? 0);
      }

      if (!itemsRes.error && !lotsRes.error && !feedEventsRes.error) {
        const lotsByItem = {};
        for (const lot of lotsRes.data ?? []) {
          if (!lotsByItem[lot.item_id]) lotsByItem[lot.item_id] = [];
          lotsByItem[lot.item_id].push(lot);
        }

        const alerts = (itemsRes.data ?? []).map((item) => {
          const { totalRemaining } = computeStock(lotsByItem[item.id] ?? []);
          const itemFeedEvents = (feedEventsRes.data ?? []).filter(
            (e) => e.payload?.item_id === item.id
          );
          const dailyMap = aggregateDailyConsumption(itemFeedEvents);
          const rate = computeDailyRate(dailyMap);
          const remaining = daysRemaining(totalRemaining, rate);
          const alert = classifyAlert(remaining, item.reorder_lead_time_days);
          const monthlyReq = estimateMonthlyRequirement(rate);

          return {
            item,
            totalRemaining,
            rate,
            remaining,
            alert,
            monthlyReq,
          };
        });

        setFeedAlerts(alerts);
      }

      if (!tasksRes.error) {
        const today = new Date().toISOString().slice(0, 10);
        const openTasks = tasksRes.data ?? [];
        const overdue = openTasks.filter((t) => classifyTask(t, today) === "overdue").length;
        const dueToday = openTasks.filter((t) => classifyTask(t, today) === "today").length;
        const critical = openTasks.filter((t) => t.priority === "critical").length;
        setTaskSummary({ overdue, dueToday, critical, total: openTasks.length });
      }

      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="farmos-overview">
      <h1 className="farmos-overview__title">Overview</h1>
      <p className="farmos-overview__intro">
        Live reorder alerts, computed from real consumption history — not typed-in estimates.
      </p>

      {error && <p className="farmos-overview__error">{error}</p>}

      {loading ? (
        <p className="farmos-overview__loading">Loading farm data…</p>
      ) : (
        <>
          <section className="farmos-overview__section">
            <h2 className="farmos-overview__section-title">Feed & stock alerts</h2>
            {feedAlerts.length === 0 ? (
              <p className="farmos-overview__empty">
                No inventory items yet — add some in Inventory to see reorder alerts here.
              </p>
            ) : (
              <div className="farmos-alert-grid">
                {feedAlerts.map(({ item, totalRemaining, rate, remaining, alert, monthlyReq }) => (
                  <div key={item.id} className={`farmos-alert-card farmos-alert-card--${alert}`}>
                    <div className="farmos-alert-card__header">
                      <span className="farmos-alert-card__name">{item.name}</span>
                      <span className="farmos-alert-card__badge">{ALERT_LABEL[alert]}</span>
                    </div>
                    <p className="farmos-alert-card__stock">
                      {totalRemaining.toFixed(1)} {item.unit} remaining
                    </p>
                    <p className="farmos-alert-card__meta">
                      {rate != null
                        ? `${rate.toFixed(2)} ${item.unit}/day average`
                        : "Not enough history for a rate yet"}
                    </p>
                    {remaining != null && (
                      <p className="farmos-alert-card__meta">
                        ≈ {remaining.toFixed(1)} days remaining
                        {item.reorder_lead_time_days != null &&
                          ` · lead time ${item.reorder_lead_time_days}d`}
                      </p>
                    )}
                    {monthlyReq != null && (
                      <p className="farmos-alert-card__meta">
                        Est. 30-day need: {monthlyReq.toFixed(1)} {item.unit}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="farmos-overview__cards">
            <div className="farmos-card">
              <span className="farmos-card__label">Configured species/crops</span>
              <span className="farmos-card__value">{species.length}</span>
            </div>
            <div className="farmos-card">
              <span className="farmos-card__label">Farm entities recorded</span>
              <span className="farmos-card__value">{entityCount ?? "—"}</span>
            </div>
            {taskSummary && (
              <>
                <div className={`farmos-card${taskSummary.overdue > 0 ? " farmos-card--warn" : ""}`}>
                  <span className="farmos-card__label">Overdue tasks</span>
                  <span className="farmos-card__value">{taskSummary.overdue}</span>
                </div>
                <div className="farmos-card">
                  <span className="farmos-card__label">Due today</span>
                  <span className="farmos-card__value">{taskSummary.dueToday}</span>
                </div>
              </>
            )}
          </section>

          <section className="farmos-overview__section">
            <h2 className="farmos-overview__section-title">Species configuration</h2>
            {species.length === 0 ? (
              <p className="farmos-overview__empty">
                No species configured yet — manage these on the Species page.
              </p>
            ) : (
              <ul className="farmos-overview__species-list">
                {species.map((s) => (
                  <li key={s.id} className="farmos-overview__species-item">
                    <span className="farmos-overview__species-name">{s.name}</span>
                    <span className="farmos-overview__species-category">{s.category}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {entityCount === 0 && (
            <section className="farmos-overview__section">
              <h2 className="farmos-overview__section-title">No farm entities yet</h2>
              <p className="farmos-overview__empty">
                Register your quail, goat, and crop plots on the <Link to="/farm-os/species">Species</Link> page.
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default Overview;
