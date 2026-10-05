import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function InvestmentDialogs({
  canEdit,

  // Investment
  investmentDialogOpen,
  setInvestmentDialogOpen,
  investmentError,
  investmentForm,
  setInvestmentForm,
  savingInvestment,
  handleCreateInvestment,

  // Money movement
  moneyMovementDialogOpen,
  setMoneyMovementDialogOpen,
  moneyMovementError,
  moneyMovementForm,
  setMoneyMovementForm,
  savingMoneyMovement,
  handleCreateMoneyMovement,

  // Allocation
  allocationDialogOpen,
  setAllocationDialogOpen,
  allocationError,
  allocationForm,
  setAllocationForm,
  savingAllocation,
  handleCreateAllocation,

  // Data
  investors,
  opportunities,
  investments,
  projects,
  species,
}) {
  if (!canEdit) return null;

  return (
    <>
      {/* CREATE INVESTMENT DIALOG */}
      <Dialog
        open={investmentDialogOpen}
        onOpenChange={(open) => {
          setInvestmentDialogOpen(open);

          if (!open) {
            // Error state is controlled by parent.
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl p-7 sm:p-8">
          <DialogHeader>
            <DialogTitle>Create investment</DialogTitle>

            <DialogDescription>
              Record an investor&apos;s commitment. Actual contributions and
              project allocations are recorded separately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateInvestment} className="space-y-8">
            {investmentError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                <p className="text-sm text-destructive">{investmentError}</p>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2.5">
                <label
                  htmlFor="investment-investor"
                  className="text-sm font-medium"
                >
                  Investor
                </label>

                <select
                  id="investment-investor"
                  value={investmentForm.investorId}
                  onChange={(e) =>
                    setInvestmentForm((prev) => ({
                      ...prev,
                      investorId: e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Select investor</option>

                  {investors
                    .filter((investor) => investor.status === "active")
                    .map((investor) => (
                      <option key={investor.id} value={investor.id}>
                        {investor.name}
                        {investor.email ? ` · ${investor.email}` : ""}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="investment-opportunity"
                  className="text-sm font-medium"
                >
                  Investment opportunity
                </label>

                <select
                  id="investment-opportunity"
                  value={investmentForm.opportunityId}
                  onChange={(e) =>
                    setInvestmentForm((prev) => ({
                      ...prev,
                      opportunityId: e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Direct investment</option>

                  {opportunities
                    .filter((opportunity) => opportunity.status === "open")
                    .map((opportunity) => (
                      <option
                        key={opportunity.opportunity_id}
                        value={opportunity.opportunity_id}
                      >
                        {opportunity.title}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="investment-committed"
                  className="text-sm font-medium"
                >
                  Committed amount
                </label>

                <Input
                  id="investment-committed"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 25000"
                  value={investmentForm.committedAmount}
                  onChange={(e) =>
                    setInvestmentForm((prev) => ({
                      ...prev,
                      committedAmount: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="investment-date"
                  className="text-sm font-medium"
                >
                  Investment date
                </label>

                <Input
                  id="investment-date"
                  type="date"
                  value={investmentForm.investedAt}
                  onChange={(e) =>
                    setInvestmentForm((prev) => ({
                      ...prev,
                      investedAt: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="investment-status"
                  className="text-sm font-medium"
                >
                  Status
                </label>

                <select
                  id="investment-status"
                  value={investmentForm.status}
                  onChange={(e) =>
                    setInvestmentForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div className="space-y-2.5 sm:col-span-2">
                <label
                  htmlFor="investment-notes"
                  className="text-sm font-medium"
                >
                  Notes
                </label>

                <textarea
                  id="investment-notes"
                  value={investmentForm.notes}
                  onChange={(e) =>
                    setInvestmentForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={4}
                  className="min-h-[100px] w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border/60 pt-5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setInvestmentDialogOpen(false)}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={savingInvestment}>
                {savingInvestment ? "Creating…" : "Create investment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MONEY MOVEMENT DIALOG */}
      <Dialog
        open={moneyMovementDialogOpen}
        onOpenChange={(open) => {
          setMoneyMovementDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-2xl p-7 sm:p-8">
          <DialogHeader>
            <DialogTitle>Record money movement</DialogTitle>

            <DialogDescription>
              Record a contribution, distribution, or refund for an investor
              investment. The corresponding farm finance record is created
              together.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateMoneyMovement} className="space-y-8">
            {moneyMovementError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                <p className="text-sm text-destructive">{moneyMovementError}</p>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2.5 sm:col-span-2">
                <label
                  htmlFor="money-movement-investment"
                  className="text-sm font-medium"
                >
                  Investment
                </label>

                <select
                  id="money-movement-investment"
                  value={moneyMovementForm.investmentId}
                  onChange={(e) =>
                    setMoneyMovementForm((prev) => ({
                      ...prev,
                      investmentId: e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Select investment</option>

                  {[
                    ...new Map(
                      investments.map((investment) => [
                        investment.investment_id,
                        investment,
                      ]),
                    ).values(),
                  ]
                    .filter(
                      (investment) =>
                        !["cancelled", "refunded"].includes(
                          investment.investment_status,
                        ),
                    )
                    .map((investment) => (
                      <option
                        key={investment.investment_id}
                        value={investment.investment_id}
                      >
                        {investment.investor_name} · ৳
                        {Number(
                          investment.committed_amount || 0,
                        ).toLocaleString()}
                        {investment.opportunity_title
                          ? ` · ${investment.opportunity_title}`
                          : " · Direct investment"}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="money-movement-type"
                  className="text-sm font-medium"
                >
                  Movement type
                </label>

                <select
                  id="money-movement-type"
                  value={moneyMovementForm.type}
                  onChange={(e) =>
                    setMoneyMovementForm((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="contribution">Contribution</option>
                  <option value="distribution">Distribution</option>
                  <option value="refund">Refund</option>
                </select>
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="money-movement-amount"
                  className="text-sm font-medium"
                >
                  Amount
                </label>

                <Input
                  id="money-movement-amount"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 20000"
                  value={moneyMovementForm.amount}
                  onChange={(e) =>
                    setMoneyMovementForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="money-movement-date"
                  className="text-sm font-medium"
                >
                  Date
                </label>

                <Input
                  id="money-movement-date"
                  type="date"
                  value={moneyMovementForm.occurredAt}
                  onChange={(e) =>
                    setMoneyMovementForm((prev) => ({
                      ...prev,
                      occurredAt: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2.5 sm:col-span-2">
                <label
                  htmlFor="money-movement-notes"
                  className="text-sm font-medium"
                >
                  Notes
                </label>

                <textarea
                  id="money-movement-notes"
                  value={moneyMovementForm.notes}
                  onChange={(e) =>
                    setMoneyMovementForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  rows={4}
                  className="min-h-[100px] w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border/60 pt-5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMoneyMovementDialogOpen(false)}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={savingMoneyMovement}>
                {savingMoneyMovement ? "Recording…" : "Record movement"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ALLOCATION DIALOG */}
      <Dialog
        open={allocationDialogOpen}
        onOpenChange={(open) => {
          setAllocationDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-3xl p-7 sm:p-8">
          <DialogHeader>
            <DialogTitle>Record allocation</DialogTitle>

            <DialogDescription>
              Assign contributed investment funds to a project or specific
              species/activity.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAllocation} className="space-y-8">
            {allocationError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                <p className="text-sm text-destructive">{allocationError}</p>
              </div>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2.5 sm:col-span-2">
                <label
                  htmlFor="allocation-investment"
                  className="text-sm font-medium"
                >
                  Investment
                </label>

                <select
                  id="allocation-investment"
                  value={allocationForm.investmentId}
                  onChange={(e) =>
                    setAllocationForm((prev) => ({
                      ...prev,
                      investmentId: e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Select investment</option>

                  {[
                    ...new Map(
                      investments.map((investment) => [
                        investment.investment_id,
                        investment,
                      ]),
                    ).values(),
                  ]
                    .filter(
                      (investment) =>
                        !["cancelled", "refunded"].includes(
                          investment.investment_status,
                        ),
                    )
                    .map((investment) => {
                      const contributed = Number(
                        investment.contributed_amount || 0,
                      );

                      const allocated = Number(
                        investment.allocated_amount || 0,
                      );

                      const available = Math.max(contributed - allocated, 0);

                      return (
                        <option
                          key={investment.investment_id}
                          value={investment.investment_id}
                        >
                          {investment.investor_name} · Available ৳
                          {available.toLocaleString()}
                          {investment.opportunity_title
                            ? ` · ${investment.opportunity_title}`
                            : " · Direct investment"}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="allocation-scope"
                  className="text-sm font-medium"
                >
                  Allocation scope
                </label>

                <select
                  id="allocation-scope"
                  value={allocationForm.scopeType}
                  onChange={(e) =>
                    setAllocationForm((prev) => ({
                      ...prev,
                      scopeType: e.target.value,
                      speciesConfigId:
                        e.target.value === "full_project"
                          ? ""
                          : prev.speciesConfigId,
                      participationPct:
                        e.target.value === "full_project"
                          ? ""
                          : prev.participationPct,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="full_project">Full project</option>
                  <option value="species_activity">Species / activity</option>
                  <option value="partial">Partial</option>
                </select>
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="allocation-project"
                  className="text-sm font-medium"
                >
                  Project
                </label>

                <select
                  id="allocation-project"
                  value={allocationForm.projectId}
                  onChange={(e) =>
                    setAllocationForm((prev) => ({
                      ...prev,
                      projectId: e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Select project</option>

                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="allocation-species"
                  className="text-sm font-medium"
                >
                  Species / activity
                </label>

                <select
                  id="allocation-species"
                  value={allocationForm.speciesConfigId}
                  onChange={(e) =>
                    setAllocationForm((prev) => ({
                      ...prev,
                      speciesConfigId: e.target.value,
                    }))
                  }
                  disabled={allocationForm.scopeType === "full_project"}
                  required={allocationForm.scopeType === "species_activity"}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {allocationForm.scopeType === "full_project"
                      ? "Not applicable"
                      : "Select species / activity"}
                  </option>

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
                  htmlFor="allocation-amount"
                  className="text-sm font-medium"
                >
                  Allocation amount
                </label>

                <Input
                  id="allocation-amount"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 20000"
                  value={allocationForm.amountAllocated}
                  onChange={(e) =>
                    setAllocationForm((prev) => ({
                      ...prev,
                      amountAllocated: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              {allocationForm.scopeType === "partial" && (
                <div className="space-y-2.5">
                  <label
                    htmlFor="allocation-participation"
                    className="text-sm font-medium"
                  >
                    Participation %
                  </label>

                  <Input
                    id="allocation-participation"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="e.g. 25"
                    value={allocationForm.participationPct}
                    onChange={(e) =>
                      setAllocationForm((prev) => ({
                        ...prev,
                        participationPct: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-border/60 pt-5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAllocationDialogOpen(false)}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={savingAllocation}>
                {savingAllocation ? "Saving…" : "Record allocation"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default InvestmentDialogs;
