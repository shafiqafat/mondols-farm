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

  

  return (
    <div className="space-y-6 p-6">
      <div>
        <p className="text-sm text-muted-foreground">Investor Portal</p>

        <h1 className="text-2xl font-semibold">Welcome, {investorName}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Committed</p>
          <p className="mt-2 text-2xl font-semibold">
            ৳{totalCommitted.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Contributed</p>
          <p className="mt-2 text-2xl font-semibold">
            ৳{totalContributed.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Allocated</p>
          <p className="mt-2 text-2xl font-semibold">
            ৳{totalAllocated.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Unallocated</p>
          <p className="mt-2 text-2xl font-semibold">
            ৳{totalUnallocated.toLocaleString()}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Available Opportunities</h2>
          <p className="text-sm text-muted-foreground">
            Projects and farm activities currently available for investment.
          </p>
        </div>

        {opportunitiesLoading ? (
          <div className="rounded-lg border p-6">
            <p className="text-sm text-muted-foreground">
              Loading investment opportunities...
            </p>
          </div>
        ) : opportunitiesError ? (
          <div className="rounded-lg border p-6">
            <p className="text-sm text-destructive">
              Unable to load investment opportunities.
            </p>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="rounded-lg border p-6">
            <p className="text-sm text-muted-foreground">
              No investment opportunities are currently available.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {opportunities.map((opportunity) => (
              <div
                key={opportunity.opportunity_id}
                className="rounded-lg border p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{opportunity.title}</h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {opportunity.description || "No description available."}
                    </p>
                  </div>

                  <span className="rounded-full border px-2.5 py-1 text-xs capitalize">
                    {opportunity.status?.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Target</p>
                    <p className="mt-1 text-sm font-medium">
                      ৳{Number(opportunity.target_amount ?? 0).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Minimum</p>
                    <p className="mt-1 text-sm font-medium">
                      ৳
                      {Number(opportunity.minimum_amount ?? 0).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Committed</p>
                    <p className="mt-1 text-sm font-medium">
                      ৳
                      {Number(
                        opportunity.total_committed ?? 0,
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                    <p className="mt-1 text-sm font-medium">
                      ৳
                      {Number(
                        opportunity.remaining_target ?? 0,
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t pt-4">
                  <p className="text-xs text-muted-foreground">Project</p>
                  <p className="mt-1 text-sm">
                    {opportunity.project_name || "Farm activity"}
                  </p>

                  {opportunity.species_name && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {opportunity.species_name}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => handleViewOpportunity(opportunity)}
                    className="w-full rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    View opportunity
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="rounded-lg border">
        <div className="border-b p-4">
          <h2 className="font-semibold">My Investments</h2>
        </div>

        {portfolio.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No investments found.
          </div>
        ) : (
          <div className="divide-y">
            {portfolio.map((investment) => (
              <div
                key={investment.investment_id}
                className="grid gap-4 p-4 md:grid-cols-6"
              >
                <div>
                  <p className="text-xs text-muted-foreground">Opportunity</p>

                  <p className="font-medium">
                    {investment.opportunity_title ?? "Direct Investment"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Committed</p>

                  <p>
                    ৳{Number(investment.committed_amount ?? 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Contributed</p>

                  <p>
                    ৳
                    {Number(
                      investment.contributed_amount ?? 0,
                    ).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Allocated</p>

                  <p>
                    ৳{Number(investment.allocated_amount ?? 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Status</p>

                  <p className="capitalize">{investment.investment_status}</p>
                </div>

                <div className="flex items-center justify-start">
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
      </div>

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
