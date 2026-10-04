import { useState } from "react";
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

export default function InvestorCommitmentDialog({
  opportunity,
  open,
  onOpenChange,
  onSuccess,
}) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!opportunity) {
    return null;
  }

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

  function resetForm() {
    setAmount("");
    setNotes("");
    setError("");
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

            <Button type="submit" disabled={saving || Boolean(amountError)}>
              {saving ? "Submitting…" : "Confirm investment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
