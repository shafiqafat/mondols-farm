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
  return (
    <>
      <section className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              Investment Opportunities
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Projects and activities currently available for investor
              participation.
            </p>
          </div>
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

              return (
                <Card
                  key={opportunity.opportunity_id}
                  className="border-border/70 bg-card shadow-sm"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-lg font-semibold tracking-[-0.02em]">
                          {opportunity.title}
                        </p>

                        {opportunity.description && (
                          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                            {opportunity.description}
                          </p>
                        )}
                      </div>

                      <span className="shrink-0 rounded-full border border-border px-2.5 py-1 text-xs font-medium capitalize">
                        {opportunity.status}
                      </span>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Target</p>
                        <p className="mt-1 text-sm font-semibold">
                          ৳{target.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Committed
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          ৳{committed.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Raised</p>
                        <p className="mt-1 text-sm font-semibold text-primary">
                          ৳{contributed.toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">Minimum</p>
                        <p className="mt-1 text-sm font-semibold">
                          {minimum > 0 ? `৳${minimum.toLocaleString()}` : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Funding progress
                        </span>

                        <span className="font-medium">
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
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {opportunity.investment_count} investment
                          {opportunity.investment_count === 1 ? "" : "s"}
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground capitalize">
                          {opportunity.visibility}
                        </p>
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
                          Edit
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
                    htmlFor="opportunity-project"
                    className="text-sm font-medium"
                  >
                    Linked project
                  </label>

                  <select
                    id="opportunity-project"
                    value={opportunityForm.projectId}
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