import { useEffect, useState } from "react";
import { useInvestorPortfolio } from "../hooks/useInvestorPortfolio";
import { useInvestorInvestmentTransactions } from "../hooks/useInvestorInvestmentTransactions";

export default function InvestorTransactions() {
  const {
    portfolio,
    loading: portfolioLoading,
    error: portfolioError,
  } = useInvestorPortfolio();

  const {
    loading: transactionsLoading,
    error: transactionsError,
    loadTransactions,
  } = useInvestorInvestmentTransactions();

  const [allTransactions, setAllTransactions] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadAllTransactions() {
      if (!portfolio.length) {
        setAllTransactions([]);
        return;
      }

      const combined = [];

      for (const investment of portfolio) {
        const rows = await loadTransactions(investment.investment_id);

        if (cancelled) return;

        combined.push(
          ...rows.map((transaction) => ({
            ...transaction,
            investment_id: investment.investment_id,
            opportunity_title:
              investment.opportunity_title ?? "Direct Investment",
          })),
        );
      }

      if (!cancelled) {
        setAllTransactions(combined);
      }
    }

    loadAllTransactions();

    return () => {
      cancelled = true;
    };
  }, [portfolio, loadTransactions]);

  if (portfolioLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading transactions...</p>
      </div>
    );
  }

  if (portfolioError) {
    return (
      <div className="p-6">
        <p className="font-medium">Unable to load transactions.</p>
        <p className="mt-2 text-sm text-destructive">{portfolioError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Portfolio
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Transactions
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Your contribution, distribution, refund and adjustment history.
        </p>
      </section>

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Transaction History</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            All recorded investment money movements.
          </p>
        </div>

        {transactionsLoading ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Loading transactions...
            </p>
          </div>
        ) : transactionsError ? (
          <div className="p-10 text-center">
            <p className="font-medium">Unable to load transactions.</p>

            <p className="mt-2 text-sm text-destructive">{transactionsError}</p>
          </div>
        ) : allTransactions.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No transactions yet.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {allTransactions.map((transaction, index) => (
              <div
                key={`${transaction.id}-${index}`}
                className="grid gap-5 px-5 py-5 md:grid-cols-[1.5fr_1fr_1fr_1.5fr]"
              >
                <div>
                  <p className="font-medium capitalize">{transaction.type}</p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {transaction.opportunity_title}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>

                  <p className="mt-1 font-medium">
                    ৳{Number(transaction.amount ?? 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Date</p>

                  <p className="mt-1 text-sm">
                    {transaction.occurred_at
                      ? new Date(transaction.occurred_at).toLocaleDateString()
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>

                  <p className="mt-1 text-sm">{transaction.notes || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
