import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { supabase } from "../../lib/supabaseClient";

function InvestmentDetail({ investment, open, onOpenChange }) {
  const [projectExposure, setProjectExposure] = useState([]);
  const [exposureLoading, setExposureLoading] = useState(false);
  const [exposureError, setExposureError] = useState("");
  const [investmentTransactions, setInvestmentTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsError, setTransactionsError] = useState("");

  useEffect(() => {
    if (!open || !investment) {
      return;
    }

    let cancelled = false;

    async function loadTransactions() {
      setTransactionsLoading(true);
      setTransactionsError("");

      try {
        const { data, error } = await supabase
          .from("investment_transactions")
          .select(
            `
          id,
          type,
          amount,
          occurred_at,
          finance_transaction_id,
          notes,
          created_at
        `,
          )
          .eq("investment_id", investment.investment_id)
          .order("occurred_at", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        if (cancelled) {
          return;
        }

        setInvestmentTransactions(data ?? []);
        setTransactionsLoading(false);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setTransactionsError(
          error?.message || "Unable to load investment transactions.",
        );
        setInvestmentTransactions([]);
        setTransactionsLoading(false);
      }
    }

    async function loadExposure() {
      setExposureLoading(true);
      setExposureError("");

      try {
        const allocationResults = await Promise.all(
          investment.allocations.map(async (allocation) => {
            const { data: project, error: projectError } = await supabase
              .from("farm_projects")
              .select(
                "id, name, project_type, purpose, started_at, target_end_at, completed_at, status",
              )
              .eq("id", allocation.projectId)
              .maybeSingle();

            if (projectError) {
              throw projectError;
            }

            let entityQuery = supabase
              .from("farm_entities")
              .select(
                `
      id,
      label,
      entity_code,
      entity_name,
      tracking_mode,
      status,
      quantity,
      species_config_id,
      variant:variant_id(
        id,
        name,
        variant_type
      )
    `,
              )
              .eq("project_id", allocation.projectId);

            if (
              (allocation.scopeType === "species_activity" ||
                allocation.scopeType === "partial") &&
              allocation.speciesConfigId
            ) {
              entityQuery = entityQuery.eq(
                "species_config_id",
                allocation.speciesConfigId,
              );
            }

            const { data: entities, error: entityError } = await entityQuery;

            if (entityError) {
              throw entityError;
            }

            let species = null;

            if (allocation.speciesConfigId) {
              const { data: speciesData, error: speciesError } = await supabase
                .from("species_config")
                .select("id, name, category, tracking_mode")
                .eq("id", allocation.speciesConfigId)
                .maybeSingle();

              if (speciesError) {
                throw speciesError;
              }

              species = speciesData;
            }

            const entityList = entities ?? [];

            const totalQuantity = entityList.reduce(
              (sum, entity) => sum + Number(entity.quantity || 0),
              0,
            );

            const activeEntities = entityList.filter(
              (entity) => entity.status === "active",
            ).length;

            return {
              allocation,
              project,
              species,
              entityCount: entityList.length,
              totalQuantity,
              activeEntities,
              closedEntities: entityList.length - activeEntities,
            };
          }),
        );

        if (cancelled) {
          return;
        }

        setProjectExposure(allocationResults);
        setExposureLoading(false);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setExposureError(error?.message || "Unable to load project exposure.");
        setProjectExposure([]);
        setExposureLoading(false);
      }
    }
    loadTransactions();
    loadExposure();

    return () => {
      cancelled = true;
    };
  }, [open, investment]);

  if (!investment) {
    return null;
  }

  const committed = Number(investment.committed_amount || 0);
  const contributed = Number(investment.contributed_amount || 0);
  const allocated = Number(investment.allocated_amount || 0);
  const unallocated = Math.max(contributed - allocated, 0);

  const allocations = investment.allocations || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl p-7 sm:p-8">
        <DialogHeader>
          <DialogTitle>Investment details</DialogTitle>

          <DialogDescription>
            Complete position and allocation details for this investment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-7">
          {/* Investor / opportunity */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Investor</p>

              <p className="mt-1 font-semibold">{investment.investor_name}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Opportunity</p>

              <p className="mt-1 font-semibold">
                {investment.opportunity_title || "Direct investment"}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Status</p>

              <p className="mt-1 font-medium capitalize">
                {investment.investment_status}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Investment date</p>

              <p className="mt-1 font-medium">
                {investment.invested_at
                  ? new Date(investment.invested_at).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>

          {/* Financial position */}
          <div>
            <h3 className="text-sm font-semibold">Financial position</h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-border/70 p-4">
                <p className="text-xs text-muted-foreground">Committed</p>

                <p className="mt-1 text-xl font-semibold">
                  ৳{committed.toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg border border-border/70 p-4">
                <p className="text-xs text-muted-foreground">Contributed</p>

                <p className="mt-1 text-xl font-semibold text-primary">
                  ৳{contributed.toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg border border-border/70 p-4">
                <p className="text-xs text-muted-foreground">Allocated</p>

                <p className="mt-1 text-xl font-semibold">
                  ৳{allocated.toLocaleString()}
                </p>
              </div>

              <div className="rounded-lg border border-border/70 p-4">
                <p className="text-xs text-muted-foreground">Unallocated</p>

                <p className="mt-1 text-xl font-semibold">
                  ৳{unallocated.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Money movements */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Money movements</h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Contributions, distributions, refunds, and other recorded
                  investment transactions.
                </p>
              </div>

              <span className="text-xs text-muted-foreground">
                {investmentTransactions.length} transaction
                {investmentTransactions.length === 1 ? "" : "s"}
              </span>
            </div>

            {transactionsLoading ? (
              <div className="mt-4 rounded-lg border border-border/70 p-5">
                <p className="text-sm text-muted-foreground">
                  Loading transaction history…
                </p>
              </div>
            ) : transactionsError ? (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-5">
                <p className="text-sm text-destructive">
                  Unable to load transaction history: {transactionsError}
                </p>
              </div>
            ) : investmentTransactions.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-border p-5">
                <p className="text-sm text-muted-foreground">
                  No investment transactions have been recorded yet.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-lg border border-border/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30 text-left">
                        <th className="px-4 py-3 font-medium text-muted-foreground">
                          Date
                        </th>

                        <th className="px-4 py-3 font-medium text-muted-foreground">
                          Type
                        </th>

                        <th className="px-4 py-3 font-medium text-muted-foreground">
                          Amount
                        </th>

                        <th className="px-4 py-3 font-medium text-muted-foreground">
                          Finance link
                        </th>

                        <th className="px-4 py-3 font-medium text-muted-foreground">
                          Notes
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border/60">
                      {investmentTransactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-4 py-3">
                            {transaction.occurred_at
                              ? new Date(
                                  transaction.occurred_at,
                                ).toLocaleDateString()
                              : "—"}
                          </td>

                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs font-medium capitalize">
                              {transaction.type.replaceAll("_", " ")}
                            </span>
                          </td>

                          <td className="px-4 py-3 font-semibold">
                            ৳{Number(transaction.amount || 0).toLocaleString()}
                          </td>

                          <td className="px-4 py-3">
                            {transaction.finance_transaction_id ? (
                              <span className="text-sm font-medium">
                                Linked
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Not linked
                              </span>
                            )}
                          </td>

                          <td className="max-w-[240px] px-4 py-3 text-muted-foreground">
                            {transaction.notes || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Operational exposure */}
          <div>
            <h3 className="text-sm font-semibold">Operational exposure</h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Farm activity currently covered by this investment.
            </p>

            {exposureLoading ? (
              <div className="mt-4 rounded-lg border border-border/70 p-5">
                <p className="text-sm text-muted-foreground">
                  Loading project data…
                </p>
              </div>
            ) : exposureError ? (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-5">
                <p className="text-sm text-destructive">
                  Unable to load project exposure: {exposureError}
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-5 lg:grid-cols-2">
                {(investment?.allocations?.length ? projectExposure : []).map(
                  (exposure) => {
                    const {
                      allocation,
                      project,
                      species,
                      entityCount,
                      totalQuantity,
                      activeEntities,
                      closedEntities,
                    } = exposure;

                    return (
                      <div
                        key={allocation.allocationId}
                        className="rounded-lg border border-border/70 p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold">
                              {project?.name || "Unknown project"}
                            </p>

                            <p className="mt-1 text-xs capitalize text-muted-foreground">
                              {project?.project_type || "Project"}
                            </p>
                          </div>

                          <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium capitalize">
                            {project?.status || "Unknown"}
                          </span>
                        </div>

                        {project?.purpose && (
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {project.purpose}
                          </p>
                        )}

                        <div className="mt-5 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Scope
                            </p>

                            <p className="mt-1 text-sm font-medium capitalize">
                              {allocation.scopeType.replaceAll("_", " ")}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Allocated
                            </p>

                            <p className="mt-1 text-sm font-semibold">
                              ৳
                              {Number(
                                allocation.amountAllocated || 0,
                              ).toLocaleString()}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Species / activity
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {species?.name || "All project activities"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Participation
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {allocation.participationPct !== null &&
                              allocation.participationPct !== undefined
                                ? `${allocation.participationPct}%`
                                : "Not specified"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Entities covered
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {entityCount}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Current quantity
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {totalQuantity.toLocaleString()}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Active
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {activeEntities}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground">
                              Closed
                            </p>

                            <p className="mt-1 text-sm font-medium">
                              {closedEntities}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>

          {/* Allocations */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Project allocations</h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  Capital assigned from this investment.
                </p>
              </div>

              <span className="text-xs text-muted-foreground">
                {allocations.length} allocation
                {allocations.length === 1 ? "" : "s"}
              </span>
            </div>

            {allocations.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-border p-5">
                <p className="text-sm text-muted-foreground">
                  No capital has been allocated to a project yet.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-lg border border-border/70">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30 text-left">
                        <th className="px-4 py-3 font-medium text-muted-foreground">
                          Project
                        </th>

                        <th className="px-4 py-3 font-medium text-muted-foreground">
                          Species / activity
                        </th>

                        <th className="px-4 py-3 font-medium text-muted-foreground">
                          Scope
                        </th>

                        <th className="px-4 py-3 font-medium text-muted-foreground">
                          Amount
                        </th>

                        <th className="px-4 py-3 font-medium text-muted-foreground">
                          Participation
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border/60">
                      {allocations.map((allocation) => (
                        <tr key={allocation.allocationId}>
                          <td className="px-4 py-3 font-medium">
                            {allocation.projectName || "—"}
                          </td>

                          <td className="px-4 py-3">
                            {allocation.speciesName || "All"}
                          </td>

                          <td className="px-4 py-3 capitalize">
                            {allocation.scopeType.replaceAll("_", " ")}
                          </td>

                          <td className="px-4 py-3 font-medium">
                            ৳
                            {Number(
                              allocation.amountAllocated || 0,
                            ).toLocaleString()}
                          </td>

                          <td className="px-4 py-3">
                            {allocation.participationPct !== null &&
                            allocation.participationPct !== undefined
                              ? `${allocation.participationPct}%`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end border-t border-border/60 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default InvestmentDetail;
