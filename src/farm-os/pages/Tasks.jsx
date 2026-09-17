import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { localDateISO } from "../lib/localDate";
import { classifyTask, computeNextDueDate } from "../engines/taskEngine";
import "./Tasks.css";

const todayISO = localDateISO;

const GROUP_LABEL = {
  overdue: "Overdue",
  today: "Today",
  upcoming: "Upcoming",
  "no-due-date": "No due date",
};
const GROUP_ORDER = ["overdue", "today", "upcoming", "no-due-date"];

const PRIORITY_OPTIONS = ["low", "normal", "high", "critical"];
const RECURRENCE_OPTIONS = [
  { value: "", label: "One-time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pageError, setPageError] = useState("");

  const [form, setForm] = useState({
    title: "",
    entityId: "",
    dueAt: "",
    recurrence: "",
    priority: "normal",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  async function loadAll() {
    setLoading(true);
    setLoadError("");

    const [tasksRes, entitiesRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("*, entity:entity_id(label)")
        .order("due_at", { ascending: true, nullsFirst: false }),
      supabase.from("farm_entities").select("id, label").order("label"),
    ]);

    if (tasksRes.error) {
      setLoadError(tasksRes.error.message);
      setLoading(false);
      return;
    }

    setTasks(tasksRes.data ?? []);
    setEntities(entitiesRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setPageError("");

    const { error } = await supabase.from("tasks").insert({
      title: form.title.trim(),
      entity_id: form.entityId || null,
      due_at: form.dueAt || null,
      recurrence: form.recurrence || null,
      priority: form.priority,
      notes: form.notes || null,
    });

    setSaving(false);
    if (error) {
      setPageError(error.message);
      return;
    }
    setForm({ title: "", entityId: "", dueAt: "", recurrence: "", priority: "normal", notes: "" });
    loadAll();
  }

  async function handleComplete(task) {
    setCompletingId(task.id);
    setPageError("");

    const { error } = await supabase
      .from("tasks")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", task.id);

    if (error) {
      setCompletingId(null);
      setPageError(error.message);
      return;
    }

    // Recurring tasks spawn their next occurrence on completion, rather
    // than pre-creating every future date up front.
    const nextDue = computeNextDueDate(task.due_at, task.recurrence);
    if (nextDue) {
      const { error: nextError } = await supabase.from("tasks").insert({
        title: task.title,
        entity_id: task.entity_id,
        due_at: nextDue,
        recurrence: task.recurrence,
        priority: task.priority,
        notes: task.notes,
      });
      if (nextError) {
        setPageError(`Marked complete, but couldn't create the next occurrence: ${nextError.message}`);
      }
    }

    setCompletingId(null);
    loadAll();
  }

  if (loading) return <p className="farmos-tasks__status">Loading…</p>;
  if (loadError)
    return <p className="farmos-tasks__status farmos-tasks__status--error">{loadError}</p>;

  const today = todayISO();
  const incomplete = tasks.filter((t) => !t.completed_at);
  const completed = tasks.filter((t) => t.completed_at);

  const grouped = { overdue: [], today: [], upcoming: [], "no-due-date": [] };
  for (const task of incomplete) {
    const group = classifyTask(task, today);
    if (grouped[group]) grouped[group].push(task);
  }

  return (
    <div className="farmos-tasks">
      <h1 className="farmos-tasks__title">Tasks</h1>

      {pageError && (
        <p className="farmos-tasks__status farmos-tasks__status--error">{pageError}</p>
      )}

      {GROUP_ORDER.map((group) =>
        grouped[group].length === 0 ? null : (
          <section key={group} className="farmos-tasks__section">
            <h2 className={`farmos-tasks__group-title farmos-tasks__group-title--${group}`}>
              {GROUP_LABEL[group]} ({grouped[group].length})
            </h2>
            <div className="farmos-tasks__list">
              {grouped[group].map((task) => (
                <div
                  key={task.id}
                  className={`farmos-task-card farmos-task-card--${task.priority}`}
                >
                  <div className="farmos-task-card__main">
                    <span className="farmos-task-card__title">{task.title}</span>
                    <span className="farmos-task-card__meta">
                      {task.due_at ?? "No due date"}
                      {task.recurrence ? ` · repeats ${task.recurrence}` : ""}
                      {task.entity ? ` · ${task.entity.label}` : ""}
                      {task.priority === "critical" ? " · 🔴 critical" : ""}
                    </span>
                    {task.notes && <p className="farmos-task-card__notes">{task.notes}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleComplete(task)}
                    disabled={completingId === task.id}
                  >
                    {completingId === task.id ? "…" : "Done"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )
      )}

      {incomplete.length === 0 && (
        <p className="farmos-tasks__status">Nothing pending — add a task below.</p>
      )}

      <form className="farmos-tasks__add-form" onSubmit={handleAdd}>
        <h3>Add a task</h3>
        <div className="farmos-tasks__add-fields">
          <input
            type="text"
            placeholder="Task, e.g. Quail cage cleaning"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
          />
          <select
            value={form.entityId}
            onChange={(e) => setForm((p) => ({ ...p, entityId: e.target.value }))}
          >
            <option value="">No entity</option>
            {entities.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={form.dueAt}
            onChange={(e) => setForm((p) => ({ ...p, dueAt: e.target.value }))}
          />
          <select
            value={form.recurrence}
            onChange={(e) => setForm((p) => ({ ...p, recurrence: e.target.value }))}
          >
            {RECURRENCE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <select
            value={form.priority}
            onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <input
          type="text"
          className="farmos-tasks__notes-input"
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
        />
        <button type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add task"}
        </button>
      </form>

      {completed.length > 0 && (
        <section className="farmos-tasks__section">
          <button
            type="button"
            className="farmos-tasks__toggle-completed"
            onClick={() => setShowCompleted((s) => !s)}
          >
            {showCompleted ? "Hide" : "Show"} completed ({completed.length})
          </button>
          {showCompleted && (
            <div className="farmos-tasks__list">
              {completed.map((task) => (
                <div key={task.id} className="farmos-task-card farmos-task-card--completed">
                  <span className="farmos-task-card__title">{task.title}</span>
                  <span className="farmos-task-card__meta">
                    Completed {task.completed_at?.slice(0, 10)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Tasks;
