import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { computeStock } from "../engines/inventoryEngine";
import { localDateISO } from "../lib/localDate";
import { useAuth } from "../hooks/useAuth";
import { canWrite } from "../lib/permissions";
import {
  AlertTriangle,
  ArrowDownToLine,
  Boxes,
  CalendarDays,
  CheckCircle2,
  Package,
  Pencil,
  Plus,
  Save,
  X,
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
  const { role } = useAuth();
  const canEdit = canWrite(role);

  const [items, setItems] = useState([]);
  const [lotsByItem, setLotsByItem] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const inventorySectionRef = useRef(null);

  const [newItem, setNewItem] = useState({
    name: "",
    category: "other",
    description: "",
    unit: "kg",
    storageLocation: "",
    reorderLeadTimeDays: "",
    safetyStock: "",
  });

  const [addingItem, setAddingItem] = useState(false);
  const [purchaseForms, setPurchaseForms] = useState({});
  const [savingPurchase, setSavingPurchase] = useState(null);
  const [updatedItemId, setUpdatedItemId] = useState(null);
  const [pageError, setPageError] = useState("");
  const [lotReconciliations, setLotReconciliations] = useState({});
  const [reconcilingLotId, setReconcilingLotId] = useState(null);
  const [reconciliationMessage, setReconciliationMessage] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemEditForm, setItemEditForm] = useState({});
  const [editingLotId, setEditingLotId] = useState(null);
  const [lotEditForm, setLotEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

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

    const { data: reconciliationRows, error: reconciliationErr } =
      await supabase
        .from("inventory_lot_reconciliations")
        .select(
          "lot_id, actual_quantity, recorded_consumption_quantity, adjustment_factor, reconciled_at",
        );

    if (reconciliationErr) {
      setLoadError(
        `Unable to load lot reconciliation data. Apply the inventory reconciliation migration first. ${reconciliationErr.message}`,
      );
      setLoading(false);
      return;
    }

    const grouped = {};
    const reconciliationMap = {};
    for (const reconciliation of reconciliationRows ?? []) {
      reconciliationMap[reconciliation.lot_id] = reconciliation;
    }

    for (const lot of lotRows ?? []) {
      if (!grouped[lot.item_id]) grouped[lot.item_id] = [];
      grouped[lot.item_id].push(lot);
    }

    setItems(itemRows ?? []);
    setLotsByItem(grouped);
    setLotReconciliations(reconciliationMap);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
  }, []);

  useEffect(() => {
    const element = inventorySectionRef.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInventoryVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.12,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  async function handleAddItem(e) {
    e.preventDefault();

    if (!newItem.name.trim()) return;

    setAddingItem(true);
    setPageError("");

    const { error } = await supabase.from("inventory_items").insert({
      name: newItem.name.trim(),
      category: newItem.category,
      description: newItem.description.trim() || null,
      storage_location: newItem.storageLocation.trim() || null,
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
      category: "other",
      description: "",
      unit: "kg",
      storageLocation: "",
      reorderLeadTimeDays: "",
      safetyStock: "",
    });

    loadAll();
  }

  async function handleConfirmLotEmpty(item, lot) {
    const existingReconciliation = lotReconciliations[lot.id];
    if (existingReconciliation) return;

    const confirmed = window.confirm(
      `Confirm that the ${item.name} stock lot purchased on ${lot.purchased_at} is physically empty? FarmOS will compare the lot's actual recorded quantity (${Number(lot.qty_purchased).toFixed(2)} ${item.unit}) with its Daily Log allocations and distribute the difference proportionally. This action cannot be undone.`,
    );
    if (!confirmed) return;

    setReconcilingLotId(lot.id);
    setPageError("");
    setReconciliationMessage("");

    const { data, error } = await supabase.rpc("confirm_inventory_lot_empty", {
      p_lot_id: lot.id,
    });

    setReconcilingLotId(null);

    if (error) {
      setPageError(error.message);
      return;
    }

    const factor = Number(data?.adjustment_factor);
    const recorded = Number(data?.recorded_consumption_quantity);
    const actual = Number(data?.actual_quantity);
    setReconciliationMessage(
      `Reconciled ${item.name}: ${recorded.toFixed(2)} ${item.unit} recorded against ${actual.toFixed(2)} ${item.unit} actual stock (adjustment factor ${factor.toFixed(4)}). Original Daily Log measurements are preserved.`,
    );
    await loadAll();
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

  function startEditItem(item) {
    setPageError("");
    setEditingItemId(item.id);
    setItemEditForm({
      name: item.name ?? "",
      category: item.category ?? "other",
      description: item.description ?? "",
      storageLocation: item.storage_location ?? "",
      unit: item.unit ?? "kg",
      reorderLeadTimeDays: item.reorder_lead_time_days ?? "",
      safetyStock: item.safety_stock ?? "",
    });
  }

  async function handleSaveItem(item) {
    if (!itemEditForm.name?.trim()) {
      setPageError("Inventory item name is required.");
      return;
    }

    const hasLots = (lotsByItem[item.id] ?? []).length > 0;
    if (hasLots && itemEditForm.unit !== item.unit) {
      setPageError(
        "The unit cannot be changed while purchase lots exist. Create a new inventory item with the correct unit instead.",
      );
      return;
    }

    setSavingEdit(true);
    setPageError("");
    const nextName = itemEditForm.name.trim();
    const { error } = await supabase
      .from("inventory_items")
      .update({
        name: nextName,
        category: itemEditForm.category,
        description: itemEditForm.description?.trim() || null,
        storage_location: itemEditForm.storageLocation?.trim() || null,
        unit: itemEditForm.unit,
        reorder_lead_time_days:
          itemEditForm.reorderLeadTimeDays !== ""
            ? Number(itemEditForm.reorderLeadTimeDays)
            : null,
        safety_stock:
          itemEditForm.safetyStock !== ""
            ? Number(itemEditForm.safetyStock)
            : null,
      })
      .eq("id", item.id);

    if (!error && nextName !== item.name) {
      const lotIds = (lotsByItem[item.id] ?? []).map((lot) => lot.id);
      if (lotIds.length) {
        const { error: financeError } = await supabase
          .from("finance_transactions")
          .update({ category: nextName })
          .in("inventory_lot_id", lotIds);
        if (financeError) {
          setPageError(
            `Item was updated, but linked purchase categories could not be renamed: ${financeError.message}`,
          );
        }
      }
    }

    setSavingEdit(false);
    if (error) {
      setPageError(error.message);
      return;
    }
    setEditingItemId(null);
    await loadAll();
  }

  function startEditLot(lot) {
    setPageError("");
    setEditingLotId(lot.id);
    setLotEditForm({
      qty: String(lot.qty_purchased ?? ""),
      costPerUnit: String(lot.cost_per_unit ?? ""),
      purchasedAt: lot.purchased_at ?? localDateISO(),
      expiryDate: lot.expiry_date ?? "",
    });
  }

  async function handleSaveLot(lot) {
    const qty = Number(lotEditForm.qty);
    const cost = Number(lotEditForm.costPerUnit);
    if (
      !Number.isFinite(qty) ||
      qty <= 0 ||
      !Number.isFinite(cost) ||
      cost < 0 ||
      !lotEditForm.purchasedAt
    ) {
      setPageError(
        "Enter a valid purchase quantity, non-negative unit cost, and purchase date.",
      );
      return;
    }

    setSavingEdit(true);
    setPageError("");
    const { error } = await supabase.rpc("edit_inventory_purchase", {
      p_lot_id: lot.id,
      p_qty: qty,
      p_cost_per_unit: cost,
      p_purchased_at: lotEditForm.purchasedAt,
      p_expiry_date: lotEditForm.expiryDate || null,
    });
    setSavingEdit(false);

    if (error) {
      setPageError(error.message);
      return;
    }
    setEditingLotId(null);
    await loadAll();
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
      p_expiry_date: form.expiryDate || null,
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
        expiryDate: "",
      },
    }));

    setUpdatedItemId(item.id);
    loadAll();

    setTimeout(() => {
      setUpdatedItemId(null);
    }, 700);
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

          {canEdit && (
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
          )}
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

      {reconciliationMessage && (
        <Card className="border-emerald-500/30 bg-emerald-500/[0.04]">
          <CardContent className="flex items-start gap-3 p-4">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <p className="text-sm text-foreground">{reconciliationMessage}</p>
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
      <section ref={inventorySectionRef} className="space-y-4">
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
            expiryDate: "",
          };

          return (
            <Card
              key={item.id}
              className={`inventory-card ${
                inventoryVisible ? "inventory-card-visible" : ""
              } ${updatedItemId === item.id ? "inventory-card-updated" : ""} ${
                isLow
                  ? "overflow-hidden border-amber-500/30 shadow-sm"
                  : "overflow-hidden border-border/70 shadow-sm"
              }`}
              style={{ "--delay": `${items.indexOf(item) * 80}ms` }}
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

                    <div className="min-w-0 flex-1">
                      {editingItemId === item.id ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Input
                            value={itemEditForm.name ?? ""}
                            onChange={(e) =>
                              setItemEditForm((p) => ({
                                ...p,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Item name"
                          />
                          <select
                            value={itemEditForm.category ?? "other"}
                            onChange={(e) =>
                              setItemEditForm((p) => ({
                                ...p,
                                category: e.target.value,
                              }))
                            }
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="seeds">Seeds</option>
                            <option value="feed">Animal feed</option>
                            <option value="medicine">Medicine</option>
                            <option value="fertilizer">Fertilizer</option>
                            <option value="pesticide">Pesticide</option>
                            <option value="equipment">Equipment</option>
                            <option value="materials">Materials</option>
                            <option value="other">Other</option>
                          </select>
                          <select
                            value={itemEditForm.unit ?? item.unit}
                            onChange={(e) =>
                              setItemEditForm((p) => ({
                                ...p,
                                unit: e.target.value,
                              }))
                            }
                            disabled={lots.length > 0}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                          >
                            <option value="kg">kg</option>
                            <option value="g">gram (g)</option>
                            <option value="liter">liter</option>
                            <option value="ml">milliliter (ml)</option>
                            <option value="bag">bag</option>
                            <option value="packet">packet</option>
                            <option value="piece">piece</option>
                            <option value="unit">unit</option>
                          </select>
                          <Input
                            value={itemEditForm.storageLocation ?? ""}
                            onChange={(e) =>
                              setItemEditForm((p) => ({
                                ...p,
                                storageLocation: e.target.value,
                              }))
                            }
                            placeholder="Storage location (optional)"
                          />
                          <Input
                            value={itemEditForm.description ?? ""}
                            onChange={(e) =>
                              setItemEditForm((p) => ({
                                ...p,
                                description: e.target.value,
                              }))
                            }
                            placeholder="Description (optional)"
                          />
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={itemEditForm.reorderLeadTimeDays ?? ""}
                            onChange={(e) =>
                              setItemEditForm((p) => ({
                                ...p,
                                reorderLeadTimeDays: e.target.value,
                              }))
                            }
                            placeholder="Reorder lead time (days)"
                          />
                          <Input
                            type="number"
                            min="0"
                            step="any"
                            value={itemEditForm.safetyStock ?? ""}
                            onChange={(e) =>
                              setItemEditForm((p) => ({
                                ...p,
                                safetyStock: e.target.value,
                              }))
                            }
                            placeholder={`Safety stock (${item.unit})`}
                          />
                          <div className="flex gap-2 sm:col-span-2">
                            <Button
                              size="sm"
                              type="button"
                              onClick={() => handleSaveItem(item)}
                              disabled={savingEdit}
                            >
                              <Save className="size-3.5" /> Save
                            </Button>
                            <Button
                              size="sm"
                              type="button"
                              variant="outline"
                              onClick={() => setEditingItemId(null)}
                              disabled={savingEdit}
                            >
                              <X className="size-3.5" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="truncate text-lg">
                              {item.name}
                            </CardTitle>
                            {canEdit && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-7"
                                onClick={() => startEditItem(item)}
                                aria-label={`Edit ${item.name}`}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                            )}
                          </div>
                          <CardDescription className="mt-1">
                            Average cost ৳{weightedAvgCost.toFixed(2)}/
                            {item.unit}
                            {safetyStock != null &&
                              ` · Safety stock ${safetyStock} ${item.unit}`}
                            {item.category &&
                              ` · ${String(item.category).replaceAll("_", " ")}`}
                            {item.storage_location &&
                              ` · Stored: ${item.storage_location}`}
                          </CardDescription>
                          {item.description && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </>
                      )}
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
                  <details className="inventory-purchase-history">
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
                          {lots.map((lot) => {
                            const reconciliation = lotReconciliations[lot.id];
                            return (
                              <div key={lot.id} className="space-y-2 px-3 py-3">
                                <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 text-xs">
                                  <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <CalendarDays className="size-3.5" />
                                    <span>{lot.purchased_at}</span>
                                    {lot.expiry_date &&
                                      (() => {
                                        const daysLeft = Math.ceil(
                                          (new Date(
                                            `${lot.expiry_date}T00:00:00`,
                                          ) -
                                            new Date(
                                              new Date().toDateString(),
                                            )) /
                                            86400000,
                                        );
                                        const expiryLabel =
                                          daysLeft < 0
                                            ? "Expired"
                                            : daysLeft <= 30
                                              ? `Expires in ${daysLeft}d`
                                              : `Expires ${lot.expiry_date}`;
                                        return (
                                          <span
                                            className={`block text-[11px] ${daysLeft <= 30 ? "font-medium text-amber-700" : ""}`}
                                          >
                                            {expiryLabel}
                                          </span>
                                        );
                                      })()}
                                  </span>

                                  <span className="font-medium">
                                    {Number(lot.qty_remaining).toFixed(2)}{" "}
                                    {item.unit}
                                  </span>

                                  <span className="flex items-center justify-between gap-2 text-muted-foreground">
                                    ৳{Number(lot.cost_per_unit).toFixed(2)}/
                                    {item.unit}
                                    {canEdit && !reconciliation && (
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="size-7"
                                        onClick={() => startEditLot(lot)}
                                        aria-label="Edit purchase lot"
                                      >
                                        <Pencil className="size-3.5" />
                                      </Button>
                                    )}
                                  </span>
                                </div>

                                {editingLotId === lot.id ? (
                                  <div className="grid gap-2 rounded-md border border-primary/20 bg-muted/20 p-3 sm:grid-cols-3">
                                    <Input
                                      type="number"
                                      min="0.000001"
                                      step="any"
                                      value={lotEditForm.qty ?? ""}
                                      onChange={(e) =>
                                        setLotEditForm((p) => ({
                                          ...p,
                                          qty: e.target.value,
                                        }))
                                      }
                                      placeholder={`Purchased quantity (${item.unit})`}
                                    />
                                    <Input
                                      type="number"
                                      min="0"
                                      step="any"
                                      value={lotEditForm.costPerUnit ?? ""}
                                      onChange={(e) =>
                                        setLotEditForm((p) => ({
                                          ...p,
                                          costPerUnit: e.target.value,
                                        }))
                                      }
                                      placeholder="Cost per unit"
                                    />
                                    <Input
                                      type="date"
                                      value={lotEditForm.purchasedAt ?? ""}
                                      onChange={(e) =>
                                        setLotEditForm((p) => ({
                                          ...p,
                                          purchasedAt: e.target.value,
                                        }))
                                      }
                                    />
                                    <Input
                                      type="date"
                                      value={lotEditForm.expiryDate ?? ""}
                                      onChange={(e) =>
                                        setLotEditForm((p) => ({
                                          ...p,
                                          expiryDate: e.target.value,
                                        }))
                                      }
                                      aria-label="Expiry date (optional)"
                                    />
                                    <div className="flex gap-2 sm:col-span-3">
                                      <Button
                                        size="sm"
                                        type="button"
                                        onClick={() => handleSaveLot(lot)}
                                        disabled={savingEdit}
                                      >
                                        <Save className="size-3.5" /> Save
                                        purchase
                                      </Button>
                                      <Button
                                        size="sm"
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditingLotId(null)}
                                        disabled={savingEdit}
                                      >
                                        <X className="size-3.5" /> Cancel
                                      </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground sm:col-span-3">
                                      Only untouched purchase lots can be
                                      edited. Lots with consumption or
                                      reconciliation history are locked to
                                      protect FIFO and audit records.
                                    </p>
                                  </div>
                                ) : null}

                                {reconciliation ? (
                                  <div className="rounded-md bg-emerald-500/[0.07] px-3 py-2 text-xs">
                                    <p className="font-medium text-emerald-700">
                                      Empty confirmed · Reconciled
                                    </p>
                                    <p className="mt-1 text-muted-foreground">
                                      Actual:{" "}
                                      {Number(
                                        reconciliation.actual_quantity,
                                      ).toFixed(2)}{" "}
                                      {item.unit}
                                      {" · "}Recorded use:{" "}
                                      {Number(
                                        reconciliation.recorded_consumption_quantity,
                                      ).toFixed(2)}{" "}
                                      {item.unit}
                                      {" · "}Factor:{" "}
                                      {Number(
                                        reconciliation.adjustment_factor,
                                      ).toFixed(4)}
                                    </p>
                                    <p className="mt-1 text-muted-foreground">
                                      {new Date(
                                        reconciliation.reconciled_at,
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                ) : canEdit ? (
                                  <div className="flex flex-col gap-2 rounded-md border border-dashed border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs leading-5 text-muted-foreground">
                                      When this lot is physically empty,
                                      reconcile its Daily Log measurements
                                      against the actual stock quantity (
                                      {Number(lot.qty_purchased).toFixed(2)}{" "}
                                      {item.unit}).
                                    </p>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="shrink-0"
                                      disabled={reconcilingLotId === lot.id}
                                      onClick={() =>
                                        handleConfirmLotEmpty(item, lot)
                                      }
                                    >
                                      <CheckCircle2 className="size-3.5" />
                                      {reconcilingLotId === lot.id
                                        ? "Reconciling…"
                                        : "Confirm empty & reconcile"}
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </details>
                )}

                {/* Purchase */}
                {canEdit && (
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

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
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

                      <Input
                        type="date"
                        value={form.expiryDate ?? ""}
                        onChange={(e) =>
                          updatePurchaseForm(
                            item.id,
                            "expiryDate",
                            e.target.value,
                          )
                        }
                        aria-label="Expiry date (optional)"
                        title="Expiry date (optional)"
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
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Add item */}
      {canEdit && (
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

            <div className="space-y-4 p-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Basic information
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Input
                    type="text"
                    placeholder="Item name, e.g. Carrot seeds"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                  />
                  <select
                    value={newItem.category}
                    onChange={(e) =>
                      setNewItem((p) => ({ ...p, category: e.target.value }))
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="seeds">Seeds</option>
                    <option value="feed">Animal feed</option>
                    <option value="medicine">Medicine</option>
                    <option value="fertilizer">Fertilizer</option>
                    <option value="pesticide">Pesticide</option>
                    <option value="equipment">Equipment</option>
                    <option value="materials">Materials</option>
                    <option value="other">Other</option>
                  </select>
                  <select
                    value={newItem.unit}
                    onChange={(e) =>
                      setNewItem((p) => ({ ...p, unit: e.target.value }))
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="kg">kg</option>
                    <option value="g">gram (g)</option>
                    <option value="liter">liter</option>
                    <option value="ml">milliliter (ml)</option>
                    <option value="bag">bag</option>
                    <option value="packet">packet</option>
                    <option value="piece">piece</option>
                    <option value="unit">unit</option>
                  </select>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Stock management
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Input
                    type="number"
                    min="0"
                    step="1"
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
                    placeholder={`Safety stock (${newItem.unit})`}
                    value={newItem.safetyStock}
                    onChange={(e) =>
                      setNewItem((p) => ({ ...p, safetyStock: e.target.value }))
                    }
                  />
                  <Input
                    placeholder="Storage location (optional)"
                    value={newItem.storageLocation}
                    onChange={(e) =>
                      setNewItem((p) => ({
                        ...p,
                        storageLocation: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Additional details
                </p>
                <Input
                  placeholder="Description (optional)"
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={addingItem}>
                  <Plus className="size-4" />
                  {addingItem ? "Adding…" : "Add inventory item"}
                </Button>
              </div>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}

export default Inventory;
