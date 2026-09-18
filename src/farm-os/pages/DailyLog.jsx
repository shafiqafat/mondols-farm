import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  buildEventRows,
  getQuickFieldsForCapabilities,
  validateDailyLog,
  validateDailyLogInput,
} from "../engines/dailyLogEngine";
import { enqueue } from "../lib/offlineQueue";
import { localDateISO } from "../lib/localDate";
import { CalendarDays, ClipboardList } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function DailyLog() {
  const [entities, setEntities] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [date, setDate] = useState(localDateISO());
  const [entityValues, setEntityValues] = useState({});
  const [feedItemSelection, setFeedItemSelection] = useState({});
  const [expense, setExpense] = useState({
    amount: "",
    category: "",
    entityId: "",
  });
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
          .select(
            "id, label, quantity, species_config:species_config_id(id, name, category, capabilities)",
          )
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
      const inputValidationErrors = validateDailyLogInput({
        entityValues,
        entities,
        expense,
        content,
      });

      if (inputValidationErrors.length > 0) {
        setSubmitError(inputValidationErrors[0]);
        return;
      }
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
            return {
              ...row,
              payload: {
                ...row.payload,
                item_id: feedItemSelection[entity.id],
              },
            };
          }
          return row;
        });
      });

      const photos = content.photos !== "" ? Number(content.photos) : 0;
      const videos = content.videos !== "" ? Number(content.videos) : 0;
      const hasContent = photos > 0 || videos > 0 || content.note.trim() !== "";
      const contentParts = [];
      if (photos > 0)
        contentParts.push(`${photos} photo${photos > 1 ? "s" : ""}`);
      if (videos > 0)
        contentParts.push(`${videos} video${videos > 1 ? "s" : ""}`);
      const contentRow = hasContent
        ? {
            title: `Daily capture — ${date}`,
            type:
              photos > 0 && videos > 0
                ? "mixed"
                : videos > 0
                  ? "video"
                  : photos > 0
                    ? "photo"
                    : "note",
            stage: "captured",
            notes: [contentParts.join(", "), content.note.trim()]
              .filter(Boolean)
              .join(" — "),
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

          const validationErrors = validateDailyLog({
            entityRows: allRows,
            expense: expenseRow,
            content: contentRow,
          });
          if (allRows.length === 0 && !expenseRow && !contentRow) {
            setSubmitError(
              "Add at least one activity, expense, or content entry.",
            );
            return;
          }

          if (validationErrors.length > 0) {
            setSubmitError(validationErrors[0]);
            return;
          }

      // A complete daily log is one durable unit, online or offline.
      if (!navigator.onLine) {
        enqueue("daily_log", {
          events: allRows,
          expense: expenseRow,
          content: contentRow,
        });

        setEntityValues({});
        setExpense({ amount: "", category: "", entityId: "" });
        setContent({ photos: "", videos: "", note: "" });
        setSubmitWarning(
          "You're offline — saved on this device and queued to sync automatically once you're back online.",
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
          .map(
            (item) =>
              `${item.item_name ?? "item"}: short by ${Number(item.shortfall).toFixed(2)}`,
          )
          .join("; ");
        setSubmitWarning(
          `Saved, but stock ran short: ${warning}. Record a purchase in Inventory.`,
        );
      }

      setEntityValues({});
      setExpense({ amount: "", category: "", entityId: "" });
      setContent({ photos: "", videos: "", note: "" });
      setSubmitted(true);
    } 
    catch (err) {
      setSubmitError(err.message ?? "Something went wrong saving today's log.");
    } finally {
      setSubmitting(false);
    }
    
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading today's entities…
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-destructive">{loadError}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ClipboardList className="size-5 text-forest" />
            <h1 className="text-2xl font-semibold tracking-tight">Daily Log</h1>
          </div>

          <p className="text-sm text-muted-foreground">
            Record today's farm activity, expenses, and content in one durable
            log.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          <label
            htmlFor="log-date"
            className="text-sm font-medium text-muted-foreground"
          >
            Date
          </label>
          <Input
            id="log-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {entities.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">
              No active farm entities yet — register some in the database before
              logging against them.
            </p>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {entities.map((entity) => {
              const capabilities = entity.species_config?.capabilities ?? {};
              const fields = getQuickFieldsForCapabilities(capabilities);
              const values = entityValues[entity.id] ?? {};

              return (
                <Card
                  key={entity.id}
                  className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex flex-col gap-1 text-base sm:flex-row sm:items-center sm:justify-between">
                      <span>{entity.label}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {entity.species_config?.name}
                      </span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {fields.map((field) => (
                        <label
                          key={field.key}
                          className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground"
                        >
                          <span>{field.label}</span>
                          <Input
                            type="number"
                            inputMode={field.inputMode}
                            step="any"
                            value={values[field.key] ?? ""}
                            onChange={(e) =>
                              updateEntityField(
                                entity.id,
                                field.key,
                                e.target.value,
                              )
                            }
                          />
                          {field.key === "feed_kg" &&
                            inventoryItems.length > 0 && (
                              <select
                                className="mt-1 min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

                    <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                      <span>Note</span>
                      <Input
                        type="text"
                        placeholder="Optional — e.g. field inspection, health observation"
                        value={values.note ?? ""}
                        onChange={(e) =>
                          updateEntityField(entity.id, "note", e.target.value)
                        }
                      />
                    </label>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Today's expense{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  (optional)
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                  <span>Amount (৳)</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={expense.amount}
                    onChange={(e) =>
                      setExpense((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                  <span>Category</span>
                  <Input
                    type="text"
                    placeholder="e.g. feed, transport, medicine"
                    value={expense.category}
                    onChange={(e) =>
                      setExpense((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                  <span>For</span>
                  <select
                    value={expense.entityId}
                    onChange={(e) =>
                      setExpense((prev) => ({
                        ...prev,
                        entityId: e.target.value,
                      }))
                    }
                    className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Today's content{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  (optional)
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                  <span>Photos</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={content.photos}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        photos: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                  <span>Videos</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    value={content.videos}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        videos: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                  <span>Note</span>
                  <Input
                    type="text"
                    placeholder="What did you capture?"
                    value={content.note}
                    onChange={(e) =>
                      setContent((prev) => ({
                        ...prev,
                        note: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          {submitError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          {submitWarning && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
              {submitWarning}
            </div>
          )}

          {submitted && (
            <div className="rounded-lg border border-forest/20 bg-forest/5 px-4 py-3 text-sm text-forest">
              Saved today's log.
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? "Saving…" : "Save today's log"}
          </Button>
        </form>
      )}
    </div>
  );
}

export default DailyLog;
