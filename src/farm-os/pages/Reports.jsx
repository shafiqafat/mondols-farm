import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Download, FileText, Sprout } from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";


function getDateRange(period) {
  const now = new Date();

  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === "all") {
    return { start: null, end };
  }

  if (period === "custom") {
    return { start: null, end };
  }

  const start = new Date(end);
  start.setMonth(start.getMonth() - Number(period));

  return { start, end };
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


async function fetchAllRows(buildQuery, pageSize = 1000) {
  const rows = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);

    if (error) {
      throw error;
    }

    rows.push(...(data ?? []));

    if (!data || data.length < pageSize) {
      break;
    }
  }

  return rows;
}

function Reports() {
  const [projects, setProjects] = useState([]);
  const [scope, setScope] = useState("farm");
  const [projectId, setProjectId] = useState("");
  const [period, setPeriod] = useState("3");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [activity, setActivity] = useState(null);
  const [includeActivityDetails, setIncludeActivityDetails] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      setLoadingProjects(true);
      setError("");

      const { data, error: queryError } = await supabase
        .from("farm_projects")
        .select(
          "id, name, project_type, purpose, status, started_at, target_end_at",
        )
        .order("started_at", { ascending: false });

      if (cancelled) return;

      if (queryError) {
        setError(queryError.message);
        setProjects([]);
      } else {
        setProjects(data ?? []);
      }

      setLoadingProjects(false);
    }

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === projectId),
    [projects, projectId],
  );

  async function handleGenerateReport() {
    setError("");
    setReport(null);
    setActivity(null);

    if (scope === "project" && !projectId) {
      setError("Please select a project.");
      return;
    }

    let start;
    let end;

    if (period === "custom") {
      if (!customStart || !customEnd) {
        setError("Select both the start and end dates.");
        return;
      }

      if (customStart > customEnd) {
        setError("The start date cannot be after the end date.");
        return;
      }

      start = customStart;
      end = customEnd;
    } else {
      const range = getDateRange(period);
      start = range.start ? formatLocalDate(range.start) : null;
      end = formatLocalDate(range.end);
    }

    setLoadingReport(true);

    try {
      const transactions = await fetchAllRows(() => {
        let query = supabase
          .from("finance_transactions")
          .select("id, type, amount, category, project_id, occurred_at, notes")
          .lte("occurred_at", end)
          .order("occurred_at", { ascending: true })
          .order("id", { ascending: true });

        if (start) {
          query = query.gte("occurred_at", start);
        }

        if (scope === "project") {
          query = query.eq("project_id", projectId);
        }

        return query;
      });

      const totals = transactions.reduce(
        (result, transaction) => {
          const amount = Number(transaction.amount || 0);

          if (transaction.type === "income") result.income += amount;
          if (transaction.type === "expense") result.expenses += amount;
          if (transaction.type === "asset") result.assets += amount;

          result.count += 1;
          return result;
        },
        { income: 0, expenses: 0, assets: 0, count: 0 },
      );
      
      const assignments =
        scope === "project"
          ? await fetchAllRows(() => {
              let query = supabase
                .from("farm_project_entities")
                .select("entity_id, project_id, started_at, ended_at")
                .eq("project_id", projectId);

              if (start) {
                query = query.or(`ended_at.gte.${start},ended_at.is.null`);
              }

              query = query.order("started_at", { ascending: true });

              return query;
            })
          : [];

      const assignedEntityIds = [
        ...new Set(assignments.map((assignment) => assignment.entity_id)),
      ];

      const entities = await fetchAllRows(() => {
        let entityQuery = supabase
          .from("farm_entities")
          .select("id, label, entity_name, entity_code, project_id")
          .order("id", { ascending: true });

        if (scope === "project") {
          if (assignedEntityIds.length === 0) {
            return entityQuery.limit(0);
          }

          entityQuery = entityQuery.in("id", assignedEntityIds);
        }

        return entityQuery;
      });

      const entityIds = (entities ?? []).map((entity) => entity.id);

      let events = [];

      const entityBatchSize = 100;

      for (let i = 0; i < entityIds.length; i += entityBatchSize) {
        const entityBatch = entityIds.slice(i, i + entityBatchSize);

        const batchEvents = await fetchAllRows(() => {
          let eventQuery = supabase
            .from("entity_events")
            .select("id, entity_id, type, payload, occurred_at, reversed_at")
            .in("entity_id", entityBatch)
            .is("reversed_at", null)
            .lte("occurred_at", end)
            .order("occurred_at", { ascending: true })
            .order("id", { ascending: true });

          if (start) {
            eventQuery = eventQuery.gte("occurred_at", start);
          }

          return eventQuery;
        });

        events.push(...batchEvents);
      }

      
      if (scope === "project") {
        events = events.filter((event) => {
          const eventDate = event.occurred_at.slice(0, 10);

          return assignments.some(
            (assignment) =>
              assignment.entity_id === event.entity_id &&
              assignment.started_at <= eventDate &&
              (assignment.ended_at === null || eventDate < assignment.ended_at),
          );
        });
      }

      const entityById = new Map(
        (entities ?? []).map((entity) => [entity.id, entity]),
      );

      const activityTotals = {
        eventCount: events.length,
        feedKg: 0,
        eggs: 0,
        harvestKg: 0,
        mortality: 0,
        weightChecks: 0,
      };

      for (const event of events) {
        const payload = event.payload ?? {};

        if (event.type === "feed_given") {
          activityTotals.feedKg += Number(payload.qty_kg ?? 0);
        }

        if (event.type === "egg_count") {
          activityTotals.eggs += Number(payload.count ?? 0);
        }

        if (event.type === "harvest") {
          activityTotals.harvestKg += Number(payload.qty_kg ?? 0);
        }

        if (event.type === "mortality") {
          activityTotals.mortality += Number(payload.count ?? 0);
        }

        if (event.type === "weight_check") {
          activityTotals.weightChecks += 1;
        }
      }

      const monthlyActivity = {};

      for (const event of events) {
        const month = event.occurred_at.slice(0, 7);
        const payload = event.payload ?? {};

        if (!monthlyActivity[month]) {
          monthlyActivity[month] = {
            eventCount: 0,
            feedKg: 0,
            eggs: 0,
            harvestKg: 0,
            mortality: 0,
            weightChecks: 0,
          };
        }

        const summary = monthlyActivity[month];
        summary.eventCount += 1;

        if (event.type === "feed_given") {
          summary.feedKg += Number(payload.qty_kg ?? 0);
        }

        if (event.type === "egg_count") {
          summary.eggs += Number(payload.count ?? 0);
        }

        if (event.type === "harvest") {
          summary.harvestKg += Number(payload.qty_kg ?? 0);
        }

        if (event.type === "mortality") {
          summary.mortality += Number(payload.count ?? 0);
        }
      }

      setActivity({
        totals: activityTotals,
        monthlyActivity,
        events,
        entityById: Object.fromEntries(entityById),
      });

      setReport({
        title:
          scope === "farm"
            ? "Full Farm Report"
            : `${selectedProject?.name ?? "Project"} Report`,
        projectName: selectedProject?.name ?? null,
        project: selectedProject
          ? {
              name: selectedProject.name,
              type: selectedProject.project_type,
              status: selectedProject.status,
              startedAt: selectedProject.started_at,
              purpose: selectedProject.purpose,
              targetEndAt: selectedProject.target_end_at,
            }
          : null,
        projectCount: projects.length,
        activeProjectCount: projects.filter(
          (project) => project.status === "active",
        ).length,
        period:
          period === "all"
            ? "All available history"
            : period === "custom"
              ? `${start} to ${end}`
              : `Last ${period} month(s)`,
        start,
        end,
        transactions,
        totals: {
          ...totals,
          netCash: totals.income - totals.expenses - totals.assets,
        },
        generatedAt: new Date().toLocaleString(),
      });
    } catch (err) {
      setError(err.message || "Unable to generate report.");
    } finally {
      setLoadingReport(false);
    }
  }

  function formatMoney(value) {
    return `৳${Number(value || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <style>{`@media print { @page {
      size: A4;
      margin: 14mm;
    }

    body * {
      visibility: hidden !important;
    }

    .report-print-area,
    .report-print-area * {
      visibility: visible !important;
    }

    .report-print-area {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      width: 100% !important;
      max-width: none !important;
      padding: 0 !important;
      margin: 0 !important;
      border: none !important;
      box-shadow: none !important;
      background: white !important;
      color: black !important;
    }

    .report-print-area button {
      display: none !important;
    }

    .report-print-area table {
      width: 100% !important;
      min-width: 0 !important;
      border-collapse: collapse !important;
      font-size: 9pt !important;
    }

    .report-print-area th,
    .report-print-area td {
      padding: 6px !important;
      border: 1px solid #ddd !important;
      color: black !important;
      overflow-wrap: anywhere;
    }

    .report-print-area tr {
      break-inside: avoid;
    }

    .report-print-area h1,
    .report-print-area h2,
    .report-print-area h3 {
      color: black !important;
    }
  }
`}</style>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Farm Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate readable reports for your farm or individual projects.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-xl">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-lg bg-primary/10 p-3">
              <Sprout className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Full Farm Report</h2>
              <p className="text-sm text-muted-foreground">
                Review farm-wide financial activity.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="rounded-lg bg-primary/10 p-3">
              <FileText className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Project Report</h2>
              <p className="text-sm text-muted-foreground">
                Review finances for a selected project.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl">
        <CardContent className="space-y-5 p-5">
          <div>
            <h2 className="text-lg font-semibold">Generate a Report</h2>
            <p className="text-sm text-muted-foreground">
              Choose the scope and reporting period.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="report-scope" className="text-sm font-medium">
                Report scope
              </label>
              <select
                id="report-scope"
                value={scope}
                onChange={(event) => {
                  setScope(event.target.value);
                  setReport(null);
                }}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="farm">Entire farm</option>
                <option value="project">Specific project</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="report-period" className="text-sm font-medium">
                Reporting period
              </label>
              <select
                id="report-period"
                value={period}
                onChange={(event) => {
                  setPeriod(event.target.value);
                  setReport(null);
                }}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="1">Last 1 month</option>
                <option value="3">Last 3 months</option>
                <option value="6">Last 6 months</option>
                <option value="12">Last 12 months</option>
                <option value="all">All available history</option>
                <option value="custom">Custom date range</option>
              </select>
            </div>

            {scope === "project" && (
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="report-project" className="text-sm font-medium">
                  Project
                </label>
                <select
                  id="report-project"
                  value={projectId}
                  onChange={(event) => {
                    setProjectId(event.target.value);
                    setReport(null);
                  }}
                  disabled={loadingProjects}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">
                    {loadingProjects
                      ? "Loading projects..."
                      : "Select a project"}
                  </option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {period === "custom" && (
              <>
                <div className="space-y-2">
                  <label htmlFor="report-start" className="text-sm font-medium">
                    Start date
                  </label>
                  <input
                    id="report-start"
                    type="date"
                    value={customStart}
                    onChange={(event) => setCustomStart(event.target.value)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="report-end" className="text-sm font-medium">
                    End date
                  </label>
                  <input
                    id="report-end"
                    type="date"
                    value={customEnd}
                    onChange={(event) => setCustomEnd(event.target.value)}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <label className="flex items-start gap-3 rounded-lg border p-3">
            <input
              type="checkbox"
              checked={includeActivityDetails}
              onChange={(event) =>
                setIncludeActivityDetails(event.target.checked)
              }
              className="mt-1 size-4"
            />

            <span>
              <span className="block text-sm font-medium">
                Include individual daily activity records
              </span>
              <span className="block text-sm text-muted-foreground">
                Adds every recorded activity to the report. This may make longer
                reports substantially larger.
              </span>
            </span>
          </label>
          <Button onClick={handleGenerateReport} disabled={loadingReport}>
            <CalendarRange className="mr-2 size-4" />
            {loadingReport ? "Generating..." : "Generate Report"}
          </Button>
        </CardContent>
      </Card>

      {report && (
        <Card className="report-print-area rounded-xl">
          <CardContent className="space-y-5 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Mondol's Farm
                </p>
                <h2 className="mt-1 text-xl font-semibold">{report.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {report.period}
                </p>
                <p className="text-xs text-muted-foreground">
                  Generated {report.generatedAt}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => window.print()}
              >
                <Download className="mr-2 size-4" />
                Print / Save as PDF
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Income", report.totals.income],
                ["Expenses", report.totals.expenses],
                ["Asset purchases", report.totals.assets],
                ["Net cash movement", report.totals.netCash],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="mt-2 text-xl font-semibold">
                    {formatMoney(value)}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <h3 className="font-semibold">Transaction summary</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {report.totals.count} transactions included.
              </p>
            </div>

            {report.project ? (
              <section className="rounded-lg border p-4">
                <h3 className="font-semibold">Project details</h3>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Project type
                    </p>
                    <p className="font-medium">{report.project.type || "—"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">
                      {report.project.status || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Started</p>
                    <p className="font-medium">
                      {report.project.startedAt || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Target end date
                    </p>
                    <p className="font-medium">
                      {report.project.targetEndAt || "—"}
                    </p>
                  </div>

                  {report.project.purpose && (
                    <div className="sm:col-span-2">
                      <p className="text-sm text-muted-foreground">Purpose</p>
                      <p>{report.project.purpose}</p>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <section className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Total projects
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {report.projectCount}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Active projects
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {report.activeProjectCount}
                  </p>
                </div>
              </section>
            )}

            {report.transactions.length === 0 ? (
              <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No financial transactions were found for this scope and period.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium">Type</th>
                      <th className="p-3 font-medium">Category</th>
                      {scope === "farm" && (
                        <th className="p-3 font-medium">Project</th>
                      )}
                      <th className="p-3 text-right font-medium">Amount</th>
                      <th className="p-3 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-t">
                        <td className="p-3">{transaction.occurred_at}</td>
                        <td className="p-3 capitalize">{transaction.type}</td>
                        <td className="p-3">{transaction.category || "—"}</td>
                        {scope === "farm" && (
                          <td className="p-3">
                            {projects.find(
                              (project) =>
                                project.id === transaction.project_id,
                            )?.name ||
                              (transaction.project_id
                                ? "Unknown project"
                                : "General")}
                          </td>
                        )}
                        <td className="p-3 text-right font-medium">
                          {formatMoney(transaction.amount)}
                        </td>
                        <td className="p-3">{transaction.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {activity && (
              <section className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Farm Activity & Production
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Recorded activity for the selected reporting period.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {[
                    ["Recorded events", activity.totals.eventCount],
                    [
                      "Feed given",
                      `${activity.totals.feedKg.toLocaleString()} kg`,
                    ],
                    ["Eggs recorded", activity.totals.eggs.toLocaleString()],
                    [
                      "Harvest",
                      `${activity.totals.harvestKg.toLocaleString()} kg`,
                    ],
                    [
                      "Weight checks",
                      activity.totals.weightChecks.toLocaleString(),
                    ],
                    [
                      "Mortality recorded",
                      activity.totals.mortality.toLocaleString(),
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="mt-2 text-xl font-semibold">{value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="font-semibold">Monthly Activity Summary</h3>

                  {Object.keys(activity.monthlyActivity).length === 0 ? (
                    <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                      No activity records found for this period.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="w-full min-w-[650px] text-left text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="p-3">Month</th>
                            <th className="p-3">Records</th>
                            <th className="p-3">Feed (kg)</th>
                            <th className="p-3">Eggs</th>
                            <th className="p-3">Harvest (kg)</th>
                            <th className="p-3">Weight checks</th>
                            <th className="p-3">Mortality</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(activity.monthlyActivity)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([month, summary]) => (
                              <tr key={month} className="border-t">
                                <td className="p-3">{month}</td>
                                <td className="p-3">{summary.eventCount}</td>
                                <td className="p-3">
                                  {summary.feedKg.toLocaleString()}
                                </td>
                                <td className="p-3">
                                  {summary.eggs.toLocaleString()}
                                </td>
                                <td className="p-3">
                                  {summary.harvestKg.toLocaleString()}
                                </td>
                                <td className="p-3">
                                  {summary.weightChecks.toLocaleString()}
                                </td>
                                <td className="p-3">
                                  {summary.mortality.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {includeActivityDetails && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">
                      Detailed Daily Activity Records
                    </h3>

                    {activity.events.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No individual activity records are available.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border">
                        <table className="w-full min-w-[600px] text-left text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="p-3">Date</th>
                              <th className="p-3">Entity</th>
                              <th className="p-3">Activity</th>
                              <th className="p-3">Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activity.events.map((event) => {
                              const entity =
                                activity.entityById[event.entity_id];
                              const payload = event.payload ?? {};

                              const details =
                                payload.qty_kg != null
                                  ? `${payload.qty_kg} kg`
                                  : payload.count != null
                                    ? payload.count
                                    : payload.kg != null
                                      ? `${payload.kg} kg`
                                      : (payload.text ?? "—");

                              return (
                                <tr key={event.id} className="border-t">
                                  <td className="p-3">{event.occurred_at}</td>
                                  <td className="p-3">
                                    {entity?.entity_name ||
                                      entity?.label ||
                                      entity?.entity_code ||
                                      "Unknown entity"}
                                  </td>
                                  <td className="p-3">
                                    {event.type.replaceAll("_", " ")}
                                  </td>
                                  <td className="p-3">{String(details)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Reports;
