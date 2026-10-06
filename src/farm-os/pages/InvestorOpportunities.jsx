import { useState } from "react";
import { useInvestorOpportunities } from "../hooks/useInvestorOpportunities";
import InvestorOpportunityDetail from "../components/investment/InvestorOpportunityDetail";

export default function InvestorOpportunities() {
  const { opportunities, loading, error } = useInvestorOpportunities();

  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  function handleView(opportunity) {
    setSelectedOpportunity(opportunity);
    setDetailOpen(true);
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">
          Loading opportunities...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="font-medium">Unable to load opportunities.</p>

        <p className="mt-2 text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Explore
        </p>

        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          Investment Opportunities
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Explore projects currently available for investment.
        </p>
      </section>

      {opportunities.length === 0 ? (
        <section className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <p className="font-medium">No investment opportunities available.</p>

          <p className="mt-2 text-sm text-muted-foreground">
            New opportunities will appear here when they become available.
          </p>
        </section>
      ) : (
        <section className="grid gap-5 md:grid-cols-2">
          {opportunities.map((opportunity) => {
            const target = Number(opportunity.target_amount ?? 0);
            const contributed = Number(opportunity.contributed_amount ?? 0);

            const progress =
              target > 0 ? Math.min((contributed / target) * 100, 100) : 0;

            return (
              <article
                key={opportunity.opportunity_id}
                className="rounded-xl border bg-card p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{opportunity.title}</h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {opportunity.description || "Investment opportunity"}
                    </p>
                  </div>

                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize">
                    {opportunity.status}
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs text-muted-foreground">Target</p>

                    <p className="mt-1 font-medium">
                      ৳{target.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Raised</p>

                    <p className="mt-1 font-medium">
                      ৳{contributed.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Minimum</p>

                    <p className="mt-1 font-medium">
                      ৳
                      {Number(opportunity.minimum_amount ?? 0).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Investors</p>

                    <p className="mt-1 font-medium">
                      {opportunity.investor_count ?? 0}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Funding progress
                    </span>

                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleView(opportunity)}
                    className="rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    View opportunity
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <InvestorOpportunityDetail
        open={detailOpen}
        onOpenChange={setDetailOpen}
        opportunity={selectedOpportunity}
      />
    </div>
  );
}
