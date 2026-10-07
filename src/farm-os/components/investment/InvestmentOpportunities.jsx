import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

function InvestmentOpportunities({
  opportunities,
  projects,
  species,
  canEdit,
  opportunityDialogOpen,
  setOpportunityDialogOpen,
  editingOpportunity,
  setEditingOpportunity,
  opportunityForm,
  setOpportunityForm,
  opportunityError,
  setOpportunityError,
  savingOpportunity,
  handleCreateOpportunity,
  handleUpdateOpportunity,
  formatDateForInput,
  getOpportunityStatusOptions,
}) {
  function getEmptyOpportunityForm() {
    return {
      title: "",
      description: "",
      projectId: "",
      speciesConfigId: "",
      targetAmount: "",
      minimumAmount: "",
      roiDurationMonths: "",
      roiMinPercent: "",
      roiMaxPercent: "",
      openedAt: "",
      closesAt: "",
      status: "draft",
      visibility: "private",
    };
  }
  function getOpportunityStatusClass(status) {
    switch (status) {
      case "open":
        return "border-primary/30 bg-primary/10 text-primary";

      case "fully_funded":
        return "border-primary/40 bg-primary/15 text-primary";

      case "upcoming":
        return "border-border bg-muted/50 text-foreground";

      case "closed":
        return "border-border bg-muted/30 text-muted-foreground";

      case "cancelled":
        return "border-destructive/30 bg-destructive/10 text-destructive";

      case "draft":
      default:
        return "border-border bg-muted/30 text-muted-foreground";
    }
  }
  const hasInvestmentHistory =
    Boolean(editingOpportunity) &&
    Number(editingOpportunity.investment_count || 0) > 0;
  return (
    <>
      <section className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Investment Opportunities
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Projects and activities currently available for investor
              participation.
            </p>
          </div>

          {canEdit && (
            <Button
              type="button"
              onClick={() => {
                setOpportunityError("");
                setEditingOpportunity(null);
                setOpportunityForm(getEmptyOpportunityForm());
                setOpportunityDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              Create opportunity
            </Button>
          )}
        </div>

        {opportunities.length === 0 ? (
          <Card className="border-border/70 bg-card shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                No investment opportunities have been created yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {opportunities.map((opportunity) => {
              const target = Number(opportunity.target_amount || 0);
              const committed = Number(opportunity.total_committed || 0);
              const contributed = Number(opportunity.total_contributed || 0);
              const minimum = Number(opportunity.minimum_amount || 0);

              const contributionProgress =
                target > 0 ? Math.min((contributed / target) * 100, 100) : 0;

              const statusLabel =
                opportunity.status?.replaceAll("_", " ") || "Unknown";

              return (
                <Card
                  key={opportunity.opportunity_id}
                  className="h-full border-border/70 bg-card shadow-sm"
                >
                  <CardContent className="flex h-full flex-col p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold tracking-[-0.02em]">
                          {opportunity.title}
                        </h3>
                      </div>

                      <span
                        className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-medium capitalize ${getOpportunityStatusClass(
                          opportunity.status,
                        )}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    {/* Project context */}
                    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border/60 py-4">
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                          Project
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {opportunity.project_name || "No project linked"}
                        </p>
                      </div>

                      <div className="hidden h-8 w-px bg-border sm:block" />

                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                          Activity
                        </p>

                        <p className="mt-1 text-sm font-medium">
                          {opportunity.species_name || "All activities"}
                        </p>
                      </div>

                      <div className="hidden h-8 w-px bg-border sm:block" />

                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                          Visibility
                        </p>

                        <p className="mt-1 text-sm font-medium capitalize">
                          {opportunity.visibility || "Private"}
                        </p>
                      </div>
                    </div>

                    {/* Financial metrics */}
                    <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Target</p>

                        <p className="mt-1.5 text-lg font-semibold">
                          ৳{target.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Committed
                        </p>

                        <p className="mt-1.5 text-lg font-semibold">
                          ৳{committed.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Raised</p>

                        <p className="mt-1.5 text-lg font-semibold text-primary">
                          ৳{contributed.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Minimum</p>

                        <p className="mt-1.5 text-lg font-semibold">
                          {minimum > 0 ? `৳${minimum.toLocaleString()}` : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Funding progress */}
                    <div className="mt-7">
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium">
                            Funding progress
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Based on actual contributions received.
                          </p>
                        </div>

                        <span className="text-sm font-semibold">
                          {Math.round(contributionProgress)}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${contributionProgress}%`,
                          }}
                        />
                      </div>

                      <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                        <span>৳{contributed.toLocaleString()} raised</span>

                        <span>
                          ৳{Math.max(target - contributed, 0).toLocaleString()}{" "}
                          remaining
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 flex flex-col gap-4 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        <span>
                          {opportunity.investment_count} investment
                          {opportunity.investment_count === 1 ? "" : "s"}
                        </span>

                        {opportunity.opened_at && (
                          <span>
                            Opened {formatDateForInput(opportunity.opened_at)}
                          </span>
                        )}

                        {opportunity.closes_at && (
                          <span>
                            Closes {formatDateForInput(opportunity.closes_at)}
                          </span>
                        )}
                      </div>

                      {canEdit && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOpportunityError("");
                            setEditingOpportunity(opportunity);

                            setOpportunityForm({
                              title: opportunity.title ?? "",
                              description: opportunity.description ?? "",
                              projectId: opportunity.project_id ?? "",
                              speciesConfigId:
                                opportunity.species_config_id ?? "",
                              targetAmount: opportunity.target_amount ?? "",
                              minimumAmount: opportunity.minimum_amount ?? "",
                              roiDurationMonths:
                                opportunity.roi_duration_months ?? "",
                              roiMinPercent: opportunity.roi_min_percent ?? "",
                              roiMaxPercent: opportunity.roi_max_percent ?? "",
                              openedAt: formatDateForInput(
                                opportunity.opened_at,
                              ),
                              closesAt: formatDateForInput(
                                opportunity.closes_at,
                              ),
                              status: opportunity.status ?? "draft",
                              visibility: opportunity.visibility ?? "private",
                            });

                            setOpportunityDialogOpen(true);
                          }}
                        >
                          Edit opportunity
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
      {canEdit && (
        <Dialog
          open={opportunityDialogOpen}
          onOpenChange={(open) => {
            setOpportunityDialogOpen(open);

            if (!open) {
              setOpportunityError("");
              setEditingOpportunity(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-3xl p-7 sm:p-8">
            <DialogHeader>
              <DialogTitle>
                {editingOpportunity
                  ? "Edit investment opportunity"
                  : "Create investment opportunity"}
              </DialogTitle>

              <DialogDescription>
                {editingOpportunity
                  ? "Update the opportunity details without changing its investment history."
                  : "Define a project or activity that can be offered to investors."}
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={
                editingOpportunity
                  ? handleUpdateOpportunity
                  : handleCreateOpportunity
              }
              className="space-y-8"
            >
              {opportunityError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                  <p className="text-sm text-destructive">{opportunityError}</p>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-title"
                    className="text-sm font-medium"
                  >
                    Opportunity title
                  </label>

                  <Input
                    id="opportunity-title"
                    placeholder="e.g. Quail Farm Expansion"
                    value={opportunityForm.title}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-target"
                    className="text-sm font-medium"
                  >
                    Target amount
                  </label>

                  <Input
                    id="opportunity-target"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 50000"
                    value={opportunityForm.targetAmount}
                    disabled={hasInvestmentHistory}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        targetAmount: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-minimum"
                    className="text-sm font-medium"
                  >
                    Minimum investment
                  </label>

                  <Input
                    id="opportunity-minimum"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="e.g. 20000"
                    value={opportunityForm.minimumAmount}
                    disabled={hasInvestmentHistory}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        minimumAmount: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-roi-duration"
                    className="text-sm font-medium"
                  >
                    Project duration
                  </label>

                  <Input
                    id="opportunity-roi-duration"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 6"
                    value={opportunityForm.roiDurationMonths}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        roiDurationMonths: e.target.value,
                      }))
                    }
                  />

                  <p className="text-xs text-muted-foreground">
                    Duration used to determine the expected ROI range.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-roi-min"
                    className="text-sm font-medium"
                  >
                    Base ROI minimum
                  </label>

                  <Input
                    id="opportunity-roi-min"
                    type="number"
                    min="0"
                    max="20"
                    step="0.01"
                    placeholder="e.g. 8"
                    value={opportunityForm.roiMinPercent}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        roiMinPercent: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-roi-max"
                    className="text-sm font-medium"
                  >
                    Base ROI maximum
                  </label>

                  <Input
                    id="opportunity-roi-max"
                    type="number"
                    min="0"
                    max="20"
                    step="0.01"
                    placeholder="e.g. 10"
                    value={opportunityForm.roiMaxPercent}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        roiMaxPercent: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-project"
                    className="text-sm font-medium"
                  >
                    Linked project
                  </label>

                  <select
                    id="opportunity-project"
                    value={opportunityForm.projectId}
                    disabled={hasInvestmentHistory}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        projectId: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">No project linked</option>

                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                        {project.status === "completed" ? " (Completed)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-species"
                    className="text-sm font-medium"
                  >
                    Species / activity
                  </label>

                  <select
                    id="opportunity-species"
                    value={opportunityForm.speciesConfigId}
                    disabled={hasInvestmentHistory}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        speciesConfigId: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="">All species / activity</option>

                    {species.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                        {item.category ? ` · ${item.category}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-opened"
                    className="text-sm font-medium"
                  >
                    Opening date
                  </label>

                  <Input
                    id="opportunity-opened"
                    type="date"
                    value={opportunityForm.openedAt}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        openedAt: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-closes"
                    className="text-sm font-medium"
                  >
                    Closing date
                  </label>

                  <Input
                    id="opportunity-closes"
                    type="date"
                    value={opportunityForm.closesAt}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        closesAt: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-status"
                    className="text-sm font-medium"
                  >
                    Status
                  </label>

                  <select
                    id="opportunity-status"
                    value={opportunityForm.status}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {getOpportunityStatusOptions(
                      editingOpportunity?.status,
                      Boolean(editingOpportunity),
                    ).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="opportunity-visibility"
                    className="text-sm font-medium"
                  >
                    Visibility
                  </label>

                  <select
                    id="opportunity-visibility"
                    value={opportunityForm.visibility}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        visibility: e.target.value,
                      }))
                    }
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="private">Private</option>
                    <option value="investors">Investors</option>
                    <option value="public">Public</option>
                  </select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label
                    htmlFor="opportunity-description"
                    className="text-sm font-medium"
                  >
                    Description
                  </label>

                  <textarea
                    id="opportunity-description"
                    placeholder="Describe the project, investment purpose, expected use of funds, etc."
                    value={opportunityForm.description}
                    onChange={(e) =>
                      setOpportunityForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                    className="min-h-[100px] w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border/60 pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpportunityDialogOpen(false)}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={savingOpportunity}>
                  {savingOpportunity
                    ? editingOpportunity
                      ? "Saving…"
                      : "Creating…"
                    : editingOpportunity
                      ? "Save changes"
                      : "Create opportunity"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export default InvestmentOpportunities;