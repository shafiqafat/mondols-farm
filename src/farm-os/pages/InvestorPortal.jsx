import { useState } from "react";
import { useInvestorInvestmentSummary } from "../hooks/useInvestorInvestmentSummary";
import { useInvestorProjectExposure } from "../hooks/useInvestorProjectExposure";
import { useInvestorOperationalSummary } from "../hooks/useInvestorOperationalSummary";
import { useInvestorInvestmentTransactions } from "../hooks/useInvestorInvestmentTransactions";
import { useInvestorInvestmentPerformance } from "../hooks/useInvestorInvestmentPerformance";
import { useInvestorPortfolio } from "../hooks/useInvestorPortfolio";
import { useInvestorOpportunities } from "../hooks/useInvestorOpportunities";

import InvestorOpportunityDetail from "../components/investment/InvestorOpportunityDetail";
import InvestorInvestmentDetail from "../components/investment/InvestorInvestmentDetail";

export default function InvestorPortal() {
  const {
    portfolio,
    loading,
    error,
    reload: reloadPortfolio,
  } = useInvestorPortfolio();
  const {
    summary,
    loading: summaryLoading,
    error: summaryError,
    loadSummary,
    clearSummary,
  } = useInvestorInvestmentSummary();
  const {
    exposure,
    loading: exposureLoading,
    error: exposureError,
    loadExposure,
    clearExposure,
  } = useInvestorProjectExposure();
  const {
    summary: operationalSummary,
    loading: operationalSummaryLoading,
    error: operationalSummaryError,
    loadOperationalSummary,
    clearOperationalSummary,
  } = useInvestorOperationalSummary();
  const [investmentDetailOpen, setInvestmentDetailOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [opportunityDetailOpen, setOpportunityDetailOpen] = useState(false);
  const {
    transactions: investmentTransactions,
    loading: investmentTransactionsLoading,
    error: investmentTransactionsError,
    loadTransactions,
    clearTransactions,
  } = useInvestorInvestmentTransactions();
  const {
    performance: investmentPerformance,
    loading: investmentPerformanceLoading,
    error: investmentPerformanceError,
    loadPerformance,
    clearPerformance,
  } = useInvestorInvestmentPerformance();
  const {
    opportunities,
    loading: opportunitiesLoading,
    error: opportunitiesError,
    reload: reloadOpportunities,
  } = useInvestorOpportunities();

  function handleViewOpportunity(opportunity) {
    setSelectedOpportunity(opportunity);
    setOpportunityDetailOpen(true);
  }

  async function handleViewInvestment(investment) {
    setInvestmentDetailOpen(true);

    await loadSummary(investment.investment_id);

    await loadTransactions(investment.investment_id);

    await loadPerformance(investment.investment_id);

    if (investment.allocations?.length) {
      await loadExposure(investment.investment_id);

      await loadOperationalSummary(investment.investment_id);
    } else {
      clearExposure();
      clearOperationalSummary();
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p>Loading investor portfolio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p>Unable to load investor portfolio.</p>
        <p className="mt-2 text-sm text-red-500">{error}</p>
      </div>
    );
  }

  const investorName = portfolio[0]?.investor_name ?? "Investor";

  const totalCommitted = portfolio.reduce(
    (sum, investment) => sum + Number(investment.committed_amount ?? 0),
    0,
  );

  const totalContributed = portfolio.reduce(
    (sum, investment) => sum + Number(investment.contributed_amount ?? 0),
    0,
  );

  const totalAllocated = portfolio.reduce(
    (sum, investment) => sum + Number(investment.allocated_amount ?? 0),
    0,
  );

  const totalUnallocated = portfolio.reduce(
    (sum, investment) => sum + Number(investment.unallocated_contribution ?? 0),
    0,
  );

  const activeInvestments = portfolio.filter(
    (investment) => investment.investment_status === "active",
  ).length;

  const allocationMap = portfolio.reduce((map, investment) => {
    for (const allocation of investment.allocations ?? []) {
      const name =
        allocation.project_name ??
        allocation.species_name ??
        "Unassigned project";
      map.set(
        name,
        (map.get(name) ?? 0) + Number(allocation.amount_allocated ?? 0),
      );
    }
    return map;
  }, new Map());

  const allocationEntries = Array.from(allocationMap.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const contributionProgress =
    totalCommitted > 0
      ? Math.min((totalContributed / totalCommitted) * 100, 100)
      : 0;
  const allocationProgress =
    totalContributed > 0
      ? Math.min((totalAllocated / totalContributed) * 100, 100)
      : 0;

  return (
    <div className="space-y-8 p-6">
      <section>
        <p className="text-sm font-medium text-muted-foreground">
          Investor Dashboard
        </p>
        <div className="mt-1 flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome back, {investorName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here&apos;s a clear view of your investment portfolio.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {activeInvestments} active{" "}
            {activeInvestments === 1 ? "investment" : "investments"}
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Committed", totalCommitted, "Total capital you have committed"],
          [
            "Contributed",
            totalContributed,
            `${Math.round(contributionProgress)}% of commitments funded`,
          ],
          [
            "Allocated",
            totalAllocated,
            "Capital currently assigned to projects",
          ],
          [
            "Available to Allocate",
            totalUnallocated,
            "Contributed capital not yet allocated",
          ],
        ].map(([label, amount, note]) => (
          <div key={label} className="rounded-xl border bg-card p-5 shadow-sm">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              ৳{Number(amount).toLocaleString()}
            </p>
            {label === "Contributed" && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${contributionProgress}%` }}
                />
              </div>
            )}
            {label === "Allocated" && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${allocationProgress}%` }}
                />
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">{note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b p-5">
            <h2 className="font-semibold">Portfolio Allocation</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Where your contributed capital is currently allocated.
            </p>
          </div>
          <div className="p-5">
            {allocationEntries.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                No project allocations yet.
              </div>
            ) : (
              <div className="space-y-5">
                {allocationEntries.map(([name, amount]) => {
                  const percentage =
                    totalAllocated > 0
                      ? Math.min((amount / totalAllocated) * 100, 100)
                      : 0;
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium">{name}</p>
                        <p className="text-sm font-semibold">
                          ৳{amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {Math.round(percentage)}% of allocated capital
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-sm">
          <div className="border-b p-5">
            <h2 className="font-semibold">Investment Position</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your overall capital position across investments.
            </p>
          </div>
          <div className="divide-y">
            {[
              ["Active investments", activeInvestments],
              ["Committed capital", `৳${totalCommitted.toLocaleString()}`],
              ["Contributed capital", `৳${totalContributed.toLocaleString()}`],
              ["Unallocated capital", `৳${totalUnallocated.toLocaleString()}`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 p-5"
              >
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="font-semibold">My Investments</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your current investment commitments and capital position.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {portfolio.length} total
          </span>
        </div>
        {portfolio.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No investments found.
          </div>
        ) : (
          <div className="divide-y">
            {portfolio.map((investment) => (
              <div
                key={investment.investment_id}
                className="grid gap-4 p-5 md:grid-cols-[1.5fr_1fr_1fr_1fr_auto] md:items-center"
              >
                <div>
                  <p className="font-medium">
                    {investment.opportunity_title ?? "Direct Investment"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Investment
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Committed</p>
                  <p className="mt-1 text-sm font-medium">
                    ৳{Number(investment.committed_amount ?? 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contributed</p>
                  <p className="mt-1 text-sm font-medium">
                    ৳
                    {Number(
                      investment.contributed_amount ?? 0,
                    ).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Allocated</p>
                  <p className="mt-1 text-sm font-medium">
                    ৳{Number(investment.allocated_amount ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border px-2.5 py-1 text-xs capitalize">
                    {investment.investment_status}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleViewInvestment(investment)}
                    className="rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-semibold">Investment Opportunities</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Projects and farm activities currently available for investment.
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {opportunities.length} available
          </span>
        </div>
        {opportunitiesLoading ? (
          <div className="rounded-xl border p-6">
            <p className="text-sm text-muted-foreground">
              Loading investment opportunities...
            </p>
          </div>
        ) : opportunitiesError ? (
          <div className="rounded-xl border p-6">
            <p className="text-sm text-destructive">
              Unable to load investment opportunities.
            </p>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No investment opportunities are currently available.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {opportunities.map((opportunity) => {
              const target = Number(opportunity.target_amount ?? 0);
              const committed = Number(opportunity.total_committed ?? 0);
              const progress =
                target > 0 ? Math.min((committed / target) * 100, 100) : 0;
              return (
                <div
                  key={opportunity.opportunity_id}
                  className="rounded-xl border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold">{opportunity.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {opportunity.project_name || "Farm activity"}
                      </p>
                    </div>
                    <span className="rounded-full border px-2.5 py-1 text-xs capitalize">
                      {opportunity.status?.replaceAll("_", " ")}
                    </span>
                  </div>
                  <div className="mt-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Funding progress
                      </span>
                      <span className="font-medium">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="mt-1 text-sm font-semibold">
                        ৳{target.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Raised</p>
                      <p className="mt-1 text-sm font-semibold">
                        ৳{committed.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Minimum</p>
                      <p className="mt-1 text-sm font-semibold">
                        ৳
                        {Number(
                          opportunity.minimum_amount ?? 0,
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {opportunity.species_name && (
                    <p className="mt-4 text-xs text-muted-foreground">
                      {opportunity.species_name}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleViewOpportunity(opportunity)}
                    className="mt-5 w-full rounded-md border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    View opportunity
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <InvestorOpportunityDetail
        opportunity={selectedOpportunity}
        open={opportunityDetailOpen}
        onOpenChange={(open) => {
          setOpportunityDetailOpen(open);

          if (!open) {
            setSelectedOpportunity(null);
          }
        }}
        onCommitmentSuccess={async () => {
          await reloadPortfolio();
          await reloadOpportunities();
        }}
      />
      <InvestorInvestmentDetail
        open={investmentDetailOpen}
        onOpenChange={(open) => {
          setInvestmentDetailOpen(open);

          if (!open) {
            clearSummary();
            clearExposure();
            clearOperationalSummary();
            clearTransactions();
            clearPerformance();
          }
        }}
        summary={summary}
        loading={summaryLoading}
        error={summaryError}
        exposure={exposure}
        exposureLoading={exposureLoading}
        exposureError={exposureError}
        operationalSummary={operationalSummary}
        operationalSummaryLoading={operationalSummaryLoading}
        operationalSummaryError={operationalSummaryError}
        investmentTransactions={investmentTransactions}
        investmentTransactionsLoading={investmentTransactionsLoading}
        investmentTransactionsError={investmentTransactionsError}
        investmentPerformance={investmentPerformance}
        investmentPerformanceLoading={investmentPerformanceLoading}
        investmentPerformanceError={investmentPerformanceError}
      />
    </div>
  );
}
