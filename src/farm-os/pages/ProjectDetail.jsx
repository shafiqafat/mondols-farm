import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  Pencil,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate, useParams } from "react-router-dom";
import { getEventDisplayLabel } from "../lib/eventUtils";
import { computeExpectedHarvest } from "../engines/cropForecastEngine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { canWrite } from "../lib/permissions";

function buildProductionMetrics(events) {
  const summary = {
    feedKg: 0,
    eggs: 0,
    harvestKg: 0,
    mortality: 0,
    latestWeightKg: null,
  };

  const weightEvents = [];

  for (const event of events) {
    const payload = event.payload ?? {};

    switch (event.type) {
      case "feed_given":
      case "Feed_given":
        summary.feedKg += Number(payload.qty_kg || 0);
        break;

      case "egg_count":
      case "Egg_count":
      case "egg_production":
        summary.eggs += Number(payload.count || 0);
        break;

      case "harvest":
        summary.harvestKg += Number(payload.qty_kg || 0);
        break;

      case "mortality":
        summary.mortality += Number(payload.count || 0);
        break;

      case "weight_check":
      case "weight":
        if (payload.kg != null) {
          weightEvents.push({
            value: Number(payload.kg),
            date: event.occurred_at,
          });
        }
        break;

      default:
        break;
    }
  }

  weightEvents.sort((a, b) => new Date(b.date) - new Date(a.date));

  summary.latestWeightKg =
    weightEvents.length > 0 ? weightEvents[0].value : null;

  return summary;
}

function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const canEdit = canWrite(role);

  const [project, setProject] = useState(null);
  const [assignedEntities, setAssignedEntities] = useState([]);
  const [availableEntities, setAvailableEntities] = useState([]);
  const [allEntities, setAllEntities] = useState([]);
  const [projectTransactions, setProjectTransactions] = useState([]);
  const [inventoryConsumptions, setInventoryConsumptions] = useState([]);
  const [projectEntityHistory, setProjectEntityHistory] = useState([]);
  const [projectEvents, setProjectEvents] = useState([]);
  const [selectedTrend, setSelectedTrend] = useState("auto");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState("30");
  const [selectedEntityId, setSelectedEntityId] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchProject() {
      const [
        projectResult,
        assignmentsResult,
        entitiesResult,
        transactionsResult,
        inventoryConsumptionsResult,
        projectEntityHistoryResult,
      ] = await Promise.all([
        supabase.from("farm_projects").select("*").eq("id", id).single(),

        supabase
          .from("farm_project_entities")
          .select("entity_id, started_at, ended_at")
          .eq("project_id", id)
          .order("started_at", { ascending: false }),

        supabase
          .from("farm_entities")
          .select(
            "id, label, quantity, status, location, tracking_mode, species_config:species_config_id(name, category, space_unit)",
          )
          .is("archived_at", null)
          .order("label"),

        supabase
          .from("finance_transactions")
          .select("id, type, amount, occurred_at")
          .eq("project_id", id)
          .order("occurred_at", { ascending: false }),

        supabase
          .from("inventory_consumptions")
          .select(
            `id, entity_events!inner (entity_id, occurred_at), total_cost`,
          ),

        supabase
          .from("farm_project_entities")
          .select("project_id, entity_id, started_at, ended_at"),
      ]);

      if (cancelled) return;

      if (projectResult.error) {
        setPageError(projectResult.error.message);
        setProject(null);
        setLoading(false);
        return;
      }

      if (assignmentsResult.error) {
        setPageError(assignmentsResult.error.message);
        setLoading(false);
        return;
      }

      if (entitiesResult.error) {
        setPageError(entitiesResult.error.message);
        setLoading(false);
        return;
      }

      if (transactionsResult.error) {
        setPageError(transactionsResult.error.message);
        setLoading(false);
        return;
      }

      if (inventoryConsumptionsResult.error) {
        setPageError(inventoryConsumptionsResult.error.message);
        setLoading(false);
        return;
      }

      if (projectEntityHistoryResult.error) {
        setPageError(projectEntityHistoryResult.error.message);
        setLoading(false);
        return;
      }

      const assignments = assignmentsResult.data ?? [];
      const entities = entitiesResult.data ?? [];
      const transactions = transactionsResult.data ?? [];
      const inventoryConsumptionRows = inventoryConsumptionsResult.data ?? [];
      const projectEntityHistoryRows = projectEntityHistoryResult.data ?? [];

      setAllEntities(entities);
      const activeAssignments = assignments.filter(
        (assignment) => assignment.ended_at === null,
      );

      const assignedIds = new Set(
        activeAssignments.map((assignment) => assignment.entity_id),
      );

      setProject(projectResult.data);

      setAssignedEntities(
        entities.filter((entity) => assignedIds.has(entity.id)),
      );

      setProjectTransactions(transactions);
      setInventoryConsumptions(inventoryConsumptionRows);
      setProjectEntityHistory(projectEntityHistoryRows);
      const projectEntityIds = [
        ...new Set(
          projectEntityHistoryRows
            .filter((assignment) => assignment.project_id === id)
            .map((assignment) => assignment.entity_id),
        ),
      ];

      if (projectEntityIds.length > 0) {
        const { data: eventRows, error: eventsError } = await supabase
          .from("entity_events")
          .select("id, entity_id, type, payload, occurred_at, created_at")
          .in("entity_id", projectEntityIds)
          .order("occurred_at", { ascending: false });

        if (eventsError) {
          setPageError(eventsError.message);
          setLoading(false);
          return;
        }

        setProjectEvents(eventRows ?? []);
      } else {
        setProjectEvents([]);
      }

      const assignedElsewhereIds = new Set(
        projectEntityHistoryRows
          .filter(
            (assignment) =>
              assignment.project_id !== id && assignment.ended_at === null,
          )
          .map((assignment) => assignment.entity_id),
      );

      setAvailableEntities(
        entities.filter(
          (entity) =>
            entity.status === "active" &&
            !assignedIds.has(entity.id) &&
            !assignedElsewhereIds.has(entity.id),
        ),
      );

      setLoading(false);
    }

    fetchProject();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  async function handleCompleteProject() {
    if (!project?.id || project.status !== "active") return;

    const confirmed = window.confirm(
      `Complete "${project.name}"?\n\nActive entity assignments will be ended, but all project history will be preserved.`,
    );

    if (!confirmed) return;

    setCompleting(true);
    setPageError("");

    const { error } = await supabase.rpc("complete_project", {
      p_project_id: project.id,
    });

    setCompleting(false);

    if (error) {
      setPageError(error.message);
      return;
    }

    setProject((current) =>
      current
        ? {
            ...current,
            status: "completed",
          }
        : current,
    );

    setAssignedEntities([]);
  }

  async function handleAssignEntity() {
    if (!selectedEntityId || !project?.id || project.status !== "active") {
      return;
    }

    setAssigning(true);
    setPageError("");

    const { error } = await supabase.rpc("assign_entity_to_project", {
      p_entity_id: selectedEntityId,
      p_project_id: project.id,
      p_role: "primary",
      p_started_at: new Date().toLocaleDateString("en-CA"),
      p_allow_transfer: false,
    });

    if (error) {
      setPageError(error.message);
      setAssigning(false);
      return;
    }

    setSelectedEntityId("");

    const { data: assignments, error: assignmentsError } = await supabase
      .from("farm_project_entities")
      .select("entity_id, started_at, ended_at")
      .eq("project_id", project.id)
      .is("ended_at", null);

    if (assignmentsError) {
      setPageError(assignmentsError.message);
      setAssigning(false);
      return;
    }

    const assignedIds = new Set(
      (assignments ?? []).map((assignment) => assignment.entity_id),
    );

    setAssignedEntities((current) =>
      [
        ...current,
        ...availableEntities.filter((entity) => assignedIds.has(entity.id)),
      ].filter(
        (entity, index, array) =>
          array.findIndex((item) => item.id === entity.id) === index,
      ),
    );

    setAvailableEntities((current) =>
      current.filter((entity) => !assignedIds.has(entity.id)),
    );

    setProjectEntityHistory((current) => [
      ...current.filter(
        (assignment) =>
          !(
            assignment.project_id === project.id &&
            assignment.entity_id === selectedEntityId &&
            assignment.ended_at === null
          ),
      ),
      {
        project_id: project.id,
        entity_id: selectedEntityId,
        started_at: new Date().toLocaleDateString("en-CA"),
        ended_at: null,
      },
    ]);

    setAssigning(false);
  }

  async function handleUnassignEntity(entityId) {
    if (!entityId || !project?.id) return;

    const entity =
      assignedEntities.find((item) => item.id === entityId) ||
      availableEntities.find((item) => item.id === entityId);

    if (!entity) return;

    const confirmed = window.confirm(
      `Remove "${entity.label}" from this project?\n\nThe assignment will be ended, but its history will be preserved.`,
    );

    if (!confirmed) return;

    setPageError("");

    const { error } = await supabase
      .from("farm_project_entities")
      .update({
        ended_at: new Date().toLocaleDateString("en-CA"),
      })
      .eq("project_id", project.id)
      .eq("entity_id", entityId)
      .is("ended_at", null);

    if (error) {
      setPageError(error.message);
      return;
    }

    setAssignedEntities((current) =>
      current.filter((item) => item.id !== entityId),
    );

    const hasActiveAssignmentElsewhere = projectEntityHistory.some(
      (assignment) =>
        assignment.entity_id === entityId &&
        assignment.project_id !== project.id &&
        assignment.ended_at === null,
    );

    if (entity.status === "active" && !hasActiveAssignmentElsewhere) {
      setAvailableEntities((current) =>
        current.some((item) => item.id === entityId)
          ? current
          : [...current, entity].sort((a, b) => a.label.localeCompare(b.label)),
      );
    }
  }

  if (pageError || !project) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          className="rounded-xl"
          onClick={() => navigate("/farm-os/projects")}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to projects
        </Button>

        <Card className="rounded-2xl border-destructive/30">
          <CardContent className="p-6">
            <p className="text-sm text-destructive">
              {pageError || "Project not found."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const projectRevenue = projectTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const directProjectCost = projectTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const projectConsumedInventoryCost = inventoryConsumptions
    .filter((consumption) => {
      const entityId = consumption.entity_events?.entity_id;
      const occurredAt = consumption.entity_events?.occurred_at;

      if (!entityId || !occurredAt) {
        return false;
      }

      return getProjectIdAtDate(entityId, occurredAt) === project.id;
    })
    .reduce((sum, consumption) => sum + Number(consumption.total_cost || 0), 0);

  const projectOperatingCost = directProjectCost + projectConsumedInventoryCost;

  const projectMargin = projectRevenue - projectOperatingCost;

  const projectExpenseTransactions = projectTransactions.filter(
    (transaction) => transaction.type === "expense",
  );

  const projectIncomeTransactions = projectTransactions.filter(
    (transaction) => transaction.type === "income",
  );

  const economicsComparison = [
    {
      label: "Revenue",
      value: projectRevenue,
    },
    {
      label: "Operating cost",
      value: projectOperatingCost,
    },
  ];

  function getProjectIdAtDate(entityId, date) {
    const relationship = projectEntityHistory.find(
      (item) =>
        item.entity_id === entityId &&
        item.started_at <= date &&
        (item.ended_at === null || date < item.ended_at),
    );

    return relationship?.project_id ?? null;
  }

  const projectActivityEvents = projectEvents.filter((event) => {
    const relationship = projectEntityHistory.find(
      (item) =>
        item.entity_id === event.entity_id &&
        item.project_id === project.id &&
        item.started_at <= event.occurred_at &&
        (item.ended_at === null || event.occurred_at < item.ended_at),
    );

    return Boolean(relationship);
  });

  const productionSummary = {
    totalEvents: projectActivityEvents.length,
    ...buildProductionMetrics(projectActivityEvents),
  };

  // Crop and fodder entities are shown as independent production cycles.
  const cropCycles = assignedEntities
    .filter((entity) =>
      ["crop", "fodder"].includes(entity.species_config?.category),
    )
    .map((entity) => {
      const entityEvents = projectActivityEvents.filter(
        (event) => event.entity_id === entity.id,
      );
      const forecast = computeExpectedHarvest(entityEvents);
      const hasHarvest = entityEvents.some(
        (event) => event.type === "harvest" && !event.reversed_at,
      );

      return {
        ...entity,
        forecast,
        hasHarvest,
      };
    });

  const totalCultivatedArea = cropCycles.reduce((total, crop) => {
    if (crop.tracking_mode !== "area") return total;
    const area = Number(crop.quantity);
    return Number.isFinite(area) && area > 0 ? total + area : total;
  }, 0);

  const productionTrend = projectActivityEvents.reduce((days, event) => {
    const payload = event.payload ?? {};
    const date = event.occurred_at?.slice(0, 10);

    if (!date) return days;

    if (!days[date]) {
      days[date] = {
        date,
        feedKg: 0,
        eggs: 0,
        harvestKg: 0,
      };
    }

    switch (event.type) {
      case "feed_given":
      case "Feed_given":
        days[date].feedKg += Number(payload.qty_kg || 0);
        break;

      case "egg_count":
      case "Egg_count":
      case "egg_production":
        days[date].eggs += Number(payload.count || 0);
        break;

      case "harvest":
        days[date].harvestKg += Number(payload.qty_kg || 0);
        break;

      default:
        break;
    }

    return days;
  }, {});

  const recordedTrendData = Object.values(productionTrend).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const productionTrendData = (() => {
    if (recordedTrendData.length === 0) return [];

    const dailyData = new Map(
      recordedTrendData.map((item) => [item.date, item]),
    );

    const last = new Date();
    last.setHours(12, 0, 0, 0);

    let first;

    if (trendPeriod === "all") {
      first = new Date(`${recordedTrendData[0].date}T12:00:00`);
    } else {
      first = new Date(last);
      first.setDate(first.getDate() - (Number(trendPeriod) - 1));

      const earliestRecorded = new Date(
        `${recordedTrendData[0].date}T12:00:00`,
      );

      if (earliestRecorded > first) {
        first = earliestRecorded;
      }
    }

    const result = [];
    const current = new Date(first);

    while (current <= last) {
      const date = [
        current.getFullYear(),
        String(current.getMonth() + 1).padStart(2, "0"),
        String(current.getDate()).padStart(2, "0"),
      ].join("-");

      result.push(
        dailyData.get(date) ?? {
          date,
          feedKg: 0,
          eggs: 0,
          harvestKg: 0,
        },
      );

      current.setDate(current.getDate() + 1);
    }

    return result;
  })();

  const filteredTrendData = productionTrendData;

  const availableTrends = {
    eggs: filteredTrendData.some((item) => item.eggs > 0),
    harvest: filteredTrendData.some((item) => item.harvestKg > 0),
    feed: filteredTrendData.some((item) => item.feedKg > 0),
  };

  const defaultTrend = availableTrends.eggs
    ? "eggs"
    : availableTrends.harvest
      ? "harvest"
      : availableTrends.feed
        ? "feed"
        : null;

  const trendType =
    selectedTrend === "auto"
      ? defaultTrend
      : availableTrends[selectedTrend]
        ? selectedTrend
        : defaultTrend;

  const trendConfig = {
    eggs: {
      label: "Egg production",
      dataKey: "eggs",
      unit: " eggs",
    },
    harvest: {
      label: "Harvest",
      dataKey: "harvestKg",
      unit: " kg",
    },
    feed: {
      label: "Feed consumption",
      dataKey: "feedKg",
      unit: " kg",
    },
  };

  const activeTrend = trendType ? trendConfig[trendType] : null;

  const isActive = project.status === "active";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-5">
        <div>
          <Button
            variant="ghost"
            className="mb-4 -ml-2 rounded-xl"
            onClick={() => navigate("/farm-os/projects")}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back to projects
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FolderKanban className="size-5" />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {project.name}
                  </h1>

                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {project.status}
                  </Badge>
                </div>

                {project.project_type && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.project_type}
                  </p>
                )}
              </div>
            </div>

            {isActive && canEdit && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() =>
                    navigate(`/farm-os/projects/${project.id}/edit`)
                  }
                >
                  <Pencil className="mr-2 size-4" />
                  Edit project
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={completing}
                  onClick={handleCompleteProject}
                >
                  <CheckCircle2 className="mr-2 size-4" />
                  {completing ? "Completing…" : "Complete project"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/70">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-4" />
              <span className="text-sm">Started</span>
            </div>

            <p className="mt-3 text-lg font-semibold">
              {project.started_at || "Not specified"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarDays className="size-4" />
              <span className="text-sm">Target end</span>
            </div>

            <p className="mt-3 text-lg font-semibold">
              {project.target_end_at || "Not specified"}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4" />
              <span className="text-sm">Entities</span>
            </div>

            <p className="mt-3 text-lg font-semibold">
              {assignedEntities.length}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="size-4" />
              <span className="text-sm">Lifecycle</span>
            </div>

            <p className="mt-3 text-lg font-semibold capitalize">
              {project.status}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Purpose */}
      <Card className="rounded-2xl border-border/70">
        <CardHeader>
          <CardTitle className="text-lg">Project purpose</CardTitle>
        </CardHeader>

        <CardContent>
          {project.purpose ? (
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              {project.purpose}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No project purpose has been recorded yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Crop cycle overview */}
      {cropCycles.length > 0 && (
        <Card className="rounded-2xl border-border/70">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">
                  Crop production overview
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Each crop entity represents a separate crop or growing cycle.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border/60 px-3 py-1">
                  {cropCycles.length} crop cycle
                  {cropCycles.length === 1 ? "" : "s"}
                </span>
                {cropCycles.some((crop) => crop.tracking_mode === "area") && (
                  <span className="rounded-full border border-border/60 px-3 py-1">
                    {totalCultivatedArea.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    total area units
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {cropCycles.map((crop) => (
                <div
                  key={crop.id}
                  className="rounded-xl border border-border/60 bg-muted/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {crop.label}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {crop.species_config?.name || "Crop"}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 capitalize">
                      {crop.hasHarvest
                        ? "Harvest recorded"
                        : crop.status || "Active"}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        Cultivated area
                      </span>
                      <span className="font-medium">
                        {crop.tracking_mode === "area" && crop.quantity != null
                          ? `${crop.quantity} ${crop.species_config?.space_unit || "area units"}`
                          : "Not recorded as area"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">Planted</span>
                      <span className="text-right font-medium">
                        {crop.forecast?.plantedAt || "Not recorded"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        Expected harvest
                      </span>
                      <span className="text-right font-medium">
                        {crop.forecast?.expectedHarvestDate || "Not available"}
                      </span>
                    </div>
                    {crop.forecast?.expectedDurationDays && (
                      <p className="text-xs text-muted-foreground">
                        Estimated growing duration:{" "}
                        {crop.forecast.expectedDurationDays} days
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full rounded-lg"
                    onClick={() => navigate(`/farm-os/entities/${crop.id}`)}
                  >
                    View crop history
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project areas */}
      <div className="grid items-start gap-4">
        <Card className="rounded-2xl border-border/70">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg">Assigned entities</CardTitle>

              <span className="text-xs text-muted-foreground">
                {assignedEntities.length} assigned
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {assignedEntities.length > 0 ? (
              <div className="space-y-2">
                {assignedEntities.map((entity) => (
                  <div
                    key={entity.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {entity.label}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {entity.species_config?.name && (
                          <span>{entity.species_config.name}</span>
                        )}

                        {entity.quantity != null && (
                          <span>· Qty {entity.quantity}</span>
                        )}

                        {entity.status && (
                          <Badge
                            variant="secondary"
                            className="h-5 px-1.5 text-[10px] capitalize"
                          >
                            {entity.status}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {isActive && canEdit && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 rounded-lg text-muted-foreground hover:text-destructive"
                        onClick={() => handleUnassignEntity(entity.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-5 text-center">
                <p className="text-sm font-medium">No entities assigned</p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Assign animals, crops, or other farm entities to connect their
                  activity with this project.
                </p>
              </div>
            )}

            {isActive && canEdit && availableEntities.length > 0 && (
              <div className="border-t border-border/60 pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Assign an entity
                </p>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={selectedEntityId}
                    onChange={(event) =>
                      setSelectedEntityId(event.target.value)
                    }
                    disabled={assigning}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <option value="">Select entity…</option>

                    {availableEntities.map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.label}
                        {entity.species_config?.name
                          ? ` — ${entity.species_config.name}`
                          : ""}
                      </option>
                    ))}
                  </select>

                  <Button
                    type="button"
                    className="h-10 rounded-lg"
                    disabled={!selectedEntityId || assigning}
                    onClick={handleAssignEntity}
                  >
                    {assigning ? "Assigning…" : "Assign"}
                  </Button>
                </div>
              </div>
            )}

            {isActive && canEdit && availableEntities.length === 0 && (
              <div className="border-t border-border/60 pt-4">
                <p className="text-xs leading-5 text-muted-foreground">
                  There are no other unassigned active entities available right
                  now.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70">
          <CardHeader>
            <CardTitle className="text-lg">Production activity</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {projectActivityEvents.length > 0 ? (
              <>
                {/* Production metrics */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Total events
                    </p>

                    <p className="mt-2 text-xl font-semibold">
                      {productionSummary.totalEvents}
                    </p>
                  </div>

                  {productionSummary.feedKg > 0 && (
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Feed consumed
                      </p>

                      <p className="mt-2 text-xl font-semibold">
                        {productionSummary.feedKg.toFixed(2)} kg
                      </p>
                    </div>
                  )}

                  {productionSummary.eggs > 0 && (
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Eggs recorded
                      </p>

                      <p className="mt-2 text-xl font-semibold">
                        {productionSummary.eggs.toLocaleString()}
                      </p>
                    </div>
                  )}

                  {productionSummary.harvestKg > 0 && (
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Harvest
                      </p>

                      <p className="mt-2 text-xl font-semibold">
                        {productionSummary.harvestKg.toFixed(2)} kg
                      </p>
                    </div>
                  )}

                  {productionSummary.latestWeightKg != null && (
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Latest weight
                      </p>

                      <p className="mt-2 text-xl font-semibold">
                        {productionSummary.latestWeightKg < 1
                          ? `${Math.round(productionSummary.latestWeightKg * 1000)} g`
                          : `${productionSummary.latestWeightKg.toFixed(2)} kg`}
                      </p>
                    </div>
                  )}

                  {productionSummary.mortality > 0 && (
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Mortality
                      </p>

                      <p className="mt-2 text-xl font-semibold">
                        {productionSummary.mortality}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid items-start gap-4 lg:grid-cols-2">
                  {(!activeTrend || productionTrendData.length > 1) && (
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {activeTrend?.label ?? "Production trends"}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Daily production activity recorded for this project
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <select
                            value={trendPeriod}
                            onChange={(event) =>
                              setTrendPeriod(event.target.value)
                            }
                            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm sm:w-36"
                            aria-label="Select production date range"
                          >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="all">All history</option>
                          </select>

                          <select
                            value={selectedTrend}
                            onChange={(event) =>
                              setSelectedTrend(event.target.value)
                            }
                            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm sm:w-48"
                            aria-label="Select production trend"
                          >
                            <option value="auto">Automatic selection</option>
                            <option
                              value="eggs"
                              disabled={!availableTrends.eggs}
                            >
                              Egg production
                            </option>
                            <option
                              value="harvest"
                              disabled={!availableTrends.harvest}
                            >
                              Harvest
                            </option>
                            <option
                              value="feed"
                              disabled={!availableTrends.feed}
                            >
                              Feed consumption
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="h-44 w-full">
                        {!activeTrend || filteredTrendData.length === 0 ? (
                          <div className="flex min-h-40 flex-col items-center justify-center text-center">
                            <p className="text-sm font-medium">
                              No production data yet
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              Record production activity to see trends here.
                            </p>
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={filteredTrendData}
                              margin={{
                                top: 8,
                                right: 8,
                                left: 0,
                                bottom: 8,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                className="stroke-border/50"
                              />

                              <XAxis
                                dataKey="date"
                                tickFormatter={(value) =>
                                  new Date(
                                    `${value}T12:00:00`,
                                  ).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })
                                }
                                tickLine={false}
                                axisLine={false}
                                className="text-xs"
                              />

                              <YAxis
                                tickLine={false}
                                axisLine={false}
                                width={52}
                                className="text-xs"
                              />

                              <Tooltip
                                formatter={(value) => [
                                  `${Number(value).toFixed(
                                    activeTrend.dataKey === "eggs" ? 0 : 2,
                                  )}${activeTrend.unit}`,
                                  activeTrend.label,
                                ]}
                                labelFormatter={(value) =>
                                  new Date(
                                    `${value}T12:00:00`,
                                  ).toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                }
                              />

                              <Line
                                type="monotone"
                                dataKey={activeTrend.dataKey}
                                stroke="currentColor"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Recent production events */}
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Recent activity
                      </p>

                      <span className="text-xs text-muted-foreground">
                        {projectActivityEvents.length} events
                      </span>
                    </div>{" "}
                    <div className="space-y-4">
                      {Object.entries(
                        projectActivityEvents
                          .slice(0, showAllActivity ? undefined : 3)
                          .reduce((groups, event) => {
                            const dateKey = event.occurred_at
                              ? event.occurred_at.slice(0, 10)
                              : "unknown";
                            if (!groups[dateKey]) groups[dateKey] = [];
                            groups[dateKey].push(event);
                            return groups;
                          }, {}),
                      ).map(([dateKey, events]) => (
                        <div key={dateKey} className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-medium text-muted-foreground">
                              {dateKey === "unknown"
                                ? "Date not recorded"
                                : new Date(
                                    `${dateKey}T12:00:00`,
                                  ).toLocaleDateString(undefined, {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                            </p>
                            <span className="text-[11px] text-muted-foreground">
                              {events.length}{" "}
                              {events.length === 1 ? "event" : "events"}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {events.map((event) => {
                              const entity = allEntities.find(
                                (item) => item.id === event.entity_id,
                              );
                              const payload = event.payload ?? {};

                              const valueLabel = (() => {
                                switch (event.type) {
                                  case "feed_given":
                                  case "Feed_given":
                                    return payload.qty_kg != null
                                      ? `${Number(payload.qty_kg).toFixed(2)} kg`
                                      : "";
                                  case "weight_check":
                                  case "weight":
                                    return payload.kg != null
                                      ? Number(payload.kg) < 1
                                        ? `${Math.round(Number(payload.kg) * 1000)} g`
                                        : `${Number(payload.kg).toFixed(2)} kg`
                                      : "";
                                  case "egg_count":
                                  case "Egg_count":
                                  case "egg_production":
                                    return payload.count != null
                                      ? `${payload.count} eggs`
                                      : "";
                                  case "mortality":
                                    return payload.count != null
                                      ? `${payload.count} birds`
                                      : "";
                                  default:
                                    return "";
                                }
                              })();

                              return (
                                <div
                                  key={event.id}
                                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-background px-3 py-2"
                                >
                                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Activity className="size-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                      {getEventDisplayLabel(event.type)}
                                    </p>
                                    <p className="truncate text-xs text-muted-foreground">
                                      {event.type === "note" && payload.text
                                        ? payload.text
                                        : entity?.label || "Entity"}
                                    </p>
                                  </div>
                                  {valueLabel && (
                                    <span className="shrink-0 text-xs font-semibold tabular-nums">
                                      {valueLabel}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    {projectActivityEvents.length > 3 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-8 w-full rounded-lg text-xs"
                        onClick={() =>
                          setShowAllActivity((current) => !current)
                        }
                      >
                        {showAllActivity
                          ? "Show less"
                          : `View all activity (${projectActivityEvents.length})`}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/20 px-5 text-center">
                <div>
                  <p className="text-sm font-medium">
                    No production activity yet
                  </p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Events recorded for entities assigned to this project will
                    appear here.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Economics */}
      <Card className="rounded-2xl border-border/70">
        <CardHeader>
          <CardTitle className="text-lg">Project economics</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Revenue
              </p>

              <p className="mt-2 text-lg font-semibold">
                ৳{projectRevenue.toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Direct expenses
              </p>

              <p className="mt-2 text-lg font-semibold">
                ৳{directProjectCost.toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Inventory consumed
              </p>

              <p className="mt-2 text-lg font-semibold">
                ৳{projectConsumedInventoryCost.toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Margin
              </p>

              <p
                className={`mt-2 text-lg font-semibold ${
                  projectMargin >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {projectMargin >= 0 ? "+" : "-"}৳
                {Math.abs(projectMargin).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Revenue vs cost */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="mb-4">
              <p className="text-sm font-medium">Revenue vs operating cost</p>

              <p className="mt-1 text-xs text-muted-foreground">
                Financial position of this project based on recorded
                transactions and inventory consumption.
              </p>
            </div>

            <div className="space-y-4">
              {economicsComparison.map((item) => {
                const maxValue = Math.max(
                  projectRevenue,
                  projectOperatingCost,
                  1,
                );

                const width = Math.min((item.value / maxValue) * 100, 100);

                return (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm text-muted-foreground">
                        {item.label}
                      </span>

                      <span className="text-sm font-medium">
                        ৳{item.value.toFixed(2)}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction breakdown */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Income</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Transactions directly attributed to this project
                  </p>
                </div>

                <span className="text-sm font-semibold">
                  ৳{projectRevenue.toFixed(2)}
                </span>
              </div>

              {projectIncomeTransactions.length > 0 ? (
                <div className="space-y-2">
                  {projectIncomeTransactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm">Income transaction</p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {transaction.occurred_at
                            ? new Date(
                                transaction.occurred_at,
                              ).toLocaleDateString()
                            : "Date not recorded"}
                        </p>
                      </div>

                      <span className="shrink-0 text-sm font-medium">
                        ৳{Number(transaction.amount || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No income transactions recorded.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Direct expenses</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Expenses directly attributed to this project
                  </p>
                </div>

                <span className="text-sm font-semibold">
                  ৳{directProjectCost.toFixed(2)}
                </span>
              </div>

              {projectExpenseTransactions.length > 0 ? (
                <div className="space-y-2">
                  {projectExpenseTransactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm">Expense transaction</p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {transaction.occurred_at
                            ? new Date(
                                transaction.occurred_at,
                              ).toLocaleDateString()
                            : "Date not recorded"}
                        </p>
                      </div>

                      <span className="shrink-0 text-sm font-medium">
                        ৳{Number(transaction.amount || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No direct expenses recorded.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProjectDetail;
