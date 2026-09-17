import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { computeStock } from "../engines/inventoryEngine";
import { localDateISO } from "../lib/localDate";
import { Package } from "lucide-react";

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
    // loadAll is intentionally reused by handleAddItem/handleRecordPurchase
    // too, so it's defined at component scope rather than inline here.
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
      reorder_lead_time_days: newItem.reorderLeadTimeDays
        ? Number(newItem.reorderLeadTimeDays)
        : null,
      safety_stock: newItem.safetyStock ? Number(newItem.safetyStock) : null,
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
      [item.id]: { qty: "", costPerUnit: "", purchasedAt: localDateISO() },
    }));
    loadAll();
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading inventory…</p>
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
    <div className="space-y-7">
      <div className="flex flex-col gap-5 border-b border-border/60 pb-7">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            <Package className="size-4 text-primary" />
            <span>Farm operations</span>
          </div>

          <div>
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-foreground sm:text-5xl">
              Inventory
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Track farm supplies, current stock, purchase costs, and inventory
              coverage in one place.
            </p>
          </div>
        </div>
      </div>

      {pageError && (
        <Card className="border-destructive/30">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive">{pageError}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {items.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                No inventory items yet — add your first one below.
              </p>
            </CardContent>
          </Card>
        )}

        {items.map((item) => {
          const lots = lotsByItem[item.id] ?? [];
          const { totalRemaining, weightedAvgCost } = computeStock(lots);

          const isLow =
            item.safety_stock != null && totalRemaining <= item.safety_stock;

          const form = purchaseForms[item.id] ?? {
            qty: "",
            costPerUnit: "",
            purchasedAt: localDateISO(),
          };

          return (
            <Card
              key={item.id}
              className="border-border/70 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-lg">{item.name}</CardTitle>

                    <CardDescription className="mt-1">
                      Average cost ৳{weightedAvgCost.toFixed(2)}/{item.unit}
                      {item.safety_stock != null &&
                        ` · Safety stock ${item.safety_stock} ${item.unit}`}
                    </CardDescription>
                  </div>

                  <Badge
                    variant={isLow ? "destructive" : "secondary"}
                    className="shrink-0"
                  >
                    {totalRemaining.toFixed(2)} {item.unit}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {lots.length > 0 && (
                  <details className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
                    <summary className="cursor-pointer text-sm font-medium text-foreground">
                      {lots.length} lot{lots.length > 1 ? "s" : ""} on record
                    </summary>

                    <ul className="mt-3 space-y-2 border-t border-border/60 pt-3">
                      {lots.map((lot) => (
                        <li
                          key={lot.id}
                          className="text-xs leading-5 text-muted-foreground"
                        >
                          {lot.purchased_at}:{" "}
                          {Number(lot.qty_remaining).toFixed(2)} /{" "}
                          {Number(lot.qty_purchased).toFixed(2)} {item.unit}{" "}
                          remaining at ৳{Number(lot.cost_per_unit).toFixed(2)}/
                          {item.unit}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                <div className="grid gap-2 border-t border-border/60 pt-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    type="number"
                    step="any"
                    placeholder={`Qty (${item.unit})`}
                    value={form.qty}
                    onChange={(e) =>
                      updatePurchaseForm(item.id, "qty", e.target.value)
                    }
                  />

                  <Input
                    type="number"
                    step="any"
                    placeholder="Cost/unit (৳)"
                    value={form.costPerUnit}
                    onChange={(e) =>
                      updatePurchaseForm(item.id, "costPerUnit", e.target.value)
                    }
                  />

                  <Input
                    type="date"
                    value={form.purchasedAt}
                    onChange={(e) =>
                      updatePurchaseForm(item.id, "purchasedAt", e.target.value)
                    }
                  />

                  <Button
                    type="button"
                    onClick={() => handleRecordPurchase(item)}
                    disabled={savingPurchase === item.id}
                    className="w-full"
                  >
                    {savingPurchase === item.id ? "Saving…" : "Record purchase"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <form
        onSubmit={handleAddItem}
        className="rounded-xl border border-dashed border-border bg-card shadow-sm"
      >
        <div className="border-b border-border/60 px-5 py-4">
          <h2 className="text-base font-semibold tracking-[-0.01em]">
            Add inventory item
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a new supply or resource to your farm inventory.
          </p>
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
            {addingItem ? "Adding…" : "Add item"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default Inventory;
