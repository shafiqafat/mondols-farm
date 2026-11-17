import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ShoppingCart, Pencil, Trash2 } from "lucide-react";

import { supabase } from "../lib/supabaseClient";
import { localDateISO } from "../lib/localDate";
import { useAuth } from "../hooks/useAuth";
import { canWrite } from "../lib/permissions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const emptyForm = () => ({
  entityId: "",
  projectId: "",
  productName: "",
  pricingMethod: "quantity",
  weightEntryMode: "average",
  itemCount: "",
  weightPerItem: "",
  totalWeight: "",
  stockQuantity: "",
  stockUnit: "",
  saleQuantity: "",
  saleUnit: "",
  unitPrice: "",
  discount: "0",
  customerName: "",
  soldAt: localDateISO(),
  notes: "",
});

const money = (value) =>
  `৳${Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Sales() {
  const { role } = useAuth();
  const canEdit = canWrite(role);

  const [entities, setEntities] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [salesError, setSalesError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [actionError, setActionError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingSaleId, setDeletingSaleId] = useState(null);
  const [filterEntity, setFilterEntity] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const selectedEntity = entities.find((entity) => entity.id === form.entityId);
  const calculatedSaleQuantity = useMemo(() => {
    if (form.pricingMethod !== "weight") return form.saleQuantity;
    if (form.weightEntryMode === "average") {
      const count = Number(form.itemCount);
      const averageWeight = Number(form.weightPerItem);
      if (
        !form.itemCount ||
        !form.weightPerItem ||
        count <= 0 ||
        averageWeight <= 0
      )
        return "";
      return String(count * averageWeight);
    }
    return form.totalWeight;
  }, [
    form.pricingMethod,
    form.weightEntryMode,
    form.itemCount,
    form.weightPerItem,
    form.totalWeight,
    form.saleQuantity,
  ]);

  const formTotal = useMemo(() => {
    const qty = Number(calculatedSaleQuantity);
    const price = Number(form.unitPrice);
    const discount = Number(form.discount || 0);
    if (
      !Number.isFinite(qty) ||
      !Number.isFinite(price) ||
      !Number.isFinite(discount) ||
      qty <= 0 ||
      price < 0 ||
      discount < 0
    )
      return 0;
    return Math.max(qty * price - discount, 0);
  }, [calculatedSaleQuantity, form.unitPrice, form.discount]);

  const summary = useMemo(
    () => ({
      revenue: sales.reduce(
        (sum, sale) => sum + Number(sale.total_amount || 0),
        0,
      ),
      count: sales.length,
      entityLinked: sales.filter((sale) => sale.entity_id).length,
    }),
    [sales],
  );

  const filteredSales = useMemo(() => {
    if (filterDateFrom && filterDateTo && filterDateFrom > filterDateTo)
      return [];
    return sales.filter((sale) => {
      if (filterEntity && sale.entity_id !== filterEntity) return false;
      if (filterProject && sale.project_id !== filterProject) return false;
      if (filterDateFrom && sale.sold_at < filterDateFrom) return false;
      if (filterDateTo && sale.sold_at > filterDateTo) return false;
      return true;
    });
  }, [sales, filterEntity, filterProject, filterDateFrom, filterDateTo]);

  async function loadSales() {
    setLoadingSales(true);
    setSalesError("");
    const { data, error } = await supabase
      .from("sales")
      .select(
        `id, quantity, unit, sale_quantity, sale_unit, stock_quantity, stock_unit, product_name, pricing_method, unit_price, discount, total_amount, customer_name, sold_at, notes, entity_id, project_id, farm_entities:entity_id(label), farm_projects:project_id(name)`,
      )
      .order("sold_at", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) setSalesError(error.message);
    else setSales(data ?? []);
    setLoadingSales(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      // Fetch everything first; update React state only after the async
      // requests resolve. This avoids synchronous setState calls in an effect.
      const [entityResult, projectResult, salesResult] = await Promise.all([
        supabase
          .from("farm_entities")
          .select(
            "id, label, quantity, status, species_config:species_config_id(name)",
          )
          .order("label"),
        supabase.from("farm_projects").select("id, name").order("name"),
        supabase
          .from("sales")
          .select(
            `id, quantity, unit, sale_quantity, sale_unit, stock_quantity, stock_unit, product_name, pricing_method, unit_price, discount, total_amount, customer_name, sold_at, notes, entity_id, project_id, farm_entities:entity_id(label), farm_projects:project_id(name)`,
          )
          .order("sold_at", { ascending: false })
          .order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;

      if (entityResult.error || projectResult.error) {
        setLoadError(
          entityResult.error?.message || projectResult.error?.message,
        );
      } else {
        setEntities(entityResult.data ?? []);
        setProjects(projectResult.data ?? []);
      }
      setLoading(false);

      if (salesResult.error) {
        setSalesError(salesResult.error.message);
      } else {
        setSales(salesResult.data ?? []);
      }
      setLoadingSales(false);
    }

    void loadInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setSubmitError("");
    setSubmitted(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    setSubmitted(false);
    if (!form.entityId && !form.projectId) {
      setSubmitError(
        "Select a project when recording a sale without a farm entity.",
      );
      return;
    }
    if (!form.entityId && !form.productName.trim()) {
      setSubmitError(
        "Enter a product or item name when no entity is selected.",
      );
      return;
    }
    if (!form.saleUnit.trim()) {
      setSubmitError(
        "Enter the sale unit (for example kg, piece, egg, or bundle).",
      );
      return;
    }
    const qty = Number(calculatedSaleQuantity);
    const price = Number(form.unitPrice);
    const discount = Number(form.discount || 0);
    const derivedStockQuantity =
      form.pricingMethod === "weight" && form.weightEntryMode === "average"
        ? form.itemCount === ""
          ? null
          : Number(form.itemCount)
        : form.stockQuantity === ""
          ? null
          : Number(form.stockQuantity);
    if (!Number.isFinite(qty) || qty <= 0)
      return setSubmitError("Sale quantity must be greater than zero.");
    if (!Number.isFinite(price) || price < 0)
      return setSubmitError("Unit price cannot be negative.");
    if (!Number.isFinite(discount) || discount < 0)
      return setSubmitError("Discount cannot be negative.");
    if (
      derivedStockQuantity !== null &&
      (!Number.isFinite(derivedStockQuantity) || derivedStockQuantity < 0)
    )
      return setSubmitError("Source stock quantity cannot be negative.");
    if (
      form.pricingMethod === "weight" &&
      form.weightEntryMode === "average" &&
      (!form.itemCount ||
        Number(form.itemCount) <= 0 ||
        !form.weightPerItem ||
        Number(form.weightPerItem) <= 0)
    )
      return setSubmitError(
        "Enter the number of items and the weight per item.",
      );
    if (
      form.pricingMethod === "weight" &&
      form.weightEntryMode === "total" &&
      (!form.totalWeight || Number(form.totalWeight) <= 0)
    )
      return setSubmitError("Enter the actual total weight.");

    setSubmitting(true);
    const { error } = await supabase.rpc("record_sale", {
      p_entity_id: form.entityId || null,
      p_quantity: qty,
      p_unit: form.saleUnit.trim(),
      p_unit_price: price,
      p_discount: discount,
      p_customer_name: form.customerName.trim() || null,
      p_sold_at: form.soldAt,
      p_notes: form.notes.trim() || null,
      p_project_id: form.projectId || null,
      p_product_name: form.productName.trim() || selectedEntity?.label || null,
      p_stock_quantity: derivedStockQuantity,
      p_stock_unit: form.stockUnit.trim() || null,
      p_pricing_method: form.pricingMethod,
      p_sale_quantity: qty,
      p_sale_unit: form.saleUnit.trim(),
    });
    setSubmitting(false);
    if (error) {
      setSubmitError(error.message);
      return;
    }
    setForm(emptyForm());
    setSubmitted(true);
    await loadSales();
  }

  function openEdit(sale) {
    setActionError("");
    setEditingSale({
      ...sale,
      entity_id: sale.entity_id ?? "",
      project_id: sale.project_id ?? "",
      product_name: sale.product_name ?? sale.farm_entities?.label ?? "",
      pricing_method: sale.pricing_method ?? "quantity",
      sale_quantity: String(sale.sale_quantity ?? sale.quantity ?? ""),
      sale_unit: sale.sale_unit ?? sale.unit ?? "",
      stock_quantity:
        sale.stock_quantity == null ? "" : String(sale.stock_quantity),
      stock_unit: sale.stock_unit ?? "",
      unit_price: String(sale.unit_price ?? ""),
      discount: String(sale.discount ?? 0),
      customer_name: sale.customer_name ?? "",
      notes: sale.notes ?? "",
    });
  }

  async function handleUpdateSale() {
    if (!editingSale) return;
    const qty = Number(editingSale.sale_quantity);
    const price = Number(editingSale.unit_price);
    const discount = Number(editingSale.discount || 0);
    const stockQty =
      editingSale.stock_quantity === ""
        ? null
        : Number(editingSale.stock_quantity);
    if (!editingSale.entity_id && !editingSale.project_id)
      return setActionError("Select a project when no entity is selected.");
    if (!editingSale.product_name.trim())
      return setActionError("Product name is required.");
    if (!editingSale.sale_unit.trim())
      return setActionError("Sale unit is required.");
    if (!Number.isFinite(qty) || qty <= 0)
      return setActionError("Sale quantity must be greater than zero.");
    if (!Number.isFinite(price) || price < 0)
      return setActionError("Unit price cannot be negative.");
    if (!Number.isFinite(discount) || discount < 0)
      return setActionError("Discount cannot be negative.");
    if (stockQty !== null && (!Number.isFinite(stockQty) || stockQty < 0))
      return setActionError("Source stock quantity cannot be negative.");

    setSavingEdit(true);
    setActionError("");
    const { error } = await supabase.rpc("update_sale", {
      p_sale_id: editingSale.id,
      p_quantity: qty,
      p_unit: editingSale.sale_unit.trim(),
      p_unit_price: price,
      p_discount: discount,
      p_customer_name: editingSale.customer_name.trim() || null,
      p_sold_at: editingSale.sold_at,
      p_notes: editingSale.notes.trim() || null,
      p_entity_id: editingSale.entity_id || null,
      p_project_id: editingSale.project_id || null,
      p_product_name: editingSale.product_name.trim(),
      p_stock_quantity: stockQty,
      p_stock_unit: editingSale.stock_unit.trim() || null,
      p_pricing_method: editingSale.pricing_method,
      p_sale_quantity: qty,
      p_sale_unit: editingSale.sale_unit.trim(),
    });
    setSavingEdit(false);
    if (error) return setActionError(error.message);
    setEditingSale(null);
    await loadSales();
  }

  async function handleDeleteSale(saleId) {
    if (
      !window.confirm(
        "Delete this sale? Its linked Finance income transaction will also be removed.",
      )
    )
      return;
    setDeletingSaleId(saleId);
    setActionError("");
    const { error } = await supabase.rpc("delete_sale", { p_sale_id: saleId });
    setDeletingSaleId(null);
    if (error) return setActionError(error.message);
    await loadSales();
  }

  if (loading)
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Loading sales data…
        </CardContent>
      </Card>
    );
  if (loadError)
    return (
      <Card>
        <CardContent className="py-6 text-sm text-destructive">
          {loadError}
        </CardContent>
      </Card>
    );

  const editTotal = editingSale
    ? Math.max(
        Number(editingSale.sale_quantity || 0) *
          Number(editingSale.unit_price || 0) -
          Number(editingSale.discount || 0),
        0,
      )
    : 0;

  return (
    <div className="space-y-8">
      <section className="border-b border-border/60 pb-7">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <ShoppingCart className="size-4 text-primary" /> Farm operations
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-5xl">
          Sales
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Record sales across farm projects, whether linked to a tracked entity
          or recorded directly against a project.
        </p>
      </section>

      {canEdit && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sale source</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                Farm entity (optional)
                <select
                  value={form.entityId}
                  onChange={(e) => {
                    const id = e.target.value;
                    updateForm("entityId", id);
                    const entity = entities.find((item) => item.id === id);
                    if (entity && !form.productName)
                      updateForm("productName", entity.label);
                  }}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">No entity / project-level sale</option>
                  {entities
                    .filter((entity) => entity.status === "active")
                    .map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.label} —{" "}
                        {entity.species_config?.name ?? "Entity"}
                      </option>
                    ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                Farm project
                <select
                  value={form.projectId}
                  onChange={(e) => updateForm("projectId", e.target.value)}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">
                    {form.entityId
                      ? "Use entity's project assignment"
                      : "Select project…"}
                  </option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                Product / item name
                <Input
                  value={form.productName}
                  onChange={(e) => updateForm("productName", e.target.value)}
                  placeholder={
                    selectedEntity?.label || "e.g. Fresh mango, eggs, broiler"
                  }
                />
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Sale measurement & pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                  Pricing method
                  <select
                    value={form.pricingMethod}
                    onChange={(e) =>
                      updateForm("pricingMethod", e.target.value)
                    }
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="quantity">By quantity</option>
                    <option value="weight">By weight</option>
                    <option value="fixed">Fixed price per item</option>
                  </select>
                </label>
                {form.pricingMethod === "weight" ? (
                  <>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                      Weight entry method
                      <select
                        value={form.weightEntryMode}
                        onChange={(e) =>
                          updateForm("weightEntryMode", e.target.value)
                        }
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="average">
                          Calculate from average weight
                        </option>
                        <option value="total">Enter actual total weight</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                      Sale unit
                      <Input
                        value={form.saleUnit}
                        onChange={(e) => updateForm("saleUnit", e.target.value)}
                        placeholder="kg"
                      />
                    </label>
                    {form.weightEntryMode === "average" ? (
                      <>
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                          Number of items sold
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={form.itemCount}
                            onChange={(e) => {
                              updateForm("itemCount", e.target.value);
                              updateForm("stockQuantity", e.target.value);
                            }}
                            placeholder="e.g. 2"
                          />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                          Average weight per item ({form.saleUnit || "kg"})
                          <Input
                            type="number"
                            min="0"
                            step="0.001"
                            value={form.weightPerItem}
                            onChange={(e) =>
                              updateForm("weightPerItem", e.target.value)
                            }
                            placeholder="e.g. 2.5"
                          />
                        </label>
                      </>
                    ) : (
                      <>
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                          Actual total weight ({form.saleUnit || "kg"})
                          <Input
                            type="number"
                            min="0"
                            step="0.001"
                            value={form.totalWeight}
                            onChange={(e) =>
                              updateForm("totalWeight", e.target.value)
                            }
                            placeholder="e.g. 5"
                          />
                        </label>
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                          Number of items sold (optional)
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={form.stockQuantity}
                            onChange={(e) =>
                              updateForm("stockQuantity", e.target.value)
                            }
                            placeholder="e.g. 2 birds"
                          />
                        </label>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                      Sale quantity
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={form.saleQuantity}
                        onChange={(e) =>
                          updateForm("saleQuantity", e.target.value)
                        }
                        placeholder="e.g. 30"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                      Sale unit
                      <Input
                        value={form.saleUnit}
                        onChange={(e) => updateForm("saleUnit", e.target.value)}
                        placeholder="e.g. egg, piece, dozen"
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                      Source stock quantity (optional)
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={form.stockQuantity}
                        onChange={(e) =>
                          updateForm("stockQuantity", e.target.value)
                        }
                        placeholder="e.g. 30"
                      />
                    </label>
                  </>
                )}
                <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                  Source stock unit (optional)
                  <Input
                    value={form.stockUnit}
                    onChange={(e) => updateForm("stockUnit", e.target.value)}
                    placeholder="e.g. bird, plant, bag"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                  Unit price (৳ per{" "}
                  {form.pricingMethod === "weight"
                    ? form.saleUnit || "kg"
                    : form.saleUnit || "unit"}
                  )
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.unitPrice}
                    onChange={(e) => updateForm("unitPrice", e.target.value)}
                    placeholder="160.00"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                  Discount (৳)
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount}
                    onChange={(e) => updateForm("discount", e.target.value)}
                    placeholder="0.00"
                  />
                </label>
              </div>
              {form.pricingMethod === "weight" && (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Calculated sale weight
                      </p>
                      <p className="mt-1 text-2xl font-semibold tabular-nums">
                        {Number(calculatedSaleQuantity || 0).toLocaleString(
                          "en-BD",
                          { maximumFractionDigits: 3 },
                        )}{" "}
                        {form.saleUnit || "kg"}
                      </p>
                      {form.weightEntryMode === "average" &&
                        form.itemCount &&
                        form.weightPerItem && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {form.itemCount} items × {form.weightPerItem}{" "}
                            {form.saleUnit || "kg"} each
                          </p>
                        )}
                      {form.weightEntryMode === "total" && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Using the actual measured total weight
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Source stock reference:{" "}
                      {form.weightEntryMode === "average"
                        ? form.itemCount || "—"
                        : form.stockQuantity || "—"}{" "}
                      {form.stockUnit ||
                        (form.weightEntryMode === "average"
                          ? "items"
                          : "units")}
                    </p>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Source stock quantity is recorded for reference only. Recording
                a sale does not automatically deduct stock.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Customer & sale details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                Sale date
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    value={form.soldAt}
                    onChange={(e) => updateForm("soldAt", e.target.value)}
                    className="pl-9"
                  />
                </div>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                Customer (optional)
                <Input
                  value={form.customerName}
                  onChange={(e) => updateForm("customerName", e.target.value)}
                  placeholder="Customer name"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-muted-foreground">
                Notes (optional)
                <Input
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                  placeholder="Additional details"
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
                <p className="mt-1 text-2xl font-semibold">
                  {money(formTotal)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Sale quantity × unit price − discount
                </p>
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
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sales revenue
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {money(summary.revenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sales recorded
            </p>
            <p className="mt-2 text-2xl font-semibold">{summary.count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Entity-linked sales
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {summary.entityLinked}
            </p>
          </CardContent>
        </Card>
      </div>

      {actionError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sales history</CardTitle>
        </CardHeader>
        <div className="border-b px-6 pb-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              Entity
              <select
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All entities</option>
                {entities.map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              Project
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              From date
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-muted-foreground">
              To date
              <Input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </label>
          </div>
          <Button
            className="mt-3"
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
        <CardContent>
          {loadingSales ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading sales…
            </div>
          ) : salesError ? (
            <div className="py-4 text-sm text-destructive">{salesError}</div>
          ) : filteredSales.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No sales match the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <p className="mb-3 text-xs text-muted-foreground">
                Showing {filteredSales.length} of {sales.length} sales
              </p>
              <table className="w-full min-w-[950px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Product</th>
                    <th className="px-3 py-3 font-medium">Entity / Project</th>
                    <th className="px-3 py-3 font-medium">Sale quantity</th>
                    <th className="px-3 py-3 font-medium">Stock qty.</th>
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
                      <td className="whitespace-nowrap px-3 py-3">
                        {sale.sold_at}
                      </td>
                      <td className="px-3 py-3">
                        {sale.product_name ||
                          sale.farm_entities?.label ||
                          "Farm product"}
                        <div className="text-xs capitalize text-muted-foreground">
                          {sale.pricing_method || "quantity"} pricing
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {sale.farm_entities?.label || "Project-level"}
                        <div className="text-xs text-muted-foreground">
                          {sale.farm_projects?.name || "—"}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {Number(
                          sale.sale_quantity ?? sale.quantity,
                        ).toLocaleString()}{" "}
                        {sale.sale_unit || sale.unit}
                      </td>
                      <td className="px-3 py-3">
                        {sale.stock_quantity == null
                          ? "—"
                          : `${Number(sale.stock_quantity).toLocaleString()} ${sale.stock_unit || ""}`}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {money(sale.unit_price)} / {sale.sale_unit || sale.unit}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-medium">
                        {money(sale.total_amount)}
                      </td>
                      <td className="px-3 py-3">{sale.customer_name || "—"}</td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEdit(sale)}
                              >
                                <Pencil className="mr-1 size-3.5" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={deletingSaleId === sale.id}
                                onClick={() => handleDeleteSale(sale.id)}
                              >
                                <Trash2 className="mr-1 size-3.5" />
                                {deletingSaleId === sale.id
                                  ? "Deleting…"
                                  : "Delete"}
                              </Button>
                            </>
                          )}
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

      {canEdit && (
        <Dialog
          open={Boolean(editingSale)}
          onOpenChange={(open) => {
            if (!open) {
              setEditingSale(null);
              setActionError("");
            }
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit sale</DialogTitle>
            </DialogHeader>
            {editingSale && (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-sm">
                    Farm entity (optional)
                    <select
                      value={editingSale.entity_id}
                      onChange={(e) =>
                        setEditingSale({
                          ...editingSale,
                          entity_id: e.target.value,
                        })
                      }
                      className="h-10 rounded-md border border-input bg-background px-3"
                    >
                      <option value="">No entity</option>
                      {entities.map((entity) => (
                        <option key={entity.id} value={entity.id}>
                          {entity.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    Farm project
                    <select
                      value={editingSale.project_id}
                      onChange={(e) =>
                        setEditingSale({
                          ...editingSale,
                          project_id: e.target.value,
                        })
                      }
                      className="h-10 rounded-md border border-input bg-background px-3"
                    >
                      <option value="">Select project</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    Product name
                    <Input
                      value={editingSale.product_name}
                      onChange={(e) =>
                        setEditingSale({
                          ...editingSale,
                          product_name: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    Pricing method
                    <select
                      value={editingSale.pricing_method}
                      onChange={(e) =>
                        setEditingSale({
                          ...editingSale,
                          pricing_method: e.target.value,
                        })
                      }
                      className="h-10 rounded-md border border-input bg-background px-3"
                    >
                      <option value="quantity">By quantity</option>
                      <option value="weight">By weight</option>
                      <option value="fixed">Fixed price</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    Sale quantity
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={editingSale.sale_quantity}
                      onChange={(e) =>
                        setEditingSale({
                          ...editingSale,
                          sale_quantity: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    Sale unit
                    <Input
                      value={editingSale.sale_unit}
                      onChange={(e) =>
                        setEditingSale({
                          ...editingSale,
                          sale_unit: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    Source stock quantity
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={editingSale.stock_quantity}
                      onChange={(e) =>
                        setEditingSale({
                          ...editingSale,
                          stock_quantity: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    Source stock unit
                    <Input
                      value={editingSale.stock_unit}
                      onChange={(e) =>
                        setEditingSale({
                          ...editingSale,
                          stock_unit: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    Unit price (৳)
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
                  <label className="flex flex-col gap-1.5 text-sm">
                    Discount (৳)
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
                  <label className="flex flex-col gap-1.5 text-sm">
                    Sale date
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
                  <label className="flex flex-col gap-1.5 text-sm">
                    Customer
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
                  <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
                    Notes
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
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">
                    Updated sale total
                  </p>
                  <p className="text-xl font-semibold">{money(editTotal)}</p>
                </div>
                {actionError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {actionError}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingSale(null)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateSale} disabled={savingEdit}>
                    {savingEdit ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default Sales;
