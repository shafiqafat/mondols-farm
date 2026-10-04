import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

function InvestorManagement({
  investors,
  canEdit,

  onViewPortfolio,

  investorDialogOpen,
  setInvestorDialogOpen,

  editingInvestor,
  setEditingInvestor,

  investorForm,
  setInvestorForm,

  investorError,
  setInvestorError,

  savingInvestor,

  handleCreateInvestor,
  handleUpdateInvestor,

  getEmptyInvestorForm,
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">
            Investors
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage people and organizations that provide capital to the farm.
          </p>
        </div>

        {canEdit && (
          <Button
            type="button"
            onClick={() => {
              setInvestorError("");
              setEditingInvestor(null);
              setInvestorForm(getEmptyInvestorForm());
              setInvestorDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            New investor
          </Button>
        )}
      </div>

      {investors.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              No investors have been registered yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-border/70 bg-card shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-border/60">
              {investors.map((investor) => (
                <div
                  key={investor.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{investor.name}</p>

                      <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium capitalize">
                        {investor.status}
                      </span>
                    </div>

                    <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                      {investor.email && <p>{investor.email}</p>}
                      {investor.phone && <p>{investor.phone}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onViewPortfolio(investor)}
                    >
                      Portfolio
                    </Button>

                    {canEdit && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInvestorError("");
                          setEditingInvestor(investor);

                          setInvestorForm({
                            name: investor.name ?? "",
                            email: investor.email ?? "",
                            phone: investor.phone ?? "",
                            address: investor.address ?? "",
                            status: investor.status ?? "active",
                            notes: investor.notes ?? "",
                          });

                          setInvestorDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {canEdit && (
        <Dialog
          open={investorDialogOpen}
          onOpenChange={(open) => {
            setInvestorDialogOpen(open);

            if (!open) {
              setInvestorError("");
              setEditingInvestor(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-3xl p-7 sm:p-8">
            <DialogHeader>
              <DialogTitle>
                {editingInvestor ? "Edit investor" : "Create investor"}
              </DialogTitle>

              <DialogDescription>
                {editingInvestor
                  ? "Update the investor profile without changing investment history."
                  : "Register a person or organization that can invest in the farm."}
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={
                editingInvestor ? handleUpdateInvestor : handleCreateInvestor
              }
              className="space-y-8"
            >
              {investorError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                  <p className="text-sm text-destructive">{investorError}</p>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2.5">
                  <label
                    htmlFor="investor-name"
                    className="text-sm font-medium"
                  >
                    Name
                  </label>

                  <Input
                    id="investor-name"
                    value={investorForm.name}
                    onChange={(e) =>
                      setInvestorForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="investor-email"
                    className="text-sm font-medium"
                  >
                    Email
                  </label>

                  <Input
                    id="investor-email"
                    type="email"
                    value={investorForm.email}
                    onChange={(e) =>
                      setInvestorForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="investor-phone"
                    className="text-sm font-medium"
                  >
                    Phone
                  </label>

                  <Input
                    id="investor-phone"
                    value={investorForm.phone}
                    onChange={(e) =>
                      setInvestorForm((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2.5">
                  <label
                    htmlFor="investor-status"
                    className="text-sm font-medium"
                  >
                    Status
                  </label>

                  <select
                    id="investor-status"
                    value={investorForm.status}
                    onChange={(e) =>
                      setInvestorForm((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-2.5 sm:col-span-2">
                  <label
                    htmlFor="investor-address"
                    className="text-sm font-medium"
                  >
                    Address
                  </label>

                  <textarea
                    id="investor-address"
                    rows={3}
                    value={investorForm.address}
                    onChange={(e) =>
                      setInvestorForm((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2.5 sm:col-span-2">
                  <label
                    htmlFor="investor-notes"
                    className="text-sm font-medium"
                  >
                    Notes
                  </label>

                  <textarea
                    id="investor-notes"
                    rows={4}
                    value={investorForm.notes}
                    onChange={(e) =>
                      setInvestorForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border/60 pt-5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setInvestorDialogOpen(false)}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={savingInvestor}>
                  {savingInvestor
                    ? "Saving…"
                    : editingInvestor
                      ? "Save changes"
                      : "Create investor"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}

export default InvestorManagement;
