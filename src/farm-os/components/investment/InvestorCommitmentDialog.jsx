import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "../../lib/supabaseClient";

function formatAmount(value) {
  return `৳${Number(value ?? 0).toLocaleString()}`;
}

function formatPercent(value) {
  return `${Number(value ?? 0).toFixed(2)}%`;
}

export default function InvestorCommitmentDialog({
  opportunity,
  open,
  onOpenChange,
  onSuccess,
}) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [roi, setRoi] = useState(null);
  const [roiLoading, setRoiLoading] = useState(false);
  const [roiError, setRoiError] = useState("");

  const [error, setError] = useState("");

  
  const minimumAmount = Number(opportunity.minimum_amount ?? 0);
  const remainingAmount = Number(opportunity.remaining_target ?? 0);
  const enteredAmount = Number(amount || 0);

  const amountError =
  amount && enteredAmount <= 0
  ? "Enter a valid investment amount."
      : amount && enteredAmount < minimumAmount
      ? `Minimum investment is ${formatAmount(minimumAmount)}.`
        : amount && enteredAmount > remainingAmount
          ? `Available funding is ${formatAmount(remainingAmount)}.`
          : "";
          
          useEffect(() => {
            if (
              !open ||
              !amount ||
              enteredAmount <= 0 ||
              amountError ||
              !opportunity?.opportunity_id
            ) {
              return;
            }

            let cancelled = false;

            const timer = setTimeout(async () => {
              if (cancelled) {
                return;
              }

              setRoiLoading(true);
              setRoiError("");

              const { data, error: rpcError } = await supabase.rpc(
                "calculate_investment_roi",
                {
                  p_opportunity_id: opportunity.opportunity_id,
                  p_investment_amount: enteredAmount,
                },
              );

              if (cancelled) {
                return;
              }

              if (rpcError) {
                setRoi(null);
                setRoiError(
                  rpcError.message || "Unable to calculate estimated ROI.",
                );
                setRoiLoading(false);
                return;
              }

              const result = Array.isArray(data) ? data[0] : data;

              if (!result) {
                setRoi(null);
                setRoiError("No ROI calculation was returned.");
                setRoiLoading(false);
                return;
              }

              setRoi(result);
              setRoiLoading(false);
            }, 300);

            

            return () => {
              cancelled = true;
              clearTimeout(timer);
            };
          }, [
            open,
            amount,
            enteredAmount,
            amountError,
            opportunity?.opportunity_id,
          ]);
  
          if (!opportunity) {
            return null;
          }
          
  function resetForm() {
    setAmount("");
    setNotes("");
    setError("");
    setRoi(null);
    setRoiError("");
    setRoiLoading(false);
  }
  
  function handleOpenChange(nextOpen) {
    if (!nextOpen && !saving) {
      resetForm();
    }

    onOpenChange(nextOpen);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!amount || enteredAmount <= 0) {
      setError("Enter a valid investment amount.");
      return;
    }

    if (enteredAmount < minimumAmount) {
      setError(`Minimum investment is ${formatAmount(minimumAmount)}.`);
      return;
    }

    if (enteredAmount > remainingAmount) {
      setError(
        `The commitment exceeds the remaining funding capacity of ${formatAmount(
          remainingAmount,
        )}.`,
      );
      return;
    }

    if (roiLoading) {
      setError("Please wait for the ROI estimate to finish calculating.");
      return;
    }

    if (!roi) {
      setError("Unable to calculate the ROI estimate. Please try again.");
      return;
    }

    setSaving(true);

    const { data, error: rpcError } = await supabase.rpc(
      "create_investor_commitment",
      {
        p_opportunity_id: opportunity.opportunity_id,
        p_committed_amount: enteredAmount,
        p_notes: notes.trim() || null,
      },
    );

    if (rpcError) {
      setError(rpcError.message || "Unable to create investment commitment.");
      setSaving(false);
      return;
    }

    setSaving(false);
    resetForm();
    onOpenChange(false);

    if (onSuccess) {
      onSuccess(data);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invest in this opportunity</DialogTitle>

          <DialogDescription>
            Commit an amount to {opportunity.title}. This creates your
            investment commitment; actual payment is recorded separately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">
                Minimum investment
              </p>

              <p className="mt-1 text-lg font-semibold">
                {formatAmount(minimumAmount)}
              </p>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-xs text-muted-foreground">Funding available</p>

              <p className="mt-1 text-lg font-semibold">
                {formatAmount(remainingAmount)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="investor-commitment-amount"
              className="text-sm font-medium"
            >
              Commitment amount
            </label>

            <Input
              id="investor-commitment-amount"
              type="number"
              min={minimumAmount}
              max={remainingAmount}
              step="any"
              placeholder={`e.g. ${minimumAmount || 20000}`}
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setError("");
              }}
              disabled={saving}
              required
            />

            {amountError && (
              <p className="text-xs text-destructive">{amountError}</p>
            )}
          </div>

          {roiLoading && !amountError && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                Calculating estimated return…
              </p>
            </div>
          )}

          {roiError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{roiError}</p>
            </div>
          )}

          {roi && !roiLoading && !amountError && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-4">
                <p className="text-sm font-semibold">
                  Estimated investment return
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Based on the current opportunity ROI terms and your commitment
                  amount.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Estimated ROI</p>

                  <p className="mt-1 text-lg font-semibold">
                    {formatPercent(roi.final_roi_min_percent)} –{" "}
                    {formatPercent(roi.final_roi_max_percent)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Investment period
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {opportunity.roi_duration_months ?? "—"} months
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Estimated profit
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {formatAmount(roi.estimated_profit_min)} –{" "}
                    {formatAmount(roi.estimated_profit_max)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Estimated total return
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {formatAmount(roi.estimated_total_min)} –{" "}
                    {formatAmount(roi.estimated_total_max)}
                  </p>
                </div>
              </div>

              {Number(roi.roi_bonus_percent ?? 0) > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Includes a {formatPercent(roi.roi_bonus_percent)} investment
                  tier bonus.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="investor-commitment-notes"
              className="text-sm font-medium"
            >
              Note
              <span className="ml-1 text-muted-foreground">(optional)</span>
            </label>

            <textarea
              id="investor-commitment-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              disabled={saving}
              placeholder="Add a note about this investment."
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={
                saving ||
                Boolean(amountError) ||
                roiLoading ||
                !roi ||
                Boolean(roiError)
              }
            >
              {saving ? "Submitting…" : "Confirm investment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
