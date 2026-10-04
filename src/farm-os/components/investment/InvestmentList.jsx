import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

function InvestmentList({
  investments,
  canEdit,
  onNewInvestment,
  onViewInvestment,
}) {
  const investmentMap = new Map();

  investments.forEach((investment) => {
    const investmentId = investment.investment_id;

    if (!investmentMap.has(investmentId)) {
      investmentMap.set(investmentId, {
        ...investment,
        allocated_amount: Number(investment.allocated_amount || 0),
        allocations: [],
      });
    }

    const grouped = investmentMap.get(investmentId);

    if (investment.allocation_id) {
      grouped.allocations.push({
        allocationId: investment.allocation_id,
        scopeType: investment.scope_type,
        projectId: investment.project_id,
        projectName: investment.project_name,
        speciesConfigId: investment.species_config_id,
        speciesName: investment.species_name,
        amountAllocated: Number(investment.amount_allocated || 0),
        participationPct: investment.participation_pct,
      });
    }
  });

  const groupedInvestments = Array.from(investmentMap.values());

  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">
            Investments
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage investor commitments, received capital, allocations, and
            investment positions.
          </p>
        </div>

        {canEdit && (
          <Button type="button" onClick={onNewInvestment}>
            <Plus className="size-4" />
            New investment
          </Button>
        )}
      </div>

      {groupedInvestments.length === 0 ? (
        <Card className="border-border/70 bg-card shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              No investments have been recorded yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-border/70 bg-card shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-left">
                    <th className="px-5 py-4 font-medium text-muted-foreground">
                      Investor
                    </th>

                    <th className="px-5 py-4 font-medium text-muted-foreground">
                      Opportunity
                    </th>

                    <th className="px-5 py-4 font-medium text-muted-foreground">
                      Committed
                    </th>

                    <th className="px-5 py-4 font-medium text-muted-foreground">
                      Contributed
                    </th>

                    <th className="px-5 py-4 font-medium text-muted-foreground">
                      Allocated
                    </th>

                    <th className="px-5 py-4 font-medium text-muted-foreground">
                      Unallocated
                    </th>

                    <th className="px-5 py-4 font-medium text-muted-foreground">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right font-medium text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/60">
                  {groupedInvestments.map((investment) => {
                    const committed = Number(investment.committed_amount || 0);

                    const contributed = Number(
                      investment.contributed_amount || 0,
                    );

                    const allocated = Number(investment.allocated_amount || 0);

                    const unallocated = Math.max(contributed - allocated, 0);

                    return (
                      <tr
                        key={investment.investment_id}
                        className="transition-colors hover:bg-muted/20"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium">
                            {investment.investor_name}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {investment.investment_id.slice(0, 8)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium">
                            {investment.opportunity_title ||
                              "Direct investment"}
                          </p>

                          {investment.allocations.length > 0 ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {investment.allocations.length} allocation
                              {investment.allocations.length === 1 ? "" : "s"}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-muted-foreground">
                              No allocation yet
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 font-medium">
                          ৳{committed.toLocaleString()}
                        </td>

                        <td className="px-5 py-4 font-medium text-primary">
                          ৳{contributed.toLocaleString()}
                        </td>

                        <td className="px-5 py-4 font-medium">
                          ৳{allocated.toLocaleString()}
                        </td>

                        <td className="px-5 py-4 font-medium">
                          ৳{unallocated.toLocaleString()}
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs font-medium capitalize">
                            {investment.investment_status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
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
          </CardContent>
        </Card>
      )}
    </section>
  );
}

export default InvestmentList;
