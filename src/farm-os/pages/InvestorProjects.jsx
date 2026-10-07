import { useState } from "react";
import { useInvestorProjectAllocations } from "../hooks/useInvestorProjectAllocations";
import { useInvestorProjectDetail } from "../hooks/useInvestorProjectDetail";

function formatMoney(value) {
  return `৳${Number(value ?? 0).toLocaleString()}`;
}

function getScopeLabel(scopeType) {
  if (scopeType === "full_project") {
    return "Full Project";
  }

  return "Partial";
}
function formatDate(value) {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function InvestorProjects() {
  const { projects, loading, error, reload } = useInvestorProjectAllocations();
  const [selectedProject, setSelectedProject] = useState(null);

  const {
    project: projectDetail,
    loading: projectDetailLoading,
    error: projectDetailError,
    loadProject,
  } = useInvestorProjectDetail();

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="font-medium">Unable to load projects.</p>

        <p className="mt-2 text-sm text-destructive">{error}</p>

        <button
          type="button"
          onClick={reload}
          className="mt-4 text-sm font-medium underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Portfolio
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          My Projects
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Projects where your investments are currently allocated.
        </p>
      </section>

      {projects.length === 0 ? (
        <section className="rounded-xl border bg-card p-8 text-center shadow-sm">
          <p className="font-medium">No invested projects yet.</p>

          <p className="mt-2 text-sm text-muted-foreground">
            Projects will appear here when your investment is allocated.
          </p>
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2">
          {projects.map((project) => (
            <article
              key={project.project_id}
              className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {project.project_name}
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {project.project_type || "Project"}
                  </p>
                </div>

                <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                  {getScopeLabel(project.scope_type)}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Your allocation
                  </p>

                  <p className="mt-1 text-xl font-semibold">
                    {formatMoney(project.allocated_amount)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Investments</p>

                  <p className="mt-1 text-xl font-semibold">
                    {project.investment_count}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedProject(project);
                    await loadProject(project.project_id);
                  }}
                  className="text-sm font-medium hover:underline"
                >
                  View project
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
      {selectedProject && (
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Project Details
              </p>

              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                {selectedProject.project_name}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {selectedProject.project_type || "Project"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="text-sm font-medium hover:underline"
            >
              Close
            </button>
          </div>

          {projectDetailLoading && (
            <p className="mt-4 text-sm text-muted-foreground">
              Loading project details...
            </p>
          )}

          {projectDetailError && (
            <p className="mt-4 text-sm text-destructive">
              {projectDetailError}
            </p>
          )}

          {projectDetail && (
            <div className="mt-6">
              <p className="text-sm font-medium">Project Overview</p>

              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Purpose</p>
                  <p className="mt-1 font-medium">
                    {projectDetail.purpose || "—"}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="mt-1 font-medium capitalize">
                    {projectDetail.project_status || "—"}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Project Type</p>
                  <p className="mt-1 font-medium">
                    {projectDetail.project_type || "—"}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Started</p>
                  <p className="mt-1 font-medium">
                    {formatDate(projectDetail.started_at)}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Target End</p>
                  <p className="mt-1 font-medium">
                    {formatDate(projectDetail.target_end_at)}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="mt-1 font-medium">
                    {formatDate(projectDetail.completed_at)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {projectDetail?.operational_summary && (
            <div className="mt-6">
              <p className="text-sm font-medium">Project Operations</p>

              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Entities</p>
                  <p className="mt-1 text-xl font-semibold">
                    {projectDetail.operational_summary.entity_count}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Active Entities
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    {projectDetail.operational_summary.active_entity_count}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Total Quantity
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    {Number(
                      projectDetail.operational_summary.total_quantity ?? 0,
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    Species / Activities
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    {projectDetail.operational_summary.species_count}
                  </p>
                </div>
              </div>

              {projectDetail.operational_summary.exposure_scope ===
                "full_project" && (
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                      Project Income
                    </p>
                    <p className="mt-1 text-xl font-semibold">
                      {formatMoney(
                        projectDetail.operational_summary.total_income,
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                      Project Expenses
                    </p>
                    <p className="mt-1 text-xl font-semibold">
                      {formatMoney(
                        projectDetail.operational_summary.total_expense,
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                      Net Financial Position
                    </p>
                    <p className="mt-1 text-xl font-semibold">
                      {formatMoney(
                        projectDetail.operational_summary
                          .net_financial_position,
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {projectDetail?.species_breakdown?.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium">Species / Activities</p>

              <div className="mt-3 overflow-hidden rounded-lg border">
                <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground">
                  <span>Species / Activity</span>
                  <span>Entities</span>
                  <span>Active</span>
                  <span>Quantity</span>
                </div>

                {projectDetail.species_breakdown.map((species) => (
                  <div
                    key={species.species_config_id}
                    className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-4 border-b px-4 py-4 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium">{species.species_name}</p>

                      {species.category && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {species.category}
                        </p>
                      )}
                    </div>

                    <p className="text-sm">{species.entity_count}</p>

                    <p className="text-sm">{species.active_entity_count}</p>

                    <p className="text-sm font-medium">
                      {Number(species.total_quantity ?? 0).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {projectDetail && (
            <div className="mt-6">
              <p className="text-sm font-medium">Production Summary</p>

              {projectDetail.production_summary?.length > 0 ? (
                <div className="mt-3 overflow-hidden rounded-lg border">
                  <div className="grid grid-cols-[1.4fr_1.4fr_1fr_1fr_1fr] gap-4 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground">
                    <span>Production</span>
                    <span>Species / Activity</span>
                    <span>Quantity</span>
                    <span>Events</span>
                    <span>Latest</span>
                  </div>

                  {projectDetail.production_summary.map((production, index) => (
                    <div
                      key={`${production.event_type}-${production.species_config_id}-${production.unit}-${index}`}
                      className="grid grid-cols-[1.4fr_1.4fr_1fr_1fr_1fr] gap-4 border-b px-4 py-3 text-sm last:border-b-0"
                    >
                      <span className="font-medium">
                        {production.event_type === "egg_count"
                          ? "Egg Count"
                          : "Harvest"}
                      </span>

                      <span>{production.species_name || "—"}</span>

                      <span>
                        {Number(
                          production.total_quantity ?? 0,
                        ).toLocaleString()}{" "}
                        {production.unit || ""}
                      </span>

                      <span>{production.event_count ?? 0}</span>

                      <span>{formatDate(production.latest_occurred_at)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-lg border px-4 py-5">
                  <p className="text-sm text-muted-foreground">
                    No production recorded yet.
                  </p>
                </div>
              )}
            </div>
          )}
          {projectDetail?.recent_activity && (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Recent Activity</p>

                <span className="text-xs text-muted-foreground">
                  Latest project activity
                </span>
              </div>

              {projectDetail.recent_activity.length > 0 ? (
                <div className="mt-3 overflow-hidden rounded-lg border">
                  {projectDetail.recent_activity.map((activity, index) => (
                    <div
                      key={`${activity.event_type}-${activity.occurred_at}-${index}`}
                      className="flex items-center justify-between gap-4 border-b px-4 py-4 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">
                          {activity.event_type === "egg_count"
                            ? "Egg Count"
                            : activity.event_type === "weight_check"
                              ? "Weight Check"
                              : activity.event_type === "feed_given"
                                ? "Feed Given"
                                : activity.event_type === "fertilizer_applied"
                                  ? "Fertilizer Applied"
                                  : activity.event_type
                                      .replaceAll("_", " ")
                                      .replace(/\b\w/g, (char) =>
                                        char.toUpperCase(),
                                      )}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {activity.species_name || "Project activity"}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(activity.occurred_at)}
                        </p>
                      </div>

                      {activity.metric_value !== null &&
                        activity.metric_value !== undefined && (
                          <div className="shrink-0 text-right">
                            <p className="font-medium">
                              {Number(activity.metric_value).toLocaleString()}
                            </p>

                            {activity.metric_unit && (
                              <p className="text-xs text-muted-foreground">
                                {activity.metric_unit}
                              </p>
                            )}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-lg border px-4 py-5">
                  <p className="text-sm text-muted-foreground">
                    No recent activity recorded yet.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Your Allocation</p>

              <p className="mt-1 text-xl font-semibold">
                {formatMoney(selectedProject.allocated_amount)}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Investments</p>

              <p className="mt-1 text-xl font-semibold">
                {selectedProject.investment_count}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Investment Scope</p>

              <p className="mt-1 text-xl font-semibold">
                {getScopeLabel(selectedProject.scope_type)}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Portfolio Allocation
              </p>

              <p className="mt-1 text-xl font-semibold">
                {projectDetail?.allocation_percentage
                  ? `${Number(
                      projectDetail.allocation_percentage
                        .allocation_percentage ?? 0,
                    ).toLocaleString()}%`
                  : "—"}
              </p>

              {projectDetail?.allocation_percentage && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Of your total allocated investments
                </p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
