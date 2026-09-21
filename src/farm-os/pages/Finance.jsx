import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { localDateISO } from "../lib/localDate";
import {
  computeTotals,
  computeCostPerUnit,
  splitByPercent,
} from "../engines/financeEngine";
import {
  CircleDollarSign,
  FolderKanban,
  Receipt,
  Split,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  Landmark,
  CalendarDays,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  XAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const todayISO = localDateISO;

function Finance() {
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [entities, setEntities] = useState([]);
  const [harvestEvents, setHarvestEvents] = useState([]);
  const [inventoryConsumptions, setInventoryConsumptions] = useState([]);
  const [projectEntityHistory, setProjectEntityHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pageError, setPageError] = useState("");

  const [newProject, setNewProject] = useState({
    name: "",
    projectType: "",
    purpose: "",
    startedAt: todayISO(),
    targetEndAt: "",
  });
  const [savingProject, setSavingProject] = useState(false);

  const [txn, setTxn] = useState({
    type: "expense",
    amount: "",
    category: "",
    projectId: "",
    entityId: "",
    date: todayISO(),
    notes: "",
  });
  const [savingTxn, setSavingTxn] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [deletingTxnId, setDeletingTxnId] = useState(null);
  const [txnActionError, setTxnActionError] = useState("");

  const [assignSelection, setAssignSelection] = useState({});
  const [completingProjectId, setCompletingProjectId] = useState(null);

  const [split, setSplit] = useState({
    amount: "",
    category: "",
    date: todayISO(),
    allocations: [{ projectId: "", percent: "" }],
  });
  const [savingSplit, setSavingSplit] = useState(false);

  async function loadAll() {
    setLoading(true);
    setLoadError("");

    const [
      projectsRes,
      txnRes,
      entitiesRes,
      harvestRes,
      inventoryConsumptionsRes,
      projectEntityHistoryRes,
    ] = await Promise.all([
      supabase.from("farm_projects").select("*").order("name"),

      supabase
        .from("finance_transactions")
        .select("*")
        .order("occurred_at", { ascending: false }),

      supabase
        .from("farm_entities")
        .select("id, label, project_id, species_config:species_config_id(name)")
        .order("label"),

      supabase
        .from("entity_events")
        .select("entity_id, occurred_at, payload")
        .eq("type", "harvest"),

      supabase
        .from("inventory_consumptions")
        .select(`id, entity_events!inner (entity_id, occurred_at), total_cost`),

      supabase
        .from("farm_project_entities")
        .select("project_id, entity_id, started_at, ended_at"),
    ]);
    const loadErrorResult =
      projectsRes.error ||
      txnRes.error ||
      entitiesRes.error ||
      harvestRes.error ||
      inventoryConsumptionsRes.error ||
      projectEntityHistoryRes.error;

    if (loadErrorResult) {
      setLoadError(loadErrorResult.message);
      setLoading(false);
      return;
    }

    setProjects(projectsRes.data ?? []);
    setTransactions(txnRes.data ?? []);
    setEntities(entitiesRes.data ?? []);
    setInventoryConsumptions(inventoryConsumptionsRes.data ?? []);
    setHarvestEvents(harvestRes.data ?? []);
    setProjectEntityHistory(projectEntityHistoryRes.data ?? []);
    
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, []);

  async function handleUpdateTransaction(e) {
    e.preventDefault();

    if (!editingTxn) return;

    const amount = Number(editingTxn.amount);

    if (!amount || amount <= 0) {
      setTxnActionError("Enter a valid amount.");
      return;
    }

    if (editingTxn.entityId && !editingTxn.projectId) {
      setTxnActionError("Select a project before assigning an entity.");
      return;
    }

    if (editingTxn.entityId && editingTxn.projectId) {
      const entity = entities.find((item) => item.id === editingTxn.entityId);

      if (!entity) {
        setTxnActionError("The selected entity could not be found.");
        return;
      }

      const projectAtDate = getProjectIdAtDate(
        editingTxn.entityId,
        editingTxn.date,
      );

      const isCurrentAssignment = entity.project_id === editingTxn.projectId;

      const isHistoricalAssignment = projectAtDate === editingTxn.projectId;

      if (!isCurrentAssignment && !isHistoricalAssignment) {
        setTxnActionError(
          "The selected entity was not assigned to this project on the transaction date.",
        );
        return;
      }
    }

    setTxnActionError("");

    const { error } = await supabase
      .from("finance_transactions")
      .update({
        type: editingTxn.type,
        amount,
        category: editingTxn.category || null,
        project_id: editingTxn.projectId || null,
        entity_id: editingTxn.entityId || null,
        occurred_at: editingTxn.date,
        notes: editingTxn.notes || null,
      })
      .eq("id", editingTxn.id)
      .is("sale_id", null);

    if (error) {
      setTxnActionError(error.message);
      return;
    }

    setEditingTxn(null);
    loadAll();
  }

  async function handleAddProject(e) {
    e.preventDefault();
    if (!newProject.name.trim()) return;
    setSavingProject(true);
    setPageError("");

    const { error } = await supabase.from("farm_projects").insert({
      name: newProject.name.trim(),
      project_type: newProject.projectType.trim() || null,
      purpose: newProject.purpose.trim() || null,
      started_at: newProject.startedAt || null,
      target_end_at: newProject.targetEndAt || null,
      status: "active",
    });

    setSavingProject(false);
    if (error) {
      setPageError(error.message);
      return;
    }
    setNewProject({
      name: "",
      projectType: "",
      purpose: "",
      startedAt: todayISO(),
      targetEndAt: "",
    });
    loadAll();
  }

  async function handleAddTransaction(e) {
    e.preventDefault();

    const amount = Number(txn.amount);

    if (!amount || amount <= 0) {
      setPageError("Enter a valid amount.");
      return;
    }
    if (txn.entityId && !txn.projectId) {
      setPageError("Select a project before assigning an entity.");
      return;
    }

    if (
      txn.entityId &&
      txn.projectId &&
      !entities.some(
        (entity) =>
          entity.id === txn.entityId && entity.project_id === txn.projectId,
      )
    ) {
      setPageError("The selected entity is not assigned to this project.");
      return;
    }
    setSavingTxn(true);
    setPageError("");

    const { error } = await supabase.from("finance_transactions").insert({
      type: txn.type,
      amount,
      category: txn.category || null,
      project_id: txn.projectId || null,
      entity_id: txn.entityId || null,
      occurred_at: txn.date,
      notes: txn.notes || null,
    });

    setSavingTxn(false);
    if (error) {
      setPageError(error.message);
      return;
    }
    setTxn({
      type: "expense",
      amount: "",
      category: "",
      projectId: "",
      entityId: "",
      date: todayISO(),
      notes: "",
    });
    loadAll();
  }

  async function handleDeleteTransaction(id) {
    setDeletingTxnId(id);
    setTxnActionError("");

    const { error } = await supabase
      .from("finance_transactions")
      .delete()
      .eq("id", id)
      .is("sale_id", null);

    setDeletingTxnId(null);

    if (error) {
      setTxnActionError(error.message);
      return;
    }

    loadAll();
  }

  async function handleAssignEntity(projectId) {
    const entityId = assignSelection[projectId];
    if (!entityId) return;

    const { error } = await supabase.rpc("assign_entity_to_project", {
      p_entity_id: entityId,
      p_project_id: projectId,
      p_role: "primary",
    });

    if (error) {
      setPageError(error.message);
      return;
    }

    setAssignSelection((prev) => ({ ...prev, [projectId]: "" }));
    loadAll();
  }

  async function handleCompleteProject(projectId) {
    const confirmed = window.confirm(
      "Complete this project? Active entity assignments will be ended, but all project history will be preserved.",
    );

    if (!confirmed) return;

    setCompletingProjectId(projectId);
    setPageError("");

    const { error } = await supabase.rpc("complete_project", {
      p_project_id: projectId,
    });

    setCompletingProjectId(null);

    if (error) {
      setPageError(error.message);
      return;
    }

    loadAll();
  }

  function updateAllocation(index, field, value) {
    setSplit((prev) => {
      const allocations = [...prev.allocations];
      allocations[index] = { ...allocations[index], [field]: value };
      return { ...prev, allocations };
    });
  }

  function addAllocationRow() {
    setSplit((prev) => ({
      ...prev,
      allocations: [...prev.allocations, { projectId: "", percent: "" }],
    }));
  }

  function removeAllocationRow(index) {
    setSplit((prev) => ({
      ...prev,
      allocations: prev.allocations.filter((_, i) => i !== index),
    }));
  }

  async function handleSaveSplit(e) {
    e.preventDefault();
    const total = Number(split.amount);
    const percentSum = split.allocations.reduce(
      (s, a) => s + Number(a.percent || 0),
      0,
    );

    if (!total || total <= 0) {
      setPageError("Enter a valid total amount for the shared expense.");
      return;
    }
    if (Math.round(percentSum) !== 100) {
      setPageError(
        `Allocation percentages must add up to 100 (currently ${percentSum}).`,
      );
      return;
    }
    if (split.allocations.some((a) => !a.projectId)) {
      setPageError("Every allocation row needs a project selected.");
      return;
    }
    const projectIds = split.allocations.map(
      (allocation) => allocation.projectId,
    );

    if (new Set(projectIds).size !== projectIds.length) {
      setPageError("Each project can only appear once in a shared expense.");
      return;
    }

    setSavingSplit(true);
    setPageError("");

    const rows = splitByPercent(total, split.allocations).map((r) => ({
      type: "expense",
      amount: r.amount,
      category: split.category
        ? `${split.category} (shared)`
        : "Shared expense",
      project_id: r.projectId,
      occurred_at: split.date,
    }));

    const { error } = await supabase.from("finance_transactions").insert(rows);
    setSavingSplit(false);
    if (error) {
      setPageError(error.message);
      return;
    }

    setSplit({
      amount: "",
      category: "",
      date: todayISO(),
      allocations: [{ projectId: "", percent: "" }],
    });
    loadAll();
  }
  function getProjectIdAtDate(entityId, date) {
    const relationship = projectEntityHistory.find(
      (item) =>
        item.entity_id === entityId &&
        item.started_at <= date &&
        (item.ended_at === null || date < item.ended_at),
    );

    return relationship?.project_id ?? null;
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading finance data…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-destructive">
            Unable to load finance data
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
        </CardContent>
      </Card>
    );
  }

  const activeProjects = projects.filter(
    (project) => project.status === "active",
  );

  const completedProjects = projects.filter(
    (project) => project.status === "completed",
  );
  const transactionEntities = txn.projectId
    ? entities.filter((entity) => entity.project_id === txn.projectId)
    : [];

  const editingTransactionEntities = editingTxn?.projectId
    ? entities.filter(
        (entity) =>
          entity.project_id === editingTxn.projectId ||
          entity.id === editingTxn.entityId,
      )
    : [];

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const totalAssetPurchases = transactions
    .filter((transaction) => transaction.type === "asset")
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const netCashFlow = totalIncome - totalExpenses - totalAssetPurchases;

  const transactionCount = transactions.length;

  const monthlyFinance = transactions.reduce((acc, transaction) => {
    const month = transaction.occurred_at?.slice(0, 7);

    if (!month) return acc;

    if (!acc[month]) {
      acc[month] = {
        income: 0,
        expense: 0,
        asset: 0,
        netCash: 0,
      };
    }

    const amount = Number(transaction.amount || 0);

    if (transaction.type === "income") {
      acc[month].income += amount;
      acc[month].netCash += amount;
    }

    if (transaction.type === "expense") {
      acc[month].expense += amount;
      acc[month].netCash -= amount;
    }

    if (transaction.type === "asset") {
      acc[month].asset += amount;
      acc[month].netCash -= amount;
    }

    return acc;
  }, {});
  const monthlyFinanceRows = Object.entries(monthlyFinance)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, values]) => ({
      month,
      ...values,
    }));
  const financeChartConfig = {
    income: {
      label: "Income",
      color: "var(--color-forest)",
    },
    expense: {
      label: "Expenses",
      color: "var(--color-terracotta)",
    },
    netCash: {
      label: "Net cash",
      color: "var(--color-earth)",
    },
  };
  const unassignedTransactions = transactions.filter(
    (transaction) => !transaction.project_id,
  );

  const unassignedIncome = unassignedTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const unassignedExpenses = unassignedTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const unassignedAssets = unassignedTransactions
    .filter((transaction) => transaction.type === "asset")
    .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

  const unassignedNetCash =
    unassignedIncome - unassignedExpenses - unassignedAssets;

    const renderProjectCard = (project) => {
    const projectTxns = transactions.filter((t) => t.project_id === project.id);

    const totals = computeTotals(projectTxns);

    const projectConsumedInventoryCost = inventoryConsumptions
      .filter((consumption) => {
        const entityId = consumption.entity_events?.entity_id;
        const occurredAt = consumption.entity_events?.occurred_at;

        if (!entityId || !occurredAt) {
          return false;
        }

        return getProjectIdAtDate(entityId, occurredAt) === project.id;
      })
      .reduce(
        (sum, consumption) => sum + Number(consumption.total_cost || 0),
        0,
      );

    const projectOperatingCost =
      totals.expense + projectConsumedInventoryCost;

    const projectRevenue = totals.income;
    const operatingMargin = projectRevenue - projectOperatingCost;
    const hasFinancialActivity =
      projectTxns.length > 0 || projectConsumedInventoryCost > 0;

    const projectEntities = entities.filter(
      (e) => e.project_id === project.id,
    );
    const availableEntities = entities.filter((e) => !e.project_id);

    const totalYield = harvestEvents.reduce((sum, event) => {
      const qtyKg = Number(event.payload?.qty_kg ?? 0);

      if (
        !Number.isFinite(qtyKg) ||
        qtyKg <= 0 ||
        !event.entity_id ||
        !event.occurred_at
      ) {
        return sum;
      }

      return getProjectIdAtDate(event.entity_id, event.occurred_at) ===
        project.id
        ? sum + qtyKg
        : sum;
    }, 0);

    const costPerUnit = computeCostPerUnit(
      projectOperatingCost,
      totalYield,
    );

    return (
      <Card className="border-border/70 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="text-lg">{project.name}</CardTitle>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    project.status === "completed" ? "secondary" : "default"
                  }
                >
                  {project.status === "completed" ? "Completed" : "Active"}
                </Badge>

                <CardDescription>
                  {project.started_at
                    ? `Started ${project.started_at}`
                    : "No start date recorded"}
                </CardDescription>
              </div>

              {project.completed_at && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Completed {project.completed_at}
                </p>
              )}
            </div>

            <div className="shrink-0 text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Net cash flow
              </p>
              <p className="mt-0.5 text-lg font-semibold tracking-[-0.02em]">
                ৳{totals.net.toFixed(2)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-3">
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="mt-1 text-sm font-semibold">
                ৳{totals.income.toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-3">
              <p className="text-xs text-muted-foreground">
                Operating expenses
              </p>
              <p className="mt-1 text-sm font-semibold">
                ৳{totals.expense.toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-3">
              <p className="text-xs text-muted-foreground">Assets</p>
              <p className="mt-1 text-sm font-semibold">
                ৳{totals.asset.toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-3">
              <p className="text-xs text-muted-foreground">
                Consumed inventory
              </p>
              <p className="mt-1 text-sm font-semibold">
                ৳{projectConsumedInventoryCost.toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-3">
              <p className="text-xs text-muted-foreground">Operating cost</p>
              <p className="mt-1 text-sm font-semibold">
                ৳{projectOperatingCost.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/70 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Project economics
            </p>

            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  Recorded revenue
                </p>
                <p className="mt-1 text-sm font-semibold">
                  ৳{projectRevenue.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Operating cost</p>
                <p className="mt-1 text-sm font-semibold">
                  ৳{projectOperatingCost.toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Operating margin
                </p>
                <p
                  className={`mt-1 text-base font-semibold ${
                    operatingMargin >= 0 ? "text-primary" : "text-destructive"
                  }`}
                >
                  {operatingMargin >= 0 ? "+" : "-"}৳
                  {Math.abs(operatingMargin).toFixed(2)}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Cost / unit</p>
                <p className="mt-1 text-sm font-semibold">
                  {costPerUnit != null ? `৳${costPerUnit.toFixed(2)}` : "—"}
                </p>
              </div>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Operating cost includes consumed inventory.
            </p>
            {!hasFinancialActivity && (
              <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-sm font-medium">No financial activity yet</p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Record a transaction against this project to start tracking
                  its financial performance.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Assigned entities
            </p>

            {projectEntities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-3">
                <p className="text-sm font-medium">No entities assigned</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Assign animals or other farm entities to connect production
                  activity with this project.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {projectEntities.map((entity) => (
                  <Badge
                    key={entity.id}
                    variant="secondary"
                    className="font-normal"
                  >
                    {entity.label}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {project.status === "active" && (
            <div className="border-t border-border/60 pt-4">
              {availableEntities.length > 0 ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={assignSelection[project.id] ?? ""}
                    onChange={(e) =>
                      setAssignSelection((prev) => ({
                        ...prev,
                        [project.id]: e.target.value,
                      }))
                    }
                    className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">Assign entity…</option>
                    {availableEntities.map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.label}
                      </option>
                    ))}
                  </select>

                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-lg"
                    disabled={!assignSelection[project.id]}
                    onClick={() => handleAssignEntity(project.id)}
                  >
                    Assign
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-3">
                  <p className="text-sm font-medium">No unassigned entities</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    All current farm entities are already assigned to a project.
                    Complete a project before assigning those entities
                    elsewhere.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>

        {project.status === "active" && (
          <div className="flex flex-col gap-3 border-t border-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-muted-foreground">
              Completing this project ends its active entity assignments while
              preserving all project and financial history.
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={completingProjectId === project.id}
              onClick={() => handleCompleteProject(project.id)}
            >
              {completingProjectId === project.id
                ? "Completing…"
                : "Complete project"}
            </Button>
          </div>
        )}
      </Card>
    );
  };

    return (
    <div className="space-y-12">
      <section className="border-b border-border/60 pb-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <CircleDollarSign className="size-4 text-primary" />
              <span>Farm operations</span>
            </div>

            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
                Finance
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Understand where money is going, where it is coming from,
                and how each project contributes to the farm's financial picture.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                document
                  .getElementById("finance-transaction-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Plus className="size-4" />
              Transaction
            </Button>

            <Button
              type="button"
              onClick={() =>
                document
                  .getElementById("finance-project-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <FolderKanban className="size-4" />
              Project
            </Button>
          </div>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  Net cash flow
                </p>

                <p
                  className={`mt-2 text-3xl font-semibold tracking-tight ${
                    netCashFlow >= 0
                      ? "text-primary"
                      : "text-destructive"
                  }`}
                >
                  {netCashFlow >= 0 ? "+" : "-"}৳
                  {Math.abs(netCashFlow).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Income minus expenses and assets
                </p>
              </div>

              <div className="rounded-lg bg-primary/10 p-2.5">
                <Wallet className="size-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  Income
                </p>

                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  ৳
                  {totalIncome.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>

                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowUpRight className="size-3.5 text-primary" />
                  Recorded revenue
                </p>
              </div>

              <div className="rounded-lg bg-primary/10 p-2.5">
                <TrendingUp className="size-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  Expenses
                </p>

                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  ৳
                  {totalExpenses.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>

                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowDownRight className="size-3.5 text-destructive" />
                  Operating expenses
                </p>
              </div>

              <div className="rounded-lg bg-destructive/10 p-2.5">
                <Receipt className="size-4 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  Activity
                </p>

                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {transactionCount}
                </p>

                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" />
                  {activeProjects.length} active project
                  {activeProjects.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="rounded-lg bg-muted p-2.5">
                <Landmark className="size-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  General / Farm-level
                </p>

                <p
                  className={`mt-2 text-3xl font-semibold tracking-tight ${
                    unassignedNetCash >= 0
                      ? "text-primary"
                      : "text-destructive"
                  }`}
                >
                  {unassignedNetCash >= 0 ? "+" : "-"}৳
                  {Math.abs(unassignedNetCash).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Transactions not assigned to a project
                </p>
              </div>

              <div className="rounded-lg bg-muted p-2.5">
                <Landmark className="size-4 text-muted-foreground" />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Income</p>
                <p className="mt-0.5 text-sm font-semibold">
                  ৳{unassignedIncome.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-muted-foreground">Expenses</p>
                <p className="mt-0.5 text-sm font-semibold">
                  ৳{unassignedExpenses.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-muted-foreground">Assets</p>
                <p className="mt-0.5 text-sm font-semibold">
                  ৳{unassignedAssets.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      {pageError && (
        <Card className="border-destructive/30">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive">{pageError}</p>
          </CardContent>
        </Card>
      )}

      <section className="space-y-5">
        <div className="flex items-start gap-3">
          <FolderKanban className="mt-1 size-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Projects
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Financial performance and production economics by farm project.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {activeProjects.length > 0 && (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Active projects
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Projects currently in production or operation.
              </p>
            </div>

            {activeProjects.map((project) => (
            <div key={project.id}>
              {renderProjectCard(project)}
            </div>
          ))}
        </div>
      )}

      {completedProjects.length > 0 && (
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Completed projects
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Historical projects and their preserved production records.
          </p>
        </div>

        {completedProjects.map((project) => (
        <div key={project.id}>
          {renderProjectCard(project)}
        </div>
        ))}
      </div>
      )}
    </div>            
    <form
      id="finance-project-form"
      onSubmit={handleAddProject}
      className="rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-2">
          <Plus className="size-4 text-primary" />

            <h3 className="text-base font-semibold tracking-[-0.01em]">
              New project
            </h3>
        </div>

        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          Create the project first, then record its expenses, income, and
          asset purchases through transactions linked to this project.
        </p>
      </div>

      <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Project Name</label>
              <Input
                type="text"
                placeholder="Project name, e.g. Mustard Project #001"
                value={newProject.name}
                onChange={(e) =>
                  setNewProject((p) => ({
                    ...p,
                    name: e.target.value,
                  }))
                }
                required
                className="mt-2 w-full"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project type</label>
              <Input
                type="text"
                value={newProject.projectType}
                onChange={(e) =>
                  setNewProject((prev) => ({
                    ...prev,
                    projectType: e.target.value,
                  }))
                }
                placeholder="e.g. Livestock production"
                className="mt-2 w-full"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Start date</label>
              <Input
                type="date"
                value={newProject.startedAt}
                onChange={(e) =>
                  setNewProject((p) => ({
                    ...p,
                    startedAt: e.target.value,
                  }))
                }
                className="mt-2 w-full"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Target end date</label>
              <Input
                type="date"
                value={newProject.targetEndAt}
                onChange={(e) =>
                  setNewProject((prev) => ({
                    ...prev,
                    targetEndAt: e.target.value,
                  }))
                }
                className="mt-2 w-full"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Purpose</label>
              <textarea
                value={newProject.purpose}
                onChange={(e) =>
                  setNewProject((prev) => ({
                    ...prev,
                    purpose: e.target.value,
                  }))
                }
                placeholder="What is this project intended to produce or achieve?"
                rows={2}
                className="mt-1 min-h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <div className="flex items-end lg:col-span-1">
              <Button
                type="submit"
                disabled={savingProject}
                className="h-10 w-full"
              >
                {savingProject ? "Adding…" : "Add project"}
              </Button>
            </div>
          </div>
        </form>
      </section>

      <section className="space-y-5">
        <div className="flex items-start gap-3">
          <Receipt className="mt-1 size-5 shrink-0 text-primary" />

          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Add a transaction
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Record income, expenses, or asset purchases against your farm.
            </p>
          </div>
        </div>

        <form
          id="finance-transaction-form"
          onSubmit={handleAddTransaction}
          className="rounded-xl border border-dashed border-border bg-card shadow-sm"
        >
          <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <select
              value={txn.type}
              onChange={(e) =>
                setTxn((p) => ({
                  ...p,
                  type: e.target.value,
                }))
              }
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-medium shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="asset">Asset purchase</option>
            </select>

            <Input
              type="number"
              step="any"
              placeholder="Amount (৳)"
              value={txn.amount}
              onChange={(e) =>
                setTxn((p) => ({
                  ...p,
                  amount: e.target.value,
                }))
              }
              required
              className="h-10 text-base font-semibold"
            />

            <Input
              type="text"
              placeholder="Category"
              value={txn.category}
              onChange={(e) =>
                setTxn((p) => ({
                  ...p,
                  category: e.target.value,
                }))
              }
            />

            <select
              value={txn.projectId}
              onChange={(e) =>
                setTxn((prev) => ({
                  ...prev,
                  projectId: e.target.value,
                  entityId: "",
                }))
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">No project (general)</option>

              {activeProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              value={txn.entityId}
              onChange={(e) =>
                setTxn((prev) => ({
                  ...prev,
                  entityId: e.target.value,
                }))
              }
              disabled={!txn.projectId}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {txn.projectId
                  ? "Select entity (optional)"
                  : "Select a project first"}
              </option>

              {transactionEntities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.label}
                </option>
              ))}
            </select>            

            <Input
              type="date"
              value={txn.date}
              onChange={(e) =>
                setTxn((p) => ({
                  ...p,
                  date: e.target.value,
                }))
              }
            />

            <Input
              type="text"
              placeholder="Notes (optional)"
              value={txn.notes}
              onChange={(e) =>
                setTxn((p) => ({
                  ...p,
                  notes: e.target.value,
                }))
              }
              className="sm:col-span-2 lg:col-span-3"
            />
          </div>
          <div className="flex items-center justify-between border-t border-border/60 px-5 py-4">
            <p className="text-xs text-muted-foreground">
              Transactions update the farm's financial totals immediately.
            </p>

            <Button type="submit" disabled={savingTxn} className="h-10">
              {savingTxn ? "Saving…" : "Add transaction"}
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-5">
        <div className="flex items-start gap-3">
          <Split className="mt-1 size-5 shrink-0 text-primary" />

          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Shared expense
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Split a shared cost across multiple projects by percentage.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSaveSplit}
          className="rounded-2xl border border-border bg-card shadow-sm"
        >
          <div className="space-y-6 p-5">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Input
                type="number"
                step="any"
                placeholder="Total amount (৳)"
                value={split.amount}
                onChange={(e) =>
                  setSplit((s) => ({
                    ...s,
                    amount: e.target.value,
                  }))
                }
              />

              <Input
                type="text"
                placeholder="Category, e.g. labour"
                value={split.category}
                onChange={(e) =>
                  setSplit((s) => ({
                    ...s,
                    category: e.target.value,
                  }))
                }
              />

              <Input
                type="date"
                value={split.date}
                onChange={(e) =>
                  setSplit((s) => ({
                    ...s,
                    date: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold">Project allocations</p>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
                  Assign the shared cost across projects. The allocation percentages
                  must add up to 100%.
                </p>
              </div>

              <div className="space-y-2">
                {split.allocations.map((allocation, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_140px_auto]"
                  >
                    <select
                      value={allocation.projectId}
                      onChange={(e) =>
                        updateAllocation(
                          index,
                          "projectId",
                          e.target.value,
                        )
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="">Select project</option>

                      {activeProjects
                        .filter(
                          (project) =>
                            project.id === allocation.projectId ||
                            !split.allocations.some(
                              (item, itemIndex) =>
                                itemIndex !== index && item.projectId === project.id,
                            ),
                        )
                        .map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                    </select>

                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      placeholder="%"
                      value={allocation.percent}
                      onChange={(e) =>
                        updateAllocation(
                          index,
                          "percent",
                          e.target.value,
                        )
                      }
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={split.allocations.length === 1}
                      onClick={() => removeAllocationRow(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                <span className="text-sm text-muted-foreground">
                  Total allocation
                </span>

                <span className="text-sm font-semibold">
                  {split.allocations.reduce(
                    (sum, allocation) =>
                      sum + Number(allocation.percent || 0),
                    0,
                  )}
                  %
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={addAllocationRow}
              className="h-10"
            >
              + Add project
            </Button>

            <Button type="submit" disabled={savingSplit} className="h-10">
              {savingSplit ? "Saving…" : "Save Split Expense"}
            </Button>
          </div>            
        </form>
      </section>

      <section className="space-y-5">
        <div className="flex items-start gap-3">
          <Receipt className="mt-1 size-5 shrink-0 text-primary" />

          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Transactions
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Recent income and expenses recorded across the farm.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden border-border/70 bg-card shadow-sm">
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No transactions recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {transactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex flex-col gap-4 p-5 transition-colors hover:bg-muted/30 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Badge
                          variant={
                            t.type === "income" ? "secondary" : "outline"
                          }
                          className="capitalize"
                        >
                          {t.type === "asset" ? "Asset purchase" : t.type}
                        </Badge>

                        <span className="text-sm font-semibold">
                          {t.category || "Uncategorized"}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {t.occurred_at
                            ? new Date(t.occurred_at).toLocaleDateString()
                            : "—"}
                        </span>
                        {t.project_id ? (
                          <Badge variant="outline" className="font-normal">
                            {projects.find((project) => project.id === t.project_id)?.name ||
                              "Unknown project"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-normal">
                            General
                          </Badge>
                        )}

                        {t.entity_id && (
                          <Badge variant="secondary" className="font-normal">
                            {entities.find((entity) => entity.id === t.entity_id)?.label ||
                              "Unknown entity"}
                          </Badge>
                        )}
                      </div>

                      {t.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {t.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                      <div
                        className={`text-left text-lg font-semibold tracking-tight sm:text-right ${
                          t.type === "income"
                            ? "text-primary"
                            : "text-foreground"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}৳
                        {Number(t.amount || 0).toLocaleString()}
                      </div>

                      {t.sale_id ? (
                        <Badge variant="secondary" className="font-normal">
                          From sale
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditingTxn({
                                id: t.id,
                                type: t.type,
                                amount: t.amount,
                                category: t.category ?? "",
                                projectId: t.project_id ?? "",
                                entityId: t.entity_id ?? "",
                                date: t.occurred_at ?? todayISO(),
                                notes: t.notes ?? "",
                              })
                            }
                          >
                            Edit
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={deletingTxnId === t.id}
                            onClick={() => handleDeleteTransaction(t.id)}
                            className="border-destructive/40 text-destructive hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                          >
                            {deletingTxnId === t.id ? "Deleting…" : "Delete"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
      {editingTxn && (
        <Dialog
          open={Boolean(editingTxn)}
          onOpenChange={(open) => {
            if (!open) {
              setEditingTxn(null);
              setTxnActionError("");
            }
          }}
        >
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-xl tracking-tight">Edit transaction</DialogTitle>
              <DialogDescription>
                Update this manually recorded finance transaction.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateTransaction} className="space-y-6">
              {txnActionError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                  <p className="text-sm text-destructive">{txnActionError}</p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <select
                  value={editingTxn.type}
                  onChange={(e) =>
                    setEditingTxn((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                  <option value="asset">Asset purchase</option>
                </select>

                <Input
                  type="number"
                  step="any"
                  placeholder="Amount (৳)"
                  className="h-10 text-base font-semibold"
                  value={editingTxn.amount}
                  onChange={(e) =>
                    setEditingTxn((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  required
                />

                <Input
                  type="text"
                  placeholder="Category"
                  value={editingTxn.category}
                  onChange={(e) =>
                    setEditingTxn((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                />

                <select
                  value={editingTxn.projectId}
                  onChange={(e) =>
                    setEditingTxn((prev) => ({
                      ...prev,
                      projectId: e.target.value,
                      entityId: "",
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">No project (general)</option>

                  {projects.map((project) => (
                    <option
                      key={project.id}
                      value={project.id}
                      disabled={
                        project.status === "completed" &&
                        editingTxn?.projectId !== project.id
                      }
                    >
                      {project.name}
                      {project.status === "completed" ? " (Completed)" : ""}
                    </option>
                  ))}
                </select>

                <select
                  value={editingTxn.entityId}
                  onChange={(e) =>
                    setEditingTxn((prev) => ({
                      ...prev,
                      entityId: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">No entity</option>

                  {editingTransactionEntities.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.label}
                    </option>
                  ))}
                </select>

                <Input
                  type="date"
                  value={editingTxn.date}
                  onChange={(e) =>
                    setEditingTxn((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                />

                <Input
                  type="text"
                  placeholder="Notes (optional)"
                  value={editingTxn.notes}
                  onChange={(e) =>
                    setEditingTxn((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  className="min-h-10 sm:col-span-2"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border/60 pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditingTxn(null);
                    setTxnActionError("");
                  }}
                >
                  Cancel
                </Button>

                <Button type="submit">Save changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <section className="space-y-5">
        <div className="flex items-start gap-3">
          <CircleDollarSign className="mt-1 size-5 shrink-0 text-primary" />

          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Financial trend
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Monthly income, expenses, and net cash movement.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden border-border/70 bg-card shadow-sm">
          <CardContent className="p-4 sm:p-6 lg:p-7">
            {monthlyFinanceRows.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No financial activity recorded yet.
                </p>
              </div>
            ) : (
              <ChartContainer
                config={financeChartConfig}
                className="h-[340px] w-full"
              >
                <ComposedChart
                  accessibilityLayer
                  data={[...monthlyFinanceRows].reverse()}
                  margin={{ top: 12, right: 16, left: 8, bottom: 4 }}
                >
                  <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.08} />
                  <ReferenceLine
                    y={0}
                    stroke="currentColor"
                    strokeOpacity={0.2}
                  />

                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) =>
                      new Date(`${value}-01`).toLocaleDateString(undefined, {
                        month: "short",
                        year: "2-digit",
                      })
                    }
                  />

                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) =>
                          `৳${Number(value).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}`
                        }
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />

                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="var(--color-income)"
                    radius={[6, 6, 0, 0]}
                  />

                  <Bar
                    dataKey="expense"
                    name="Expenses"
                    fill="var(--color-expense)"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="asset"
                    name="Asset purchases"
                    fill="var(--color-asset)"
                    radius={[6, 6, 0, 0]}
                  />

                  <Line
                    type="monotone"
                    dataKey="netCash"
                    name="Net cash"
                    stroke="var(--color-netCash)"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-5">
        <div className="flex items-start gap-3">
          <CircleDollarSign className="mt-1 size-5 shrink-0 text-primary" />

          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Monthly summary
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Monthly income, operating expenses, asset purchases, and cash
              movement.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden border-border/70 bg-card shadow-sm">
          <CardContent className="p-0">
            {monthlyFinanceRows.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No financial activity recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {monthlyFinanceRows.map((row) => (
                  <div
                    key={row.month}
                    className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">Month</p>
                      <p className="mt-1 text-sm font-semibold">
                        {new Date(`${row.month}-01`).toLocaleDateString(
                          undefined,
                          {
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Income</p>
                      <p className="mt-1 text-sm font-semibold text-primary">
                        ৳
                        {row.income.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">Expenses</p>
                      <p className="mt-1 text-sm font-semibold">
                        ৳
                        {row.expense.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Asset purchases
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        ৳
                        {row.asset.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Net cash movement
                      </p>
                      <p
                        className={`mt-1 text-sm font-semibold ${
                          row.netCash >= 0 ? "text-primary" : "text-destructive"
                        }`}
                      >
                        {row.netCash >= 0 ? "+" : "-"}৳
                        {Math.abs(row.netCash).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default Finance;
