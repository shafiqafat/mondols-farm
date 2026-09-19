import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ShoppingCart } from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import { localDateISO } from "../lib/localDate";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function Sales() {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [entityId, setEntityId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [discount, setDiscount] = useState("0");
  const [customerName, setCustomerName] = useState("");
  const [soldAt, setSoldAt] = useState(localDateISO());
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const [sales, setSales] = useState([]);
  const [loadingSales, setLoadingSales] = useState(true);
  const [salesError, setSalesError] = useState("");
  const [filterEntity, setFilterEntity] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [editingSale, setEditingSale] = useState(null);
  const [deletingSaleId, setDeletingSaleId] = useState(null);
  const [actionError, setActionError] = useState("");

  const salesSummary = useMemo(() => {
    const totalRevenue = sales.reduce(
      (sum, sale) => sum + Number(sale.total_amount || 0),
      0,
    );

    const totalQuantity = sales.reduce(
      (sum, sale) => sum + Number(sale.quantity || 0),
      0,
    );

    return {
      totalRevenue,
      totalQuantity,
      saleCount: sales.length,
    };
  }, [sales]);

  const filteredSales = useMemo(() => {
    if (filterDateFrom && filterDateTo && filterDateFrom > filterDateTo) {
      return [];
    }
    return sales.filter((sale) => {
      if (filterEntity && sale.entity_id !== filterEntity) {
        return false;
      }

      if (filterProject && sale.project_id !== filterProject) {
        return false;
      }

      if (filterDateFrom && sale.sold_at < filterDateFrom) {
        return false;
      }

      if (filterDateTo && sale.sold_at > filterDateTo) {
        return false;
      }

      return true;
    });
  }, [sales, filterEntity, filterProject, filterDateFrom, filterDateTo]);

  useEffect(() => {
    let cancelled = false;

    async function loadEntities() {
      setLoading(true);
      setLoadError("");

      const { data, error } = await supabase
        .from("farm_entities")
        .select("id, label, quantity, species_config:species_config_id(name)")
        .eq("status", "active")
        .order("label");

      if (cancelled) return;

      if (error) {
        setLoadError(error.message);
        setLoading(false);
        return;
      }

      setEntities(data ?? []);
      setLoading(false);
    }

    loadEntities();
    loadSales();

    return () => {
      cancelled = true;
    };
  }, []);

  async function loadSales() {
    setLoadingSales(true);
    setSalesError("");

    const { data, error } = await supabase
      .from("sales")
      .select(
        `
      id,
      quantity,
      unit,
      unit_price,
      discount,
      total_amount,
      customer_name,
      sold_at,
      notes,
      entity_id,
      project_id,
      farm_entities:entity_id (label, species_config:species_config_id (name)),
      farm_projects:project_id (name)`,
      )
      .order("sold_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setSalesError(error.message);
      setLoadingSales(false);
      return;
    }

    setSales(data ?? []);
    setLoadingSales(false);
  }
  const handleUpdateSale = async () => {
    if (!editingSale) return;

    const qty = Number(editingSale.quantity);
    const price = Number(editingSale.unit_price);
    const discountAmount = Number(editingSale.discount || 0);

    if (!Number.isFinite(qty) || qty <= 0) {
      setActionError("Quantity must be greater than 0.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setActionError("Unit price cannot be negative.");
      return;
    }

    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      setActionError("Discount cannot be negative.");
      return;
    }

    setActionError("");

    const { error } = await supabase.rpc("update_sale", {
      p_sale_id: editingSale.id,
      p_quantity: qty,
      p_unit: editingSale.unit.trim(),
      p_unit_price: price,
      p_discount: discountAmount,
      p_customer_name: editingSale.customer_name?.trim() || null,
      p_sold_at: editingSale.sold_at,
      p_notes: editingSale.notes?.trim() || null,
    });

    if (error) {
      setActionError(error.message);
      return;
    }

    setEditingSale(null);
    await loadSales();
  };

  const handleDeleteSale = async (saleId) => {
    const confirmed = window.confirm(
      "Delete this sale? The linked Finance income transaction will also be removed.",
    );

    if (!confirmed) return;

    setDeletingSaleId(saleId);
    setActionError("");

    const { error } = await supabase.rpc("delete_sale", {
      p_sale_id: saleId,
    });

    if (error) {
      setActionError(error.message);
      setDeletingSaleId(null);
      return;
    }

    setDeletingSaleId(null);
    await loadSales();
  };

  const total = useMemo(() => {
    const qty = Number(quantity);
    const price = Number(unitPrice);
    const discountAmount = Number(discount || 0);

    if (
      !Number.isFinite(qty) ||
      !Number.isFinite(price) ||
      !Number.isFinite(discountAmount) ||
      qty <= 0 ||
      price < 0 ||
      discountAmount < 0
    ) {
      return 0;
    }

    return Math.max(qty * price - discountAmount, 0);
  }, [quantity, unitPrice, discount]);

  async function handleSubmit(e) {
    e.preventDefault();

    setSubmitError("");
    setSubmitted(false);

    const qty = Number(quantity);
    const price = Number(unitPrice);
    const discountAmount = Number(discount || 0);

    if (!entityId) {
      setSubmitError("Select a farm entity.");
      return;
    }

    if (!unit.trim()) {
      setSubmitError("Enter the sale unit.");
      return;
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      setSubmitError("Quantity must be greater than zero.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setSubmitError("Unit price cannot be negative.");
      return;
    }

    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      setSubmitError("Discount cannot be negative.");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.rpc("record_sale", {
        p_entity_id: entityId,
        p_quantity: qty,
        p_unit: unit.trim(),
        p_unit_price: price,
        p_discount: discountAmount,
        p_customer_name: customerName.trim() || null,
        p_sold_at: soldAt,
        p_notes: notes.trim() || null,
      });

      if (error) throw error;
      await loadSales();

      setQuantity("");
      setUnit("");
      setUnitPrice("");
      setDiscount("0");
      setCustomerName("");
      setNotes("");
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message ?? "Could not record the sale.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading farm entities…
        </CardContent>
      </Card>
    );
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-destructive">{loadError}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-5 text-forest" />
          <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
        </div>

        <p className="text-sm text-muted-foreground">
          Record farm sales and automatically connect revenue to the related
          entity and project.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sale details</CardTitle>
          </CardHeader>

          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
              <span>Farm entity</span>
              <select
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select entity…</option>

                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.label} — {entity.species_config?.name ?? "Unknown"}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
              <span>Quantity</span>
              <Input
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
              <span>Unit</span>
              <Input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. egg, kg, bird"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
              <span>Unit price (৳)</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
              <span>Discount (৳)</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0.00"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
              <span>Sale date</span>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={soldAt}
                  onChange={(e) => setSoldAt(e.target.value)}
                  className="pl-9"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground sm:col-span-2">
              <span>Customer</span>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
              <span>Notes</span>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
              />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Sale total
              </p>
              <p className="mt-1 text-2xl font-semibold">৳{total.toFixed(2)}</p>
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Recording…" : "Record sale"}
            </Button>
          </CardContent>
        </Card>

        {submitError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        {submitted && (
          <div className="rounded-lg border border-forest/20 bg-forest/5 px-4 py-3 text-sm text-forest">
            Sale recorded successfully.
          </div>
        )}
      </form>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sales revenue
            </p>
            <p className="mt-2 text-2xl font-semibold">
              ৳{salesSummary.totalRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Quantity sold
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {salesSummary.totalQuantity}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sales recorded
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {salesSummary.saleCount}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales History</CardTitle>
        </CardHeader>

        <div className="border-b px-6 pb-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
              <span>Entity</span>
              <select
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
                className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All entities</option>

                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
              <span>Project</span>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All projects</option>

                {[
                  ...new Map(
                    sales
                      .filter(
                        (sale) => sale.project_id && sale.farm_projects?.name,
                      )
                      .map((sale) => [
                        sale.project_id,
                        sale.farm_projects.name,
                      ]),
                  ),
                ].map(([projectId, projectName]) => (
                  <option key={projectId} value={projectId}>
                    {projectName}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
              <span>From date</span>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
              <span>To date</span>
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </label>
          </div>
          <div className="flex items-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFilterEntity("");
                setFilterProject("");
                setFilterDateFrom("");
                setFilterDateTo("");
              }}
            >
              Clear filters
            </Button>
          </div>
        </div>

        <CardContent>
          {loadingSales ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading sales…
            </div>
          ) : salesError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {salesError}
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No sales match the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <p className="mb-3 text-xs text-muted-foreground">
                Showing {filteredSales.length} of {sales.length} sales
              </p>
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Entity</th>
                    <th className="px-3 py-3 font-medium">Project</th>
                    <th className="px-3 py-3 font-medium">Quantity</th>
                    <th className="px-3 py-3 font-medium">Unit price</th>
                    <th className="px-3 py-3 font-medium">Total</th>
                    <th className="px-3 py-3 font-medium">Customer</th>
                    <th className="px-3 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-b last:border-0">
                      <td className="px-3 py-3 whitespace-nowrap">
                        {sale.sold_at}
                      </td>

                      <td className="px-3 py-3">
                        {sale.farm_entities?.label ?? "—"}
                      </td>

                      <td className="px-3 py-3">
                        {sale.farm_projects?.name ?? "—"}
                      </td>

                      <td className="px-3 py-3">
                        {Number(sale.quantity).toLocaleString()} {sale.unit}
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap">
                        ৳{Number(sale.unit_price).toFixed(2)}
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap font-medium">
                        ৳{Number(sale.total_amount).toFixed(2)}
                      </td>

                      <td className="px-3 py-3">{sale.customer_name || "—"}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setActionError("");
                              setEditingSale({
                                ...sale,
                                customer_name: sale.customer_name ?? "",
                                notes: sale.notes ?? "",
                              });
                            }}
                          >
                            Edit
                          </Button>

                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={deletingSaleId === sale.id}
                            onClick={() => handleDeleteSale(sale.id)}
                          >
                            {deletingSaleId === sale.id
                              ? "Deleting…"
                              : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={Boolean(editingSale)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSale(null);
            setActionError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
          </DialogHeader>

          {editingSale && (
            <div className="space-y-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                <span>Quantity</span>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={editingSale.quantity}
                  onChange={(e) =>
                    setEditingSale({
                      ...editingSale,
                      quantity: e.target.value,
                    })
                  }
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium">
                <span>Unit</span>
                <Input
                  value={editingSale.unit}
                  onChange={(e) =>
                    setEditingSale({
                      ...editingSale,
                      unit: e.target.value,
                    })
                  }
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium">
                <span>Unit price (৳)</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingSale.unit_price}
                  onChange={(e) =>
                    setEditingSale({
                      ...editingSale,
                      unit_price: e.target.value,
                    })
                  }
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium">
                <span>Discount (৳)</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingSale.discount}
                  onChange={(e) =>
                    setEditingSale({
                      ...editingSale,
                      discount: e.target.value,
                    })
                  }
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium">
                <span>Customer</span>
                <Input
                  value={editingSale.customer_name}
                  onChange={(e) =>
                    setEditingSale({
                      ...editingSale,
                      customer_name: e.target.value,
                    })
                  }
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium">
                <span>Sale date</span>
                <Input
                  type="date"
                  value={editingSale.sold_at}
                  onChange={(e) =>
                    setEditingSale({
                      ...editingSale,
                      sold_at: e.target.value,
                    })
                  }
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium">
                <span>Notes</span>
                <Input
                  value={editingSale.notes}
                  onChange={(e) =>
                    setEditingSale({
                      ...editingSale,
                      notes: e.target.value,
                    })
                  }
                />
              </label>

              {actionError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {actionError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingSale(null);
                    setActionError("");
                  }}
                >
                  Cancel
                </Button>

                <Button type="button" onClick={handleUpdateSale}>
                  Save changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Sales;
