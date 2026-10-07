import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatAmount(value) {
  return `৳${Number(value ?? 0).toLocaleString()}`;
}

function formatPercent(value) {
  if (value == null) return "—";

  return `${Number(value).toFixed(2)}%`;
}

export default function InvestorInvestmentDetail({
  open,
  onOpenChange,
  summary,
  loading,
  error,
  exposure,
  exposureLoading,
  exposureError,
  operationalSummary,
  operationalSummaryLoading,
  operationalSummaryError,
  investmentTransactions,
  investmentTransactionsLoading,
  investmentTransactionsError,
  investmentPerformance,
  investmentPerformanceLoading,
  investmentPerformanceError,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {summary?.opportunity_title || "Investment details"}
          </DialogTitle>

          <DialogDescription>
            Review your investment commitment, contributions, and project
            allocations.
            {summary?.investment_status && (
              <span className="ml-2 capitalize">
                · {summary.investment_status}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading investment details...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && summary && (
          <div className="space-y-6">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Committed</p>

                <p className="mt-1 text-xl font-semibold">
                  {formatAmount(summary.committed_amount)}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Contributed</p>

                <p className="mt-1 text-xl font-semibold">
                  {formatAmount(summary.contributed_amount)}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Allocated</p>

                <p className="mt-1 text-xl font-semibold">
                  {formatAmount(summary.allocated_amount)}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Unallocated</p>

                <p className="mt-1 text-xl font-semibold">
                  {formatAmount(summary.unallocated_contribution)}
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">
                  Outstanding commitment
                </p>

                <p className="mt-1 text-xl font-semibold">
                  {formatAmount(summary.outstanding_commitment)}
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="font-semibold">Investment ROI</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  ROI terms recorded when this investment was created.
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Final ROI</p>

                    <p className="mt-1 text-lg font-semibold">
                      {formatPercent(summary.roi_final_min_percent)} –{" "}
                      {formatPercent(summary.roi_final_max_percent)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Base ROI</p>

                    <p className="mt-1 text-sm font-medium">
                      {formatPercent(summary.roi_base_min_percent)} –{" "}
                      {formatPercent(summary.roi_base_max_percent)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Tier bonus</p>

                    <p className="mt-1 text-sm font-medium">
                      +{formatPercent(summary.roi_bonus_percent)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>

                    <p className="mt-1 text-sm font-medium">
                      {summary.roi_duration_months != null
                        ? `${summary.roi_duration_months} months`
                        : "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Maximum ROI cap
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {formatPercent(summary.roi_max_percent_cap)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                  These are the projected ROI terms recorded for this
                  investment. They are not realized returns.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="font-semibold">Money movements</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Contributions, distributions, refunds, and other recorded
                  movements for this investment.
                </p>
              </div>

              {investmentTransactionsLoading ? (
                <div className="rounded-lg border p-5">
                  <p className="text-sm text-muted-foreground">
                    Loading money movements...
                  </p>
                </div>
              ) : investmentTransactionsError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
                  <p className="text-sm text-destructive">
                    Unable to load money movements:{" "}
                    {investmentTransactionsError}
                  </p>
                </div>
              ) : investmentTransactions.length === 0 ? (
                <div className="rounded-lg border p-5">
                  <p className="text-sm text-muted-foreground">
                    No money movements have been recorded yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-muted/40">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">
                          Date
                        </th>

                        <th className="px-4 py-3 text-left font-medium">
                          Type
                        </th>

                        <th className="px-4 py-3 text-right font-medium">
                          Amount
                        </th>

                        <th className="px-4 py-3 text-left font-medium">
                          Finance
                        </th>

                        <th className="px-4 py-3 text-left font-medium">
                          Notes
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {investmentTransactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-b last:border-b-0"
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            {transaction.occurred_at
                              ? new Date(
                                  transaction.occurred_at,
                                ).toLocaleDateString()
                              : "—"}
                          </td>

                          <td className="px-4 py-3">
                            <span className="capitalize">
                              {transaction.type?.replaceAll("_", " ") ?? "—"}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right font-medium whitespace-nowrap">
                            ৳{Number(transaction.amount ?? 0).toLocaleString()}
                          </td>

                          <td className="px-4 py-3">
                            {transaction.finance_transaction_id ? (
                              <span className="text-xs font-medium text-emerald-600">
                                Linked
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Not linked
                              </span>
                            )}
                          </td>

                          <td className="max-w-64 px-4 py-3 text-muted-foreground">
                            {transaction.notes || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="font-semibold">Performance</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Returns and money received from this investment.
                </p>
              </div>

              {investmentPerformanceLoading ? (
                <div className="rounded-lg border p-5">
                  <p className="text-sm text-muted-foreground">
                    Loading performance...
                  </p>
                </div>
              ) : investmentPerformanceError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
                  <p className="text-sm text-destructive">
                    Unable to load performance: {investmentPerformanceError}
                  </p>
                </div>
              ) : !investmentPerformance ? (
                <div className="rounded-lg border p-5">
                  <p className="text-sm text-muted-foreground">
                    No performance data is currently available.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Contractual return</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Expected return based on the ROI terms recorded when this
                      investment was created.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">Final ROI</p>

                      <p className="mt-1 text-lg font-semibold">
                        {Number(
                          investmentPerformance.roi_final_min_percent ?? 0,
                        ).toFixed(2)}
                        %{" – "}
                        {Number(
                          investmentPerformance.roi_final_max_percent ?? 0,
                        ).toFixed(2)}
                        %
                      </p>
                    </div>

                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">Base ROI</p>

                      <p className="mt-1 text-lg font-semibold">
                        {Number(
                          investmentPerformance.roi_base_min_percent ?? 0,
                        ).toFixed(2)}
                        %{" – "}
                        {Number(
                          investmentPerformance.roi_base_max_percent ?? 0,
                        ).toFixed(2)}
                        %
                      </p>
                    </div>

                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">
                        Tier bonus
                      </p>

                      <p className="mt-1 text-lg font-semibold">
                        +
                        {Number(
                          investmentPerformance.roi_bonus_percent ?? 0,
                        ).toFixed(2)}
                        %
                      </p>
                    </div>

                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">
                        ROI duration
                      </p>

                      <p className="mt-1 text-lg font-semibold">
                        {investmentPerformance.roi_duration_months ?? "—"}{" "}
                        months
                      </p>
                    </div>

                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">
                        Maximum ROI cap
                      </p>

                      <p className="mt-1 text-lg font-semibold">
                        {Number(
                          investmentPerformance.roi_max_percent_cap ?? 0,
                        ).toFixed(2)}
                        %
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">
                        Estimated profit
                      </p>

                      <p className="mt-1 text-lg font-semibold">
                        {formatAmount(
                          investmentPerformance.estimated_profit_min,
                        )}
                        {" – "}
                        {formatAmount(
                          investmentPerformance.estimated_profit_max,
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">
                        Estimated total return
                      </p>

                      <p className="mt-1 text-lg font-semibold">
                        {formatAmount(
                          investmentPerformance.estimated_total_min,
                        )}
                        {" – "}
                        {formatAmount(
                          investmentPerformance.estimated_total_max,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium">Cash movements</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Actual money received from this investment so far.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">
                        Distributed
                      </p>

                      <p className="mt-1 text-lg font-semibold">
                        ৳
                        {Number(
                          investmentPerformance.distributed_amount ?? 0,
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">Refunded</p>

                      <p className="mt-1 text-lg font-semibold">
                        ৳
                        {Number(
                          investmentPerformance.refunded_amount ?? 0,
                        ).toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-lg border p-4">
                      <p className="text-xs text-muted-foreground">
                        Total returned
                      </p>

                      <p className="mt-1 text-lg font-semibold">
                        ৳
                        {(
                          Number(
                            investmentPerformance.distributed_amount ?? 0,
                          ) + Number(investmentPerformance.refunded_amount ?? 0)
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div>
                <h3 className="font-semibold">Operational exposure</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Projects and farm activities supported by this investment.
                </p>
              </div>

              {exposureLoading ? (
                <div className="rounded-lg border p-5">
                  <p className="text-sm text-muted-foreground">
                    Loading project data...
                  </p>
                </div>
              ) : exposureError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
                  <p className="text-sm text-destructive">
                    Unable to load project exposure: {exposureError}
                  </p>
                </div>
              ) : exposure.length === 0 ? (
                <div className="rounded-lg border p-5">
                  <p className="text-sm text-muted-foreground">
                    No operational exposure is currently available.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exposure.map((item) => {
                    const operationalItem = operationalSummary?.find(
                      (summaryItem) =>
                        summaryItem.allocation_id === item.allocation_id,
                    );

                    return (
                      <div
                        key={item.allocation_id}
                        className="rounded-lg border p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">{item.project_name}</p>

                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.species_name ?? "All project activities"}
                            </p>
                          </div>

                          <p className="font-semibold">
                            ৳
                            {Number(
                              item.amount_allocated ?? 0,
                            ).toLocaleString()}
                          </p>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs text-muted-foreground">
                            Coverage
                          </p>

                          <p className="mt-1 text-sm capitalize">
                            {item.scope_type?.replaceAll("_", " ")}
                          </p>
                        </div>

                        {operationalSummaryLoading ? (
                          <div className="mt-4 border-t pt-4">
                            <p className="text-sm text-muted-foreground">
                              Loading operational data...
                            </p>
                          </div>
                        ) : operationalSummaryError ? (
                          <div className="mt-4 border-t pt-4">
                            <p className="text-sm text-destructive">
                              Unable to load operational data.
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Entities
                                </p>

                                <p className="mt-1 text-sm font-medium">
                                  {operationalItem?.entity_count ?? 0}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Total quantity
                                </p>

                                <p className="mt-1 text-sm font-medium">
                                  {Number(
                                    operationalItem?.total_quantity ?? 0,
                                  ).toLocaleString()}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Active
                                </p>

                                <p className="mt-1 text-sm font-medium">
                                  {operationalItem?.active_entity_count ?? 0}
                                </p>
                              </div>

                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Closed
                                </p>

                                <p className="mt-1 text-sm font-medium">
                                  {operationalItem?.closed_entity_count ?? 0}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 border-t pt-3">
                              <p className="text-xs text-muted-foreground">
                                Recorded activities
                              </p>

                              <p className="mt-1 text-sm font-medium">
                                {operationalItem?.event_count ?? 0}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {!loading && !error && !summary && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Investment details are unavailable.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
