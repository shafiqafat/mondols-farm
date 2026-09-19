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
  const [harvestByEntity, setHarvestByEntity] = useState({});
  const [inventoryConsumptions, setInventoryConsumptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pageError, setPageError] = useState("");

  const [newProject, setNewProject] = useState({
    name: "",
    startedAt: todayISO(),
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
        .select("entity_id, payload")
        .eq("type", "harvest"),

      supabase
        .from("inventory_consumptions")
        .select(`id, entity_events!inner (entity_id), total_cost`),
    ]);
    const loadErrorResult =
      projectsRes.error ||
      txnRes.error ||
      entitiesRes.error ||
      harvestRes.error ||
      inventoryConsumptionsRes.error;

    if (loadErrorResult) {
      setLoadError(loadErrorResult.message);
      setLoading(false);
      return;
    }

    setProjects(projectsRes.data ?? []);
    setTransactions(txnRes.data ?? []);
    setEntities(entitiesRes.data ?? []);
    setInventoryConsumptions(inventoryConsumptionsRes.data ?? []);


    const harvestTotals = {};
    for (const row of harvestRes.data ?? []) {
      const qtyKg = Number(row.payload?.qty_kg ?? 0);

      if (!Number.isFinite(qtyKg) || qtyKg <= 0) {
        continue;
      }

      harvestTotals[row.entity_id] =
        (harvestTotals[row.entity_id] ?? 0) + qtyKg;
    }
    setHarvestByEntity(harvestTotals);

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
      started_at: newProject.startedAt || null,
      status: "active",
    });

    setSavingProject(false);
    if (error) {
      setPageError(error.message);
      return;
    }
    setNewProject({ name: "", startedAt: todayISO() });
    loadAll();
  }

  async function handleAddTransaction(e) {
    e.preventDefault();
    const amount = Number(txn.amount);
    if (!amount || amount <= 0) {
      setPageError("Enter a valid amount.");
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
    const { error } = await supabase
      .from("farm_entities")
      .update({ project_id: projectId })
      .eq("id", entityId);
    if (error) {
      setPageError(error.message);
      return;
    }
    setAssignSelection((prev) => ({ ...prev, [projectId]: "" }));
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

  const unassignedEntities = entities.filter((e) => !e.project_id);
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
  // const unassignedTransactions = transactions.filter((t) => !t.project_id);

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-5 border-b border-border/60 pb-7">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <CircleDollarSign className="size-4 text-primary" />
            <span>Farm operations</span>
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
              Finance
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Track project finances, transactions, shared costs, and production
              economics.
            </p>
          </div>
        </div>
      </div>

      {pageError && (
        <Card className="border-destructive/30">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive">{pageError}</p>
          </CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <FolderKanban className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Projects
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Financial performance and production economics by farm project.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {projects.map((project) => {
            const projectTxns = transactions.filter(
              (t) =>
                t.project_id === project.id &&
                t.category !== "Inventory Purchase",
            );
            const totals = computeTotals(projectTxns);
            const projectConsumedInventoryCost = inventoryConsumptions
              .filter(
                (consumption) =>
                  entities.find(
                    (entity) =>
                      entity.id === consumption.entity_events?.entity_id,
                  )?.project_id === project.id,
              )
              .reduce(
                (sum, consumption) => sum + Number(consumption.total_cost || 0),
                0,
              );
            const projectOperatingCost =
              totals.expense + projectConsumedInventoryCost;
            const projectRevenue = totals.income;
            
            const operatingMargin = projectRevenue - projectOperatingCost;
            const projectEntities = entities.filter(
              (e) => e.project_id === project.id,
            );
            const totalYield = projectEntities.reduce(
              (sum, e) => sum + (harvestByEntity[e.id] ?? 0),
              0,
            );
            const costPerUnit = computeCostPerUnit(
              projectOperatingCost,
              totalYield,
            );
            return (
              <Card
                key={project.id}
                className="border-border/70 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <CardTitle className="text-lg">{project.name}</CardTitle>

                      <CardDescription className="mt-1">
                        {project.started_at
                          ? `Started ${project.started_at}`
                          : "No start date recorded"}
                      </CardDescription>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Net
                      </p>
                      <p className="mt-0.5 text-lg font-semibold tracking-[-0.02em] text-foreground">
                        ৳{totals.net.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-2.5">
                      <p className="text-xs text-muted-foreground">Income</p>
                      <p className="mt-1 text-sm font-semibold">
                        ৳{totals.income.toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-2.5">
                      <p className="text-xs text-muted-foreground">Expense</p>
                      <p className="mt-1 text-sm font-semibold">
                        ৳{totals.expense.toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-2.5">
                      <p className="text-xs text-muted-foreground">Assets</p>
                      <p className="mt-1 text-sm font-semibold">
                        ৳{totals.asset.toFixed(2)}
                      </p>
                    </div>

                    <div className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-2.5">
                      <p className="text-xs text-muted-foreground">
                        Consumed inventory
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        ৳{projectConsumedInventoryCost.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-secondary/40 px-3 py-2.5">
                      <p className="text-xs text-muted-foreground">
                        Operating cost
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        ৳{projectOperatingCost.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Project economics
                    </p>

                    <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Recorded revenue
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          ৳{projectRevenue.toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Operating cost
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          ৳{projectOperatingCost.toFixed(2)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Operating margin
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          ৳{operatingMargin.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Cost / unit
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {costPerUnit != null
                            ? `৳${costPerUnit.toFixed(2)}`
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Operating cost includes consumed inventory.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Assigned entities
                    </p>

                    {projectEntities.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No entities assigned
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {projectEntities.map((e) => (
                          <Badge
                            key={e.id}
                            variant="secondary"
                            className="font-normal"
                          >
                            {e.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {unassignedEntities.length > 0 && (
                    <div className="flex flex-col gap-2 border-t border-border/60 pt-4 sm:flex-row">
                      <select
                        value={assignSelection[project.id] ?? ""}
                        onChange={(e) =>
                          setAssignSelection((prev) => ({
                            ...prev,
                            [project.id]: e.target.value,
                          }))
                        }
                        className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="">Assign entity…</option>

                        {unassignedEntities.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.label}
                          </option>
                        ))}
                      </select>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleAssignEntity(project.id)}
                      >
                        Assign
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <form
          onSubmit={handleAddProject}
          className="rounded-xl border border-dashed border-border bg-card shadow-sm"
        >
          <div className="border-b border-border/60 px-5 py-4">
            <div className="flex items-center gap-2">
              <Plus className="size-4 text-primary" />

              <h3 className="text-base font-semibold tracking-[-0.01em]">
                New project
              </h3>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              Create a project to track its costs, income, assets, and
              production.
            </p>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-[1fr_220px_auto]">
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
            />

            <Input
              type="date"
              value={newProject.startedAt}
              onChange={(e) =>
                setNewProject((p) => ({
                  ...p,
                  startedAt: e.target.value,
                }))
              }
            />

            <Button
              type="submit"
              disabled={savingProject}
              className="w-full sm:w-auto"
            >
              {savingProject ? "Adding…" : "Add project"}
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <Receipt className="mt-0.5 size-5 shrink-0 text-primary" />

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
          onSubmit={handleAddTransaction}
          className="rounded-xl border border-dashed border-border bg-card shadow-sm"
        >
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <select
              value={txn.type}
              onChange={(e) =>
                setTxn((p) => ({
                  ...p,
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
              value={txn.amount}
              onChange={(e) =>
                setTxn((p) => ({
                  ...p,
                  amount: e.target.value,
                }))
              }
              required
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
                setTxn((p) => ({
                  ...p,
                  projectId: e.target.value,
                }))
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">No project (general)</option>

              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={txn.entityId}
              onChange={(e) =>
                setTxn((p) => ({
                  ...p,
                  entityId: e.target.value,
                }))
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">No entity</option>

              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
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
          <div className="border-t border-border/60 px-5 py-4">
            <Button type="submit" disabled={savingTxn}>
              {savingTxn ? "Saving…" : "Add transaction"}
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <Split className="mt-0.5 size-5 shrink-0 text-primary" />

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
          className="rounded-xl border border-dashed border-border bg-card shadow-sm"
        >
          <div className="space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <h3 className="text-sm font-medium">Project allocation</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Make sure the percentages add up to 100%.
                </p>
              </div>

              <div className="space-y-3">
                {split.allocations.map((alloc, i) => (
                  <div
                    key={i}
                    className="grid gap-3 rounded-lg border border-border/70 bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-center"
                  >
                    <select
                      value={alloc.projectId}
                      onChange={(e) =>
                        updateAllocation(i, "projectId", e.target.value)
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                    >
                      <option value="">Project…</option>

                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>

                    <Input
                      type="number"
                      step="any"
                      placeholder="%"
                      value={alloc.percent}
                      onChange={(e) =>
                        updateAllocation(i, "percent", e.target.value)
                      }
                    />

                    {split.allocations.length > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeAllocationRow(i)}
                        className="w-full sm:w-auto"
                      >
                        Remove
                      </Button>
                    ) : (
                      <div className="hidden sm:block sm:w-[78px]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" onClick={addAllocationRow}>
              + Add project
            </Button>

            <Button type="submit" disabled={savingSplit}>
              {savingSplit ? "Saving…" : "Save Split Expense"}
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <Receipt className="mt-0.5 size-5 shrink-0 text-primary" />

          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Transactions
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Recent income and expenses recorded across the farm.
            </p>
          </div>
        </div>

        <Card className="border-border/70 bg-card shadow-sm">
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
                    className="flex flex-col gap-3 p-5 transition-colors hover:bg-muted/30 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Badge
                          variant={
                            t.type === "income" ? "secondary" : "outline"
                          }
                        >
                          {t.type}
                        </Badge>

                        <span className="text-sm font-medium">
                          {t.category || "Uncategorized"}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {t.occurred_at
                            ? new Date(t.occurred_at).toLocaleDateString()
                            : "—"}
                        </span>
                      </div>

                      {t.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {t.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                      <div
                        className={`text-left text-base font-semibold sm:text-right ${
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
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
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
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit transaction</DialogTitle>
              <DialogDescription>
                Update this manually recorded finance transaction.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateTransaction} className="space-y-5">
              {txnActionError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                  <p className="text-sm text-destructive">{txnActionError}</p>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
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
                    }))
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">No project (general)</option>

                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
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
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="">No entity</option>

                  {entities.map((entity) => (
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
                  className="sm:col-span-2"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
                <Button
                  type="button"
                  variant="outline"
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

      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <CircleDollarSign className="mt-0.5 size-5 shrink-0 text-primary" />

          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Financial trend
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Monthly income, expenses, and net cash movement.
            </p>
          </div>
        </div>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="p-4 sm:p-6">
            {monthlyFinanceRows.length === 0 ? (
              <div className="flex h-[280px] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No financial activity recorded yet.
                </p>
              </div>
            ) : (
              <ChartContainer
                config={financeChartConfig}
                className="h-[300px] w-full"
              >
                <ComposedChart
                  accessibilityLayer
                  data={[...monthlyFinanceRows].reverse()}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} />
                  <ReferenceLine
                    y={0}
                    stroke="currentColor"
                    strokeOpacity={0.35}
                  />

                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
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
                    radius={[4, 4, 0, 0]}
                  />

                  <Bar
                    dataKey="expense"
                    name="Expenses"
                    fill="var(--color-expense)"
                    radius={[4, 4, 0, 0]}
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

      <section className="space-y-4">
        <div className="flex items-start gap-3">
          <CircleDollarSign className="mt-0.5 size-5 shrink-0 text-primary" />

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

        <Card className="border-border/70 bg-card shadow-sm">
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
