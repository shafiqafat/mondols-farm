import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { computeStock } from "../engines/inventoryEngine";
import { localDateISO } from "../lib/localDate";
import {
  AlertTriangle,
  ArrowDownToLine,
  Boxes,
  CalendarDays,
  CheckCircle2,
  Package,
  Plus,
  Receipt,
  ShoppingCart,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Inventory() {
  const [items, setItems] = useState([]);
  const [lotsByItem, setLotsByItem] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [newItem, setNewItem] = useState({
    name: "",
    unit: "kg",
    reorderLeadTimeDays: "",
    safetyStock: "",
  });

  const [addingItem, setAddingItem] = useState(false);
  const [purchaseForms, setPurchaseForms] = useState({});
  const [savingPurchase, setSavingPurchase] = useState(null);
  const [pageError, setPageError] = useState("");

  async function loadAll() {
    setLoading(true);
    setLoadError("");

    const { data: itemRows, error: itemErr } = await supabase
      .from("inventory_items")
      .select("*")
      .order("name");

    if (itemErr) {
      setLoadError(itemErr.message);
      setLoading(false);
      return;
    }

    const { data: lotRows, error: lotErr } = await supabase
      .from("inventory_lots")
      .select("*")
      .order("purchased_at", { ascending: true });

    if (lotErr) {
      setLoadError(lotErr.message);
      setLoading(false);
      return;
    }

    const grouped = {};

    for (const lot of lotRows ?? []) {
      if (!grouped[lot.item_id]) grouped[lot.item_id] = [];
      grouped[lot.item_id].push(lot);
    }

    setItems(itemRows ?? []);
    setLotsByItem(grouped);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, []);

  async function handleAddItem(e) {
    e.preventDefault();

    if (!newItem.name.trim()) return;

    setAddingItem(true);
    setPageError("");

    const { error } = await supabase.from("inventory_items").insert({
      name: newItem.name.trim(),
      unit: newItem.unit,
      reorder_lead_time_days:
        newItem.reorderLeadTimeDays !== ""
          ? Number(newItem.reorderLeadTimeDays)
          : null,
      safety_stock:
        newItem.safetyStock !== "" ? Number(newItem.safetyStock) : null,
    });

    setAddingItem(false);

    if (error) {
      setPageError(error.message);
      return;
    }

    setNewItem({
      name: "",
      unit: "kg",
      reorderLeadTimeDays: "",
      safetyStock: "",
    });

    loadAll();
  }

  function updatePurchaseForm(itemId, field, value) {
    setPurchaseForms((prev) => ({
      ...prev,
      [itemId]: {
        qty: "",
        costPerUnit: "",
        purchasedAt: localDateISO(),
        ...prev[itemId],
        [field]: value,
      },
    }));
  }

  async function handleRecordPurchase(item) {
    const form = purchaseForms[item.id] ?? {};

    const qty = Number(form.qty);
    const cost = Number(form.costPerUnit);
    const purchasedAt = form.purchasedAt || localDateISO();

    if (
      !Number.isFinite(qty) ||
      qty <= 0 ||
      !Number.isFinite(cost) ||
      cost <= 0
    ) {
      setPageError(
        "Enter a valid quantity and cost per unit before recording a purchase.",
      );
      return;
    }

    setSavingPurchase(item.id);
    setPageError("");

    const { error } = await supabase.rpc("record_inventory_purchase", {
      p_item_id: item.id,
      p_qty: qty,
      p_cost_per_unit: cost,
      p_purchased_at: purchasedAt,
    });

    setSavingPurchase(null);

    if (error) {
      setPageError(error.message);
      return;
    }

    setPurchaseForms((prev) => ({
      ...prev,
      [item.id]: {
        qty: "",
        costPerUnit: "",
        purchasedAt: localDateISO(),
      },
    }));

    loadAll();
  }

  const inventorySummary = useMemo(() => {
    let totalItems = items.length;
    let lowStockItems = 0;
    let totalLots = 0;
    let estimatedValue = 0;

    items.forEach((item) => {
      const lots = lotsByItem[item.id] ?? [];
      const { totalRemaining, weightedAvgCost } = computeStock(lots);

      totalLots += lots.length;

      if (
        item.safety_stock != null &&
        totalRemaining <= Number(item.safety_stock)
      ) {
        lowStockItems += 1;
      }

      estimatedValue += totalRemaining * weightedAvgCost;
    });

    return {
      totalItems,
      lowStockItems,
      totalLots,
      estimatedValue,
    };
  }, [items, lotsByItem]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-2xl bg-muted/60" />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-xl bg-muted/60"
            />
          ))}
        </div>

        <div className="h-56 animate-pulse rounded-2xl bg-muted/60" />
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-destructive">
            Unable to load inventory
          </p>

          <p className="mt-1 text-sm text-muted-foreground">{loadError}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <section className="border-b border-border/60 pb-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <Package className="size-4 text-primary" />
              <span>Farm operations</span>
            </div>

            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
                Inventory
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Keep track of farm supplies, available stock, purchase costs,
                and items approaching their reorder point.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              document
                .getElementById("add-inventory-item")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="w-full sm:w-auto"
          >
            <Plus className="size-4" />
            Add inventory item
          </Button>
        </div>
      </section>

      {/* Page error */}
      {pageError && (
        <Card className="border-destructive/30 bg-destructive/[0.03]">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />

            <div>
              <p className="text-sm font-medium text-destructive">
                Inventory action failed
              </p>

              <p className="mt-1 text-sm text-muted-foreground">{pageError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <section>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  Inventory items
                </p>

                <p className="mt-1 text-3xl font-semibold tracking-tight">
                  {inventorySummary.totalItems}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Supplies currently tracked
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  Low stock
                </p>

                <p
                  className={`mt-1 text-3xl font-semibold tracking-tight ${
                    inventorySummary.lowStockItems > 0
                      ? "text-amber-600"
                      : "text-foreground"
                  }`}
                >
                  {inventorySummary.lowStockItems}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Items at or below safety stock
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  Stock value
                </p>

                <p className="mt-1 text-3xl font-semibold tracking-tight">
                  ৳
                  {inventorySummary.estimatedValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Estimated from weighted average cost
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  Purchase lots
                </p>

                <p className="mt-1 text-3xl font-semibold tracking-tight">
                  {inventorySummary.totalLots}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Historical lots recorded
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Inventory list */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Stock overview
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Current quantity and purchase history for every inventory item.
            </p>
          </div>

          {items.length > 0 && (
            <span className="hidden text-xs text-muted-foreground sm:block">
              {items.length} tracked item{items.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {items.length === 0 && (
          <Card className="border-dashed shadow-none">
            <CardContent className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <div className="rounded-full bg-muted p-3">
                <Package className="size-5 text-muted-foreground" />
              </div>

              <h3 className="mt-4 text-base font-semibold">
                No inventory items yet
              </h3>

              <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                Add your first feed, medicine, material, or other farm supply
                below to start tracking stock.
              </p>
            </CardContent>
          </Card>
        )}

        {items.map((item) => {
          const lots = lotsByItem[item.id] ?? [];
          const { totalRemaining, weightedAvgCost } = computeStock(lots);

          const safetyStock =
            item.safety_stock != null ? Number(item.safety_stock) : null;

          const isLow = safetyStock != null && totalRemaining <= safetyStock;

          const stockValue = totalRemaining * weightedAvgCost;

          const form = purchaseForms[item.id] ?? {
            qty: "",
            costPerUnit: "",
            purchasedAt: localDateISO(),
          };

          return (
            <Card
              key={item.id}
              className={
                isLow
                  ? "overflow-hidden border-amber-500/30 shadow-sm"
                  : "overflow-hidden border-border/70 shadow-sm"
              }
            >
              <CardHeader className="border-b border-border/50 bg-muted/[0.18] px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={
                        isLow
                          ? "mt-0.5 rounded-lg bg-amber-500/10 p-2.5"
                          : "mt-0.5 rounded-lg bg-primary/10 p-2.5"
                      }
                    >
                      {isLow ? (
                        <AlertTriangle className="size-4 text-amber-600" />
                      ) : (
                        <Package className="size-4 text-primary" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <CardTitle className="truncate text-lg">
                        {item.name}
                      </CardTitle>

                      <CardDescription className="mt-1">
                        Average cost ৳{weightedAvgCost.toFixed(2)}/{item.unit}
                        {safetyStock != null &&
                          ` · Safety stock ${safetyStock} ${item.unit}`}
                      </CardDescription>
                    </div>
                  </div>

                  <Badge
                    variant={isLow ? "destructive" : "secondary"}
                    className="w-fit shrink-0 gap-1.5 px-2.5 py-1"
                  >
                    {isLow ? (
                      <AlertTriangle className="size-3" />
                    ) : (
                      <CheckCircle2 className="size-3" />
                    )}

                    {isLow ? "Low stock" : "In stock"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 p-5 sm:p-6">
                {/* Stock metrics */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border/50 bg-muted/[0.12] p-3.5">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      <Boxes className="size-3.5" />
                      Available
                    </div>

                    <p className="mt-1.5 text-lg font-semibold tracking-tight">
                      {totalRemaining.toFixed(2)}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        {item.unit}
                      </span>
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/50 bg-muted/[0.12] p-3.5">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      <Receipt className="size-3.5" />
                      Stock value
                    </div>

                    <p className="mt-1.5 text-lg font-semibold tracking-tight">
                      ৳{stockValue.toFixed(0)}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/50 bg-muted/[0.12] p-3.5">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      <ArrowDownToLine className="size-3.5" />
                      Lots
                    </div>

                    <p className="mt-1.5 text-lg font-semibold tracking-tight">
                      {lots.length}
                    </p>
                  </div>
                </div>

                {/* Lot history */}
                {lots.length > 0 && (
                  <details className="group rounded-lg border border-border/50">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">Purchase history</p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {lots.length} recorded lot
                          {lots.length > 1 ? "s" : ""}
                        </p>
                      </div>

                      <span className="text-xs text-muted-foreground transition-transform group-open:rotate-180">
                        ▼
                      </span>
                    </summary>

                    <div className="border-t border-border/60 px-4 pb-4">
                      <div className="mt-2.5 overflow-hidden rounded-md border border-border/50">
                        <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 border-b border-border/50 bg-muted/30 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                          <span>Date</span>
                          <span>Remaining</span>
                          <span>Cost / unit</span>
                        </div>

                        <div className="divide-y divide-border/50">
                          {lots.map((lot) => (
                            <div
                              key={lot.id}
                              className="grid grid-cols-[1fr_1fr_1fr] gap-3 px-3 py-2.5 text-xs"
                            >
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <CalendarDays className="size-3.5" />
                                {lot.purchased_at}
                              </span>

                              <span className="font-medium">
                                {Number(lot.qty_remaining).toFixed(2)}{" "}
                                {item.unit}
                              </span>

                              <span className="text-muted-foreground">
                                ৳{Number(lot.cost_per_unit).toFixed(2)}/
                                {item.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </details>
                )}

                {/* Purchase */}
                <div className="rounded-lg border border-border/50 bg-muted/[0.12] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <ShoppingCart className="size-4 text-primary" />

                    <div>
                      <p className="text-sm font-medium">Record purchase</p>
                      <p className="text-xs text-muted-foreground">
                        Add a new stock lot for {item.name}.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      placeholder={`Quantity (${item.unit})`}
                      value={form.qty}
                      onChange={(e) =>
                        updatePurchaseForm(item.id, "qty", e.target.value)
                      }
                    />

                    <Input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Cost / unit (৳)"
                      value={form.costPerUnit}
                      onChange={(e) =>
                        updatePurchaseForm(
                          item.id,
                          "costPerUnit",
                          e.target.value,
                        )
                      }
                    />

                    <Input
                      type="date"
                      value={form.purchasedAt}
                      onChange={(e) =>
                        updatePurchaseForm(
                          item.id,
                          "purchasedAt",
                          e.target.value,
                        )
                      }
                    />

                    <Button
                      type="button"
                      onClick={() => handleRecordPurchase(item)}
                      disabled={savingPurchase === item.id}
                      className="w-full"
                    >
                      <Plus className="size-4" />
                      {savingPurchase === item.id
                        ? "Saving…"
                        : "Record purchase"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Add item */}
      <section id="add-inventory-item">
        <form
          onSubmit={handleAddItem}
          className="overflow-hidden rounded-2xl border border-dashed border-border bg-card shadow-sm"
        >
          <div className="border-b border-border/60 bg-muted/[0.18] px-5 py-5">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Plus className="size-4 text-primary" />
              </div>

              <div>
                <h2 className="text-base font-semibold tracking-tight">
                  Add inventory item
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Create a reusable inventory item for feed, medicine,
                  materials, or other farm supplies.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              type="text"
              placeholder="Name, e.g. Quail Layer Feed"
              value={newItem.name}
              onChange={(e) =>
                setNewItem((p) => ({ ...p, name: e.target.value }))
              }
              required
            />

            <select
              value={newItem.unit}
              onChange={(e) =>
                setNewItem((p) => ({ ...p, unit: e.target.value }))
              }
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="kg">kg</option>
              <option value="liter">liter</option>
              <option value="bag">bag</option>
              <option value="unit">unit</option>
            </select>

            <Input
              type="number"
              min="0"
              placeholder="Reorder lead time (days)"
              value={newItem.reorderLeadTimeDays}
              onChange={(e) =>
                setNewItem((p) => ({
                  ...p,
                  reorderLeadTimeDays: e.target.value,
                }))
              }
            />

            <Input
              type="number"
              min="0"
              step="any"
              placeholder="Safety stock"
              value={newItem.safetyStock}
              onChange={(e) =>
                setNewItem((p) => ({
                  ...p,
                  safetyStock: e.target.value,
                }))
              }
            />

            <Button type="submit" disabled={addingItem} className="w-full">
              <Plus className="size-4" />
              {addingItem ? "Adding…" : "Add item"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default Inventory;
