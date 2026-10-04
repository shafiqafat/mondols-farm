import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function InvestorPortfolio({
  investor,
  portfolio,
  open,
  onOpenChange,
  onViewInvestment,
}) {
  if (!open || !investor) {
    return null;
  }

  const investorRows = portfolio.filter(
    (item) => item.investor_id === investor.id,
  );

  const investmentMap = new Map();

  investorRows.forEach((row) => {
    if (!investmentMap.has(row.investment_id)) {
      investmentMap.set(row.investment_id, {
        ...row,
        allocations: [],
      });
    }

    if (row.allocation_id) {
      investmentMap.get(row.investment_id).allocations.push({
        allocationId: row.allocation_id,
        projectName: row.project_name,
        speciesName: row.species_name,
        scopeType: row.scope_type,
        amountAllocated: Number(row.amount_allocated || 0),
        participationPct: row.participation_pct,
      });
    }
  });

  const investments = Array.from(investmentMap.values());

  const totalCommitted = investments.reduce(
    (sum, item) => sum + Number(item.committed_amount || 0),
    0,
  );

  const totalContributed = investments.reduce(
    (sum, item) => sum + Number(item.contributed_amount || 0),
    0,
  );

  const totalAllocated = investments.reduce(
    (sum, item) => sum + Number(item.allocated_amount || 0),
    0,
  );

  const totalUnallocated = Math.max(totalContributed - totalAllocated, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-border bg-background p-7 shadow-xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">
              Investor portfolio
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {investor.name}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/70">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Total committed</p>

              <p className="mt-2 text-2xl font-semibold">
                ৳{totalCommitted.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Total contributed</p>

              <p className="mt-2 text-2xl font-semibold text-primary">
                ৳{totalContributed.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Total allocated</p>

              <p className="mt-2 text-2xl font-semibold">
                ৳{totalAllocated.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground">Unallocated</p>

              <p className="mt-2 text-2xl font-semibold">
                ৳{totalUnallocated.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="mt-8 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Investments</h3>

            <p className="mt-1 text-sm text-muted-foreground">
              Capital commitments and how they are currently allocated.
            </p>
          </div>

          {investments.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground">
                  This investor has no investments yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/70">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/30 text-left">
                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Opportunity
                      </th>

                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Committed
                      </th>

                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Contributed
                      </th>

                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Allocated
                      </th>

                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Unallocated
                      </th>

                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/60">
                    {investments.map((investment) => {
                      const committed = Number(
                        investment.committed_amount || 0,
                      );

                      const contributed = Number(
                        investment.contributed_amount || 0,
                      );

                      const allocated = Number(
                        investment.allocated_amount || 0,
                      );

                      const unallocated = Math.max(contributed - allocated, 0);

                      return (
                        <tr key={investment.investment_id}>
                          <td className="px-4 py-4">
                            <p className="font-medium">
                              {investment.opportunity_title ||
                                "Direct investment"}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {investment.allocations.length} allocation
                              {investment.allocations.length === 1 ? "" : "s"}
                            </p>
                          </td>

                          <td className="px-4 py-4 font-medium">
                            ৳{committed.toLocaleString()}
                          </td>

                          <td className="px-4 py-4 font-medium text-primary">
                            ৳{contributed.toLocaleString()}
                          </td>

                          <td className="px-4 py-4 font-medium">
                            ৳{allocated.toLocaleString()}
                          </td>

                          <td className="px-4 py-4 font-medium">
                            ৳{unallocated.toLocaleString()}
                          </td>

                          <td className="px-4 py-4">
                            <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium capitalize">
                              {investment.investment_status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onViewInvestment(investment)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default InvestorPortfolio;
