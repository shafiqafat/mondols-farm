import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import InvestorCommitmentDialog from "./InvestorCommitmentDialog";

function formatAmount(value) {
  return `৳${Number(value ?? 0).toLocaleString()}`;
}

function formatDate(value) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b py-3 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>

      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>

      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

export default function InvestorOpportunityDetail({
  opportunity,
  open,
  onOpenChange,
  onCommitmentSuccess,
}) {
  const [commitmentOpen, setCommitmentOpen] = useState(false);
  if (!opportunity) {
    return null;
  }

  const targetAmount = Number(opportunity.target_amount ?? 0);
  const committedAmount = Number(opportunity.total_committed ?? 0);
  const remainingAmount = Number(opportunity.remaining_target ?? 0);
  const minimumAmount = Number(opportunity.minimum_amount ?? 0);

  const fundingPercentage =
    targetAmount > 0
      ? Math.min((committedAmount / targetAmount) * 100, 100)
      : 0;

  const statusLabel = opportunity.status?.replaceAll("_", " ") || "Unknown";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{opportunity.title}</DialogTitle>

            <DialogDescription>
              {opportunity.description || "Investment opportunity details."}

              <span className="ml-2 capitalize">· {statusLabel}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Financial overview */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Minimum investment"
                value={formatAmount(minimumAmount)}
              />

              <MetricCard
                label="Funding target"
                value={formatAmount(targetAmount)}
              />

              <MetricCard
                label="Currently committed"
                value={formatAmount(committedAmount)}
              />

              <MetricCard
                label="Funding available"
                value={formatAmount(remainingAmount)}
              />
            </section>

            {/* Funding progress */}
            <section className="space-y-3">
              <div>
                <h3 className="font-semibold">Funding progress</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Current commitment toward the opportunity target.
                </p>
              </div>

              <div className="rounded-lg border p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Committed</p>

                    <p className="mt-1 text-xl font-semibold">
                      {formatAmount(committedAmount)}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Progress</p>

                    <p className="mt-1 text-xl font-semibold">
                      {fundingPercentage.toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground transition-all"
                    style={{
                      width: `${fundingPercentage}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex justify-between gap-4 text-xs text-muted-foreground">
                  <span>{formatAmount(remainingAmount)} remaining</span>

                  <span>Target {formatAmount(targetAmount)}</span>
                </div>
              </div>
            </section>

            {/* Project */}
            <section className="space-y-3">
              <div>
                <h3 className="font-semibold">Project</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Farm project supported by this opportunity.
                </p>
              </div>

              <div className="rounded-lg border p-5">
                <p className="font-medium">
                  {opportunity.project_name || "Farm activity"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border px-2.5 py-1 text-xs">
                    {opportunity.species_name
                      ? "Species activity"
                      : "Farm project"}
                  </span>

                  {opportunity.species_name && (
                    <span className="rounded-full border px-2.5 py-1 text-xs">
                      {opportunity.species_name}
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Opportunity details */}
            <section className="space-y-3">
              <div>
                <h3 className="font-semibold">Opportunity details</h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Availability and access information.
                </p>
              </div>

              <div className="rounded-lg border px-4">
                <DetailRow
                  label="Status"
                  value={<span className="capitalize">{statusLabel}</span>}
                />

                <DetailRow
                  label="Opportunity type"
                  value={
                    opportunity.species_name
                      ? opportunity.species_name
                      : "Farm project"
                  }
                />

                {opportunity.opened_at && (
                  <DetailRow
                    label="Opened"
                    value={formatDate(opportunity.opened_at)}
                  />
                )}

                {opportunity.closes_at && (
                  <DetailRow
                    label="Closes"
                    value={formatDate(opportunity.closes_at)}
                  />
                )}

                <DetailRow
                  label="Visibility"
                  value={
                    <span className="capitalize">
                      {opportunity.visibility || "Investors"}
                    </span>
                  }
                />
              </div>
            </section>

            {/* Requirement */}
            <section className="rounded-[14px] border p-[24px]">
              <h3 className="text-[16px] font-semibold">
                Investment requirement
              </h3>

              <p className="mt-[8px] max-w-[900px] text-[13px] leading-[21px] text-muted-foreground">
                Investment starts from a minimum of{" "}
                <span className="font-medium text-foreground">
                  {formatAmount(minimumAmount)}
                </span>
                . You may invest more than the minimum amount, subject to the
                opportunity&apos;s available funding.
              </p>

              <div className="mt-[20px] flex justify-end">
                <Button
                  type="button"
                  onClick={() => setCommitmentOpen(true)}
                  disabled={
                    opportunity.status !== "open" || remainingAmount <= 0
                  }
                >
                  Invest in this opportunity
                </Button>
              </div>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <InvestorCommitmentDialog
        opportunity={opportunity}
        open={commitmentOpen}
        onOpenChange={setCommitmentOpen}
        onSuccess={onCommitmentSuccess}
      />
    </>
  );
}
