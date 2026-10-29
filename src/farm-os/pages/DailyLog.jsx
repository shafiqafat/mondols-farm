import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { supabase } from "../lib/supabaseClient";
import {
  buildEventRows,
  getQuickFieldsForCapabilities,
  validateDailyLog,
  validateDailyLogInput,
} from "../engines/dailyLogEngine";
import { enqueue } from "../lib/offlineQueue";
import { localDateISO } from "../lib/localDate";
import { useAuth } from "../hooks/useAuth";
import { canWrite } from "../lib/permissions";
import { CalendarDays, ClipboardList, Pencil, X, Save } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Kept local so this page does not depend on an eventDefinitions module
// that may not exist in every FarmOS checkout.
const EVENT_SCHEMAS = {
  weight_check: {
    fields: [
      {
        key: "kg",
        label: "Weight",
        type: "number",
        unit: "kg",
        min: 0,
        step: "0.01",
        validation: { minExclusive: true },
      },
    ],
  },
  feed_given: {
    fields: [
      {
        key: "qty_kg",
        label: "Feed quantity",
        type: "number",
        unit: "kg",
        min: 0,
        step: "0.01",
        validation: { minExclusive: true },
      },
    ],
  },
  egg_count: {
    fields: [
      {
        key: "count",
        label: "Eggs produced",
        type: "number",
        min: 0,
        step: "1",
      },
    ],
  },
  harvest: {
    fields: [
      {
        key: "quantity",
        label: "Harvest quantity",
        type: "number",
        min: 0,
        step: "0.01",
        validation: { minExclusive: true },
      },
      { key: "unit", label: "Unit", type: "text", placeholder: "kg" },
      { key: "quality", label: "Quality", type: "text" },
    ],
  },
  treatment: {
    fields: [
      { key: "medicine", label: "Medicine / treatment", type: "text" },
      {
        key: "dose",
        label: "Dose",
        type: "number",
        min: 0,
        step: "0.01",
        validation: { minExclusive: true, optional: true },
      },
      { key: "unit", label: "Dose unit", type: "text", placeholder: "ml" },
      { key: "reason", label: "Reason", type: "text" },
    ],
  },
  mortality: {
    fields: [
      { key: "quantity", label: "Quantity", type: "number", min: 1, step: "1" },
      { key: "reason", label: "Reason", type: "text" },
    ],
  },
  breeding: {
    fields: [
      { key: "quantity", label: "Quantity", type: "number", min: 1, step: "1" },
      { key: "notes", label: "Breeding notes", type: "text" },
    ],
  },
  purchase: {
    fields: [
      {
        key: "quantity",
        label: "Quantity",
        type: "number",
        min: 0,
        step: "0.01",
      },
      { key: "unit", label: "Unit", type: "text" },
    ],
  },
  sale: {
    fields: [
      {
        key: "quantity",
        label: "Quantity",
        type: "number",
        min: 0,
        step: "0.01",
      },
      { key: "unit", label: "Unit", type: "text" },
    ],
  },
  planting: {
    fields: [
      { key: "variety", label: "Variety", type: "text" },
      {
        key: "expectedDurationDays",
        label: "Expected duration (days)",
        type: "number",
        min: 1,
        step: "1",
      },
    ],
  },
  fertilizer_applied: {
    fields: [
      {
        key: "amount",
        label: "Amount",
        type: "number",
        min: 0,
        step: "0.01",
        validation: { minExclusive: true, optional: true },
      },
      { key: "unit", label: "Unit", type: "text", placeholder: "kg" },
    ],
  },
  irrigation: { fields: [{ key: "notes", label: "Details", type: "text" }] },
  pest_observation: {
    fields: [{ key: "notes", label: "Observation", type: "text" }],
  },
  growth_stage: {
    fields: [{ key: "notes", label: "Growth stage", type: "text" }],
  },
  processing: {
    fields: [{ key: "notes", label: "Processing details", type: "text" }],
  },
  health_note: {
    fields: [{ key: "notes", label: "Health observation", type: "text" }],
  },
  other: { fields: [] },
};

function formatHistoricalPayload(event, inventoryItems) {
  const payload = event.payload ?? {};
  const type = event.event_type;

  if (type === "feed_given" || type === "feed") {
    const item = inventoryItems.find((item) => item.id === payload.item_id);

    return `Feed: ${payload.qty_kg ?? 0} kg${item ? ` · ${item.name}` : ""}`;
  }

  if (type === "egg_count" || type === "egg_production") {
    return `Eggs produced: ${payload.count ?? 0}`;
  }

  if (type === "weight_check" || type === "weight") {
    return `Weight: ${payload.kg ?? 0} kg`;
  }

  if (type === "mortality") {
    return `Mortality: ${payload.quantity ?? payload.count ?? 0}${
      payload.reason ? ` · ${payload.reason}` : ""
    }`;
  }

  if (type === "harvest") {
    const quantity = payload.quantity ?? payload.qty_kg ?? 0;
    const unit = payload.unit ?? "kg";

    return `Harvest: ${quantity} ${unit}${
      payload.quality ? ` · Quality: ${payload.quality}` : ""
    }`;
  }

  const schema = EVENT_SCHEMAS[type];

  if (schema?.fields?.length) {
    const summary = schema.fields
      .filter(
        (field) => payload[field.key] != null && payload[field.key] !== "",
      )
      .map((field) => {
        const value = payload[field.key];
        return `${field.label}: ${value}${field.unit ? ` ${field.unit}` : ""}`;
      });

    if (summary.length) return summary.join(" · ");
  }

  return (
    Object.entries(payload)
      .filter(([key]) => key !== "item_id")
      .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
      .join(" · ") || "No details"
  );
}

function DailyLog() {
  const { role } = useAuth();
  const canEdit = canWrite(role);

  const [entities, setEntities] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [recordedLogs, setRecordedLogs] = useState([]);
  const [historicalEvents, setHistoricalEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [historicalFromDate, setHistoricalFromDate] = useState("");
  const [historicalToDate, setHistoricalToDate] = useState(localDateISO());
  const [historicalProjectId, setHistoricalProjectId] = useState("");
  const [historicalFilterApplied, setHistoricalFilterApplied] = useState(false);
  const [historicalLoading, setHistoricalLoading] = useState(false);
  const [historicalLoadMessage, setHistoricalLoadMessage] = useState("");
  const [editingHistorical, setEditingHistorical] = useState(null);
  const [historicalEntityId, setHistoricalEntityId] = useState("");
  const [historicalType, setHistoricalType] = useState("");
  const [historicalDate, setHistoricalDate] = useState(localDateISO());
  const [historicalPayload, setHistoricalPayload] = useState("{}");
  const [historicalFieldValues, setHistoricalFieldValues] = useState({});
  const [historicalFeedItemId, setHistoricalFeedItemId] = useState("");
  const [historicalSaving, setHistoricalSaving] = useState(false);
  const [historicalError, setHistoricalError] = useState("");
  const [historicalMessage, setHistoricalMessage] = useState("");
  const [editingBatch, setEditingBatch] = useState(null);
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
  const submittedMessageRef = useRef(null);
  const [entitiesVisible, setEntitiesVisible] = useState(false);
  const entitiesSectionRef = useRef(null);

  useEffect(() => {
    if (!submitted || !submittedMessageRef.current) {
      return;
    }

    gsap.fromTo(
      submittedMessageRef.current,
      {
        opacity: 0,
        y: 8,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: "power3.out",
      },
    );
  }, [submitted]);

  useEffect(() => {
    const element = entitiesSectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setEntitiesVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setLoadError("");

      const [entitiesRes, itemsRes, logsRes, projectsRes] = await Promise.all([
        supabase
          .from("farm_entities")
          .select(
            "id, label, quantity, species_config:species_config_id(id, name, category, capabilities)",
          )
          .eq("status", "active")
          .order("label"),
        supabase.from("inventory_items").select("*").order("name"),
        supabase
          .from("daily_log_batches")
          .select(
            "id, log_date, event_data, expense_data, content_data, created_at",
          )
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from("farm_projects").select("id, name").order("name"),
      ]);

      if (entitiesRes.error) {
        setLoadError(entitiesRes.error.message);
        setLoading(false);
        return;
      }

      if (itemsRes.error) {
        setLoadError(itemsRes.error.message);
        setLoading(false);
        return;
      }

      if (logsRes.error) {
        setLoadError(`Could not load recorded logs: ${logsRes.error.message}`);
        setLoading(false);
        return;
      }
      if (projectsRes.error) {
        setLoadError(`Could not load projects: ${projectsRes.error.message}`);
        setLoading(false);
        return;
      }
      setEntities(entitiesRes.data ?? []);
      setInventoryItems(itemsRes.data ?? []);
      setRecordedLogs(logsRes.data ?? []);
      setProjects(projectsRes.data ?? []);
      // Historical events are deliberately not fetched until the user applies filters.
      setHistoricalEvents([]);
      setLoading(false);
    }

    load();
  }, []);

  async function loadHistoricalEvents(e) {
    e?.preventDefault();
    setHistoricalLoadMessage("");
    if (!historicalFromDate && !historicalToDate && !historicalProjectId) {
      setHistoricalLoadMessage(
        "Choose a date range or a project before loading historical activities.",
      );
      return;
    }
    if (
      historicalFromDate &&
      historicalToDate &&
      historicalFromDate > historicalToDate
    ) {
      setHistoricalLoadMessage(
        "The start date must be on or before the end date.",
      );
      return;
    }

    setHistoricalLoading(true);
    setHistoricalFilterApplied(true);
    try {
      const { data, error } = await supabase.rpc(
        "list_historical_daily_events",
        {
          p_limit: 200,
          p_from_date: historicalFromDate || null,
          p_to_date: historicalToDate || null,
          p_project_id: historicalProjectId || null,
        },
      );
      if (error) throw error;
      setHistoricalEvents(data ?? []);
      setHistoricalLoadMessage(
        data?.length
          ? `Loaded ${data.length} historical activit${data.length === 1 ? "y" : "ies"}.`
          : "No historical activities match these filters.",
      );
    } catch (err) {
      setHistoricalEvents([]);
      setHistoricalLoadMessage(
        err.message ?? "Could not load historical activities.",
      );
    } finally {
      setHistoricalLoading(false);
    }
  }

  function clearHistoricalFilters() {
    setHistoricalFromDate("");
    setHistoricalToDate(localDateISO());
    setHistoricalProjectId("");
    setHistoricalEvents([]);
    setHistoricalFilterApplied(false);
    setHistoricalLoadMessage("");
  }

  function updateEntityField(entityId, fieldKey, value) {
    setEntityValues((prev) => ({
      ...prev,
      [entityId]: { ...prev[entityId], [fieldKey]: value },
    }));
  }

  function startEditing(log) {
    const events = Array.isArray(log.event_data) ? log.event_data : [];
    const nextValues = {};
    const nextFeedItems = {};
    for (const event of events) {
      const entityId = event.entity_id;
      const payload = event.payload ?? {};
      const current = nextValues[entityId] ?? {};
      if (event.type === "feed_given") {
        current.feed_kg = payload.qty_kg ?? "";
        if (payload.item_id) nextFeedItems[entityId] = payload.item_id;
      } else if (event.type === "egg_count")
        current.egg_count = payload.count ?? "";
      else if (event.type === "weight_check")
        current.weight_kg = payload.kg ?? "";
      else if (event.type === "harvest")
        current.harvest_kg = payload.qty_kg ?? "";
      else if (event.type === "mortality")
        current.mortality = payload.count ?? "";
      else if (event.type === "note") current.note = payload.text ?? "";
      nextValues[entityId] = current;
    }
    setEditingBatch(log);
    setDate(log.log_date);
    setEntityValues(nextValues);
    setFeedItemSelection(nextFeedItems);
    setExpense(
      log.expense_data
        ? {
            amount: String(log.expense_data.amount ?? ""),
            category: log.expense_data.category ?? "",
            entityId: log.expense_data.entity_id ?? "",
          }
        : { amount: "", category: "", entityId: "" },
    );
    const notes = log.content_data?.notes ?? "";
    const photoMatch = notes.match(/(\d+) photos?/i);
    const videoMatch = notes.match(/(\d+) videos?/i);
    setContent({
      photos: photoMatch?.[1] ?? "",
      videos: videoMatch?.[1] ?? "",
      note: notes
        .replace(/\d+ photos?,? ?/i, "")
        .replace(/\d+ videos?,? ?/i, "")
        .replace(/^—\s*/, ""),
    });
    setSubmitError("");
    setSubmitWarning("");
    setSubmitted(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingBatch(null);
    setEntityValues({});
    setFeedItemSelection({});
    setExpense({ amount: "", category: "", entityId: "" });
    setContent({ photos: "", videos: "", note: "" });
    setDate(localDateISO());
    setSubmitError("");
    setSubmitWarning("");
    setSubmitted(false);
  }

  function startEditingHistorical(event) {
    setEditingHistorical(event);
    setHistoricalEntityId(event.entity_id ?? "");
    setHistoricalType(event.event_type ?? "");
    setHistoricalDate(String(event.occurred_at ?? localDateISO()).slice(0, 10));
    const payload = event.payload ?? {};
    setHistoricalPayload(JSON.stringify(payload, null, 2));
    const fieldValues = { ...payload };
    if (
      event.event_type === "mortality" &&
      fieldValues.quantity == null &&
      fieldValues.count != null
    )
      fieldValues.quantity = fieldValues.count;
    if (
      event.event_type === "harvest" &&
      fieldValues.quantity == null &&
      fieldValues.qty_kg != null
    )
      fieldValues.quantity = fieldValues.qty_kg;
    setHistoricalFieldValues(
      Object.fromEntries(
        Object.entries(fieldValues).map(([key, value]) => [
          key,
          value == null ? "" : String(value),
        ]),
      ),
    );
    setHistoricalFeedItemId(payload.item_id ?? "");
    setHistoricalError("");
    setHistoricalMessage("");
  }

  function cancelEditingHistorical() {
    setEditingHistorical(null);
    setHistoricalError("");
    setHistoricalMessage("");
  }

  async function saveHistoricalEvent(e) {
    e.preventDefault();
    setHistoricalError("");
    setHistoricalMessage("");
    if (!editingHistorical) return;
    let parsedPayload;
    const schema = EVENT_SCHEMAS[historicalType];
    if (schema?.fields?.length) {
      parsedPayload = { ...(editingHistorical.payload ?? {}) };
      for (const field of schema.fields) {
        const raw = historicalFieldValues[field.key] ?? "";
        if (raw === "" && field.validation?.optional) {
          delete parsedPayload[field.key];
          continue;
        }
        if (raw === "" && field.type === "number") {
          setHistoricalError(`${field.label} is required.`);
          return;
        }
        if (field.type === "number") {
          const numeric = Number(raw);
          if (!Number.isFinite(numeric)) {
            setHistoricalError(`${field.label} must be a valid number.`);
            return;
          }
          if (
            field.validation?.minExclusive &&
            numeric <= Number(field.min ?? 0)
          ) {
            setHistoricalError(
              `${field.label} must be greater than ${field.min ?? 0}.`,
            );
            return;
          }
          if (
            !field.minExclusive &&
            field.min != null &&
            numeric < Number(field.min)
          ) {
            setHistoricalError(`${field.label} must be at least ${field.min}.`);
            return;
          }
          parsedPayload[field.key] = numeric;
        } else if (raw !== "") {
          parsedPayload[field.key] = raw;
        } else {
          delete parsedPayload[field.key];
        }
      }
      if (historicalType === "feed_given" || historicalType === "feed") {
        if (!historicalFeedItemId) {
          setHistoricalError(
            "Select an inventory item for this feed activity.",
          );
          return;
        }
        parsedPayload.item_id = historicalFeedItemId;
      }
    } else {
      try {
        parsedPayload = JSON.parse(historicalPayload);
      } catch {
        setHistoricalError("Payload must be valid JSON.");
        return;
      }
      if (
        !parsedPayload ||
        Array.isArray(parsedPayload) ||
        typeof parsedPayload !== "object"
      ) {
        setHistoricalError(
          'Payload must be a JSON object, such as {"count": 12}.',
        );
        return;
      }
    }
    if (!navigator.onLine) {
      setHistoricalError(
        "Editing a historical activity requires an internet connection.",
      );
      return;
    }
    setHistoricalSaving(true);
    try {
      const { data, error } = await supabase.rpc(
        "edit_historical_daily_event",
        {
          p_event_id: editingHistorical.event_id,
          p_entity_id: historicalEntityId,
          p_event_type: historicalType,
          p_payload: parsedPayload,
          p_occurred_at: historicalDate,
        },
      );
      if (error) throw error;
      const { data: refreshed, error: refreshError } = await supabase.rpc(
        "list_historical_daily_events",
        {
          p_limit: 200,
          p_from_date: historicalFromDate || null,
          p_to_date: historicalToDate || null,
          p_project_id: historicalProjectId || null,
        },
      );
      if (refreshError) throw refreshError;
      setHistoricalEvents(refreshed ?? []);
      setEditingHistorical(null);
      const shortfalls = data?.shortfalls ?? [];
      setHistoricalMessage(
        shortfalls.length
          ? `Activity updated, but inventory was short: ${shortfalls.map((x) => `${x.item_name}: ${Number(x.shortfall).toFixed(2)}`).join("; ")}.`
          : "Historical activity updated.",
      );
    } catch (err) {
      setHistoricalError(
        err.message ?? "Could not update historical activity.",
      );
    } finally {
      setHistoricalSaving(false);
    }
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
        feedItemSelection,
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
        setSubmitError("Add at least one activity, expense, or content entry.");
        return;
      }

      if (validationErrors.length > 0) {
        setSubmitError(validationErrors[0]);
        return;
      }

      // Edits must run transactionally online; never queue them as a new log.
      if (editingBatch && !navigator.onLine) {
        setSubmitError(
          "Editing a recorded log requires an internet connection. Reconnect and try again.",
        );
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

      const rpcName = editingBatch ? "edit_daily_log" : "process_daily_log";
      const rpcArgs = editingBatch
        ? {
            p_batch_id: editingBatch.id,
            p_events: allRows,
            p_expense: expenseRow,
            p_content: contentRow,
          }
        : { p_events: allRows, p_expense: expenseRow, p_content: contentRow };
      const { data, error } = await supabase.rpc(rpcName, rpcArgs);
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
      setFeedItemSelection({});
      setExpense({ amount: "", category: "", entityId: "" });
      setContent({ photos: "", videos: "", note: "" });
      setEditingBatch(null);
      const { data: freshLogs, error: freshLogsError } = await supabase
        .from("daily_log_batches")
        .select(
          "id, log_date, event_data, expense_data, content_data, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(30);
      if (!freshLogsError) setRecordedLogs(freshLogs ?? []);
      if (historicalFilterApplied) {
        const { data: refreshedHistorical } = await supabase.rpc(
          "list_historical_daily_events",
          {
            p_limit: 200,
            p_from_date: historicalFromDate || null,
            p_to_date: historicalToDate || null,
            p_project_id: historicalProjectId || null,
          },
        );
        if (refreshedHistorical) setHistoricalEvents(refreshedHistorical);
      }
      setSubmitted(true);
    } catch (err) {
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
      <section className="border-b border-border/60 pb-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <ClipboardList className="size-4 text-primary" />
              <span>Farm operations</span>
            </div>

            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
                Daily Log
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Record farm activity, expenses, and content in one durable daily
                log.
              </p>
            </div>
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
      </section>

      {entities.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">
              No active farm entities yet — register some in the database before
              logging against them.
            </p>
          </CardContent>
        </Card>
      ) : canEdit ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div ref={entitiesSectionRef} className="space-y-4">
            {entities.map((entity, index) => {
              const capabilities = entity.species_config?.capabilities ?? {};
              const fields = getQuickFieldsForCapabilities(capabilities);
              const values = entityValues[entity.id] ?? {};

              return (
                <Card
                  key={entity.id}
                  className={`daily-log-entity-card ${
                    entitiesVisible ? "daily-log-entity-card-visible" : ""
                  } border-border/70 bg-card shadow-sm`}
                  style={{ "--delay": `${index * 80}ms` }}
                >
                  <CardHeader className="border-b border-border/50 bg-muted/[0.18] px-5 py-4 sm:px-6">
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

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/[0.18] px-5 py-4 sm:px-6">
              <CardTitle className="text-base">
                {editingBatch ? "Edit log expense" : "Today's expense"}{" "}
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

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/[0.18] px-5 py-4 sm:px-6">
              <CardTitle className="text-base">
                {editingBatch ? "Edit log content" : "Today's content"}{" "}
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
            <div className="daily-log-feedback rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          {submitWarning && (
            <div className="daily-log-feedback rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
              {submitWarning}
            </div>
          )}

          {submitted && (
            <div
              ref={submittedMessageRef}
              className="rounded-lg border border-forest/20 bg-forest/5 px-4 py-3 text-sm text-forest"
            >
              Saved today's log.
            </div>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className={`w-full sm:w-auto ${
              submitting ? "daily-log-submit-loading" : ""
            }`}
          >
            {submitting
              ? "Saving…"
              : editingBatch
                ? "Save changes"
                : "Save today's log"}
          </Button>
          {editingBatch && (
            <Button
              type="button"
              variant="outline"
              onClick={cancelEditing}
              disabled={submitting}
              className="ml-2"
            >
              <X className="mr-2 size-4" /> Cancel edit
            </Button>
          )}
        </form>
      ) : null}

      {canEdit && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Recorded Logs</h2>
            <p className="text-sm text-muted-foreground">
              New logs recorded after the editing migration appear here.
              Historical logs are not included.
            </p>
          </div>
          {recordedLogs.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                No editable daily logs recorded yet.
              </CardContent>
            </Card>
          ) : (
            recordedLogs.map((log) => (
              <Card key={log.id} className="border-border/70">
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">Daily log — {log.log_date}</p>
                    <p className="text-sm text-muted-foreground">
                      {Array.isArray(log.event_data)
                        ? log.event_data.length
                        : 0}{" "}
                      activities{log.expense_data ? " · Expense recorded" : ""}
                      {log.content_data ? " · Content recorded" : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => startEditing(log)}
                  >
                    <Pencil className="mr-2 size-4" /> Edit
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </section>
      )}

      {canEdit && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Historical Activities</h2>
            <p className="text-sm text-muted-foreground">
              Older individual activity records are listed separately. This
              editor does not change historical Finance expenses or content
              entries. Feed edits are blocked when reconciliation history makes
              stock changes unsafe.
            </p>
          </div>
          <Card className="border-border/70">
            <CardContent className="space-y-4 py-4">
              <form
                onSubmit={loadHistoricalEvents}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                  From date
                  <Input
                    type="date"
                    value={historicalFromDate}
                    max={historicalToDate || undefined}
                    onChange={(e) => setHistoricalFromDate(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                  To date
                  <Input
                    type="date"
                    value={historicalToDate}
                    min={historicalFromDate || undefined}
                    onChange={(e) => setHistoricalToDate(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                  Project
                  <select
                    value={historicalProjectId}
                    onChange={(e) => setHistoricalProjectId(e.target.value)}
                    className="min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">All projects</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end gap-2">
                  <Button type="submit" disabled={historicalLoading}>
                    {historicalLoading ? "Loading…" : "Apply filters"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearHistoricalFilters}
                    disabled={historicalLoading}
                  >
                    Clear
                  </Button>
                </div>
              </form>
              <p className="text-xs text-muted-foreground">
                Select a date range and/or project. Historical activities are
                fetched only after you apply filters.
              </p>
              {historicalLoadMessage && (
                <p className="text-sm text-muted-foreground">
                  {historicalLoadMessage}
                </p>
              )}
              {historicalMessage && (
                <p className="rounded-lg border border-forest/20 bg-forest/5 px-4 py-3 text-sm text-forest">
                  {historicalMessage}
                </p>
              )}
            </CardContent>
          </Card>
          {!historicalFilterApplied ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                Choose a date range or project, then apply filters to load
                historical activities.
              </CardContent>
            </Card>
          ) : historicalEvents.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                {historicalLoading
                  ? "Loading historical activities…"
                  : "No historical activities match these filters."}
              </CardContent>
            </Card>
          ) : (
            historicalEvents.map((event) => (
              <Card key={event.event_id} className="border-border/70">
                <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {event.entity_label || "Unknown entity"} ·{" "}
                      {event.event_type}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {String(event.occurred_at).slice(0, 10)} ·{" "}
                      {formatHistoricalPayload(event, inventoryItems)}
                      {event.has_inventory_consumption
                        ? " · Inventory consumption linked"
                        : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => startEditingHistorical(event)}
                  >
                    <Pencil className="mr-2 size-4" /> Edit activity
                  </Button>
                </CardContent>
                {editingHistorical?.event_id === event.event_id && (
                  <CardContent className="border-t border-border/60">
                    <form className="space-y-4" onSubmit={saveHistoricalEvent}>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                          Entity
                          <select
                            value={historicalEntityId}
                            onChange={(e) =>
                              setHistoricalEntityId(e.target.value)
                            }
                            required
                            className="min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            {historicalEntityId &&
                              !entities.some(
                                (entity) => entity.id === historicalEntityId,
                              ) && (
                                <option value={historicalEntityId}>
                                  {editingHistorical.entity_label ||
                                    "Previously assigned entity"}
                                </option>
                              )}
                            {entities.map((entity) => (
                              <option key={entity.id} value={entity.id}>
                                {entity.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                          Activity type
                          <Input
                            value={historicalType}
                            onChange={(e) => setHistoricalType(e.target.value)}
                            required
                          />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                          Date
                          <Input
                            type="date"
                            value={historicalDate}
                            onChange={(e) => setHistoricalDate(e.target.value)}
                            required
                          />
                        </label>
                      </div>
                      {EVENT_SCHEMAS[historicalType]?.fields?.length ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {EVENT_SCHEMAS[historicalType].fields.map((field) => (
                            <label
                              key={field.key}
                              className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground"
                            >
                              <span>
                                {field.label}
                                {field.unit ? ` (${field.unit})` : ""}
                              </span>
                              <Input
                                type={
                                  field.type === "number" ? "number" : "text"
                                }
                                inputMode={
                                  field.type === "number"
                                    ? "decimal"
                                    : undefined
                                }
                                min={field.min}
                                step={
                                  field.step ??
                                  (field.type === "number" ? "any" : undefined)
                                }
                                placeholder={field.placeholder ?? ""}
                                value={historicalFieldValues[field.key] ?? ""}
                                onChange={(e) =>
                                  setHistoricalFieldValues((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                required={
                                  field.type === "number" &&
                                  !field.validation?.optional
                                }
                              />
                            </label>
                          ))}
                          {(historicalType === "feed_given" ||
                            historicalType === "feed") && (
                            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                              <span>Feed item</span>
                              <select
                                value={historicalFeedItemId}
                                onChange={(e) =>
                                  setHistoricalFeedItemId(e.target.value)
                                }
                                required
                                className="min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                              >
                                <option value="">Select inventory item…</option>
                                {inventoryItems.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                                {historicalFeedItemId &&
                                  !inventoryItems.some(
                                    (item) => item.id === historicalFeedItemId,
                                  ) && (
                                    <option value={historicalFeedItemId}>
                                      {editingHistorical?.payload?.item_id ??
                                        "Previously selected item"}
                                    </option>
                                  )}
                              </select>
                            </label>
                          )}
                        </div>
                      ) : (
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                          Payload (JSON)
                          <textarea
                            value={historicalPayload}
                            onChange={(e) =>
                              setHistoricalPayload(e.target.value)
                            }
                            rows={5}
                            required
                            spellCheck={false}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                          />
                        </label>
                      )}
                      {historicalError && (
                        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                          {historicalError}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" disabled={historicalSaving}>
                          <Save className="mr-2 size-4" />
                          {historicalSaving ? "Saving…" : "Save activity"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEditingHistorical}
                          disabled={historicalSaving}
                        >
                          <X className="mr-2 size-4" />
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </section>
      )}
    </div>
  );
}

export default DailyLog;
