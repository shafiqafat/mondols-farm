import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  ListTodo,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { localDateISO } from "../lib/localDate";
import { classifyTask, computeNextDueDate } from "../engines/taskEngine";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
        .select("*, entity:entity_id(id, label, status)")
        .order("due_at", { ascending: true, nullsFirst: false }),
      supabase
        .from("farm_entities")
        .select("id, label")
        .eq("status", "active")
        .order("label"),
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
    setForm({
      title: "",
      entityId: "",
      dueAt: "",
      recurrence: "",
      priority: "normal",
      notes: "",
    });
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
    const entityIsActive = !task.entity || task.entity.status === "active";
    const nextDue = computeNextDueDate(task.due_at, task.recurrence);
    if (nextDue && entityIsActive) {
      const { error: nextError } = await supabase.from("tasks").insert({
        title: task.title,
        entity_id: task.entity_id,
        due_at: nextDue,
        recurrence: task.recurrence,
        priority: task.priority,
        notes: task.notes,
      });
      if (nextError) {
        setPageError(
          `Marked complete, but couldn't create the next occurrence: ${nextError.message}`,
        );
      }
    }

    setCompletingId(null);
    loadAll();
  }

  if (loading) {
    return (
      <Card className="border-border/70 bg-card shadow-sm">
        <CardContent className="flex min-h-32 items-center justify-center p-5">
          <p className="text-sm text-muted-foreground">Loading tasks…</p>
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

  const today = todayISO();
  const incomplete = tasks.filter(
    (t) => !t.completed_at && (!t.entity || t.entity.status === "active"),
  );
  const completed = tasks.filter((t) => t.completed_at);

  const grouped = { overdue: [], today: [], upcoming: [], "no-due-date": [] };
  for (const task of incomplete) {
    const group = classifyTask(task, today);
    if (grouped[group]) grouped[group].push(task);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ListTodo className="size-4" />
        </div>

        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em]">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage farm work, recurring operations, and upcoming tasks.
          </p>
        </div>
      </div>

      {pageError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">{pageError}</p>
        </div>
      )}

      {GROUP_ORDER.map((group) =>
        grouped[group].length === 0 ? null : (
          <section key={group} className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">{GROUP_LABEL[group]}</h2>

              <Badge
                variant={group === "overdue" ? "destructive" : "secondary"}
                className="font-normal"
              >
                {grouped[group].length}
              </Badge>
            </div>

            <div className="space-y-2">
              {grouped[group].map((task) => (
                <div
                  key={task.id}
                  className={`flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    task.priority === "critical"
                      ? "border-l-4 border-l-destructive"
                      : task.priority === "high"
                        ? "border-l-4 border-l-amber-500"
                        : task.priority === "normal"
                          ? "border-l-4 border-l-[var(--color-earth)]"
                          : ""
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {task.title}
                    </span>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span>{task.due_at ?? "No due date"}</span>

                      {task.recurrence && (
                        <span>· repeats {task.recurrence}</span>
                      )}

                      {task.entity && <span>· {task.entity.label}</span>}

                      {task.priority === "critical" && (
                        <Badge
                          variant="destructive"
                          className="h-5 px-1.5 text-[10px]"
                        >
                          Critical
                        </Badge>
                      )}
                    </div>
                    {task.notes && (
                      <p className="pt-1 text-sm leading-5 text-muted-foreground">
                        {task.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleComplete(task)}
                    disabled={completingId === task.id}
                    className="w-full shrink-0 sm:w-auto"
                  >
                    <CheckCircle2 className="size-4" />
                    {completingId === task.id ? "Completing…" : "Done"}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        ),
      )}

      {incomplete.length === 0 && (
        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <CheckCircle2 className="size-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              Nothing pending — add a task below.
            </p>
          </CardContent>
        </Card>
      )}

      <form
        className="rounded-xl border border-border/70 bg-card p-5 shadow-sm"
        onSubmit={handleAdd}
      >
        <div className="mb-5 flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ClipboardList className="size-4" />
          </div>

          <div>
            <h2 className="text-base font-semibold">Add a task</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create a one-time or recurring task for the farm.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-2 sm:col-span-2 lg:col-span-2">
            <label htmlFor="task-title" className="text-sm font-medium">
              Task
            </label>

            <Input
              id="task-title"
              type="text"
              placeholder="e.g. Quail cage cleaning"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="task-entity" className="text-sm font-medium">
              Entity
            </label>

            <select
              id="task-entity"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              value={form.entityId}
              onChange={(e) =>
                setForm((p) => ({ ...p, entityId: e.target.value }))
              }
            >
              <option value="">No entity</option>

              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="task-due-date" className="text-sm font-medium">
              Due date
            </label>

            <Input
              id="task-due-date"
              type="date"
              value={form.dueAt}
              onChange={(e) =>
                setForm((p) => ({ ...p, dueAt: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="task-recurrence" className="text-sm font-medium">
              Repeat
            </label>

            <select
              id="task-recurrence"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              value={form.recurrence}
              onChange={(e) =>
                setForm((p) => ({ ...p, recurrence: e.target.value }))
              }
            >
              {RECURRENCE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="task-priority" className="text-sm font-medium">
              Priority
            </label>

            <select
              id="task-priority"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm capitalize shadow-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
              value={form.priority}
              onChange={(e) =>
                setForm((p) => ({ ...p, priority: e.target.value }))
              }
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          <label htmlFor="task-notes" className="text-sm font-medium">
            Notes
          </label>

          <Textarea
            id="task-notes"
            placeholder="Optional notes"
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            rows={3}
          />
        </div>
        <div className="mt-5 flex justify-end border-t border-border/60 pt-5">
          <Button type="submit" disabled={saving}>
            {saving ? "Adding…" : "Add task"}
          </Button>
        </div>
      </form>

      {completed.length > 0 && (
        <section className="space-y-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowCompleted((s) => !s)}
          >
            <CheckCircle2 className="size-4" />
            {showCompleted ? "Hide" : "Show"} completed ({completed.length})
          </Button>
          {showCompleted && (
            <div className="space-y-2">
              {completed.map((task) => (
                <Card
                  key={task.id}
                  className="border-border/70 bg-card opacity-70 shadow-sm"
                >
                  <CardContent className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-medium line-through">
                      {task.title}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      Completed {task.completed_at?.slice(0, 10)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default Tasks;
