import { useState } from "react";
import { useInvestorPortfolio } from "../hooks/useInvestorPortfolio";
import { useInvestorInvestmentSummary } from "../hooks/useInvestorInvestmentSummary";
import { useInvestorProjectExposure } from "../hooks/useInvestorProjectExposure";
import { useInvestorOperationalSummary } from "../hooks/useInvestorOperationalSummary";
import { useInvestorInvestmentTransactions } from "../hooks/useInvestorInvestmentTransactions";
import { useInvestorInvestmentPerformance } from "../hooks/useInvestorInvestmentPerformance";

import InvestorInvestmentDetail from "../components/investment/InvestorInvestmentDetail";

export default function InvestorInvestments() {
  const { portfolio, loading, error } = useInvestorPortfolio();

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

  const {
    transactions,
    loading: transactionsLoading,
    error: transactionsError,
    loadTransactions,
    clearTransactions,
  } = useInvestorInvestmentTransactions();

  const {
    performance,
    loading: performanceLoading,
    error: performanceError,
    loadPerformance,
    clearPerformance,
  } = useInvestorInvestmentPerformance();

  const [detailOpen, setDetailOpen] = useState(false);

  async function handleViewInvestment(investment) {
    setDetailOpen(true);

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

  function handleClose(open) {
    setDetailOpen(open);

    if (!open) {
      clearSummary();
      clearExposure();
      clearOperationalSummary();
      clearTransactions();
      clearPerformance();
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading investments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="font-medium">Unable to load investments.</p>
        <p className="mt-2 text-sm text-destructive">{error}</p>
      </div>
    );
  }

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

  return (
    <div className="space-y-8 p-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Portfolio
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          My Investments
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Track your commitments, contributions and project allocations.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Committed</p>
          <p className="mt-2 text-2xl font-semibold">
            ৳{totalCommitted.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Contributed</p>
          <p className="mt-2 text-2xl font-semibold">
            ৳{totalContributed.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Allocated</p>
          <p className="mt-2 text-2xl font-semibold">
            ৳{totalAllocated.toLocaleString()}
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">All Investments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your complete investment portfolio.
          </p>
        </div>

        {portfolio.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted-foreground">
              You don&apos;t have any investments yet.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {portfolio.map((investment) => (
              <div
                key={investment.investment_id}
                className="grid gap-5 px-5 py-5 transition-colors hover:bg-muted/30 md:grid-cols-[1.6fr_1fr_1fr_1fr_90px_50px] md:items-center"
              >
                <div>
                  <p className="font-medium">
                    {investment.opportunity_title ?? "Direct Investment"}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {investment.investment_id}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Committed</p>

                  <p className="mt-1 font-medium">
                    ৳{Number(investment.committed_amount ?? 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Contributed</p>

                  <p className="mt-1 font-medium">
                    ৳
                    {Number(
                      investment.contributed_amount ?? 0,
                    ).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Allocated</p>

                  <p className="mt-1 font-medium">
                    ৳{Number(investment.allocated_amount ?? 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize">
                    {investment.investment_status}
                  </span>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => handleViewInvestment(investment)}
                    className="text-sm font-medium transition-colors hover:underline"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <InvestorInvestmentDetail
        open={detailOpen}
        onOpenChange={handleClose}
        summary={summary}
        loading={summaryLoading}
        error={summaryError}
        exposure={exposure}
        exposureLoading={exposureLoading}
        exposureError={exposureError}
        operationalSummary={operationalSummary}
        operationalSummaryLoading={operationalSummaryLoading}
        operationalSummaryError={operationalSummaryError}
        investmentTransactions={transactions}
        investmentTransactionsLoading={transactionsLoading}
        investmentTransactionsError={transactionsError}
        investmentPerformance={performance}
        investmentPerformanceLoading={performanceLoading}
        investmentPerformanceError={performanceError}
      />
    </div>
  );
}
