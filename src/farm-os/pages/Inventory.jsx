import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { computeStock } from "../engines/inventoryEngine";
import { localDateISO } from "../lib/localDate";
import "./Inventory.css";

function Inventory() {
  const [items, setItems] = useState([]);
  const [lotsByItem, setLotsByItem] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [newItem, setNewItem] = useState({ name: "", unit: "kg", reorderLeadTimeDays: "", safetyStock: "" });
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
      reorder_lead_time_days: newItem.reorderLeadTimeDays ? Number(newItem.reorderLeadTimeDays) : null,
      safety_stock: newItem.safetyStock ? Number(newItem.safetyStock) : null,
    });

    setAddingItem(false);
    if (error) {
      setPageError(error.message);
      return;
    }
    setNewItem({ name: "", unit: "kg", reorderLeadTimeDays: "", safetyStock: "" });
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

    if (!qty || qty <= 0 || Number.isNaN(cost)) {
      setPageError("Enter a valid quantity and cost per unit before recording a purchase.");
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

    setPurchaseForms((prev) => ({ ...prev, [item.id]: { qty: "", costPerUnit: "", purchasedAt: localDateISO() } }));
    loadAll();
  }

  if (loading) return <p className="farmos-inventory__status">Loading inventory…</p>;
  if (loadError)
    return <p className="farmos-inventory__status farmos-inventory__status--error">{loadError}</p>;

  return (
    <div className="farmos-inventory">
      <h1 className="farmos-inventory__title">Inventory</h1>

      {pageError && (
        <p className="farmos-inventory__status farmos-inventory__status--error">{pageError}</p>
      )}

      <div className="farmos-inventory__items">
        {items.length === 0 && (
          <p className="farmos-inventory__status">No inventory items yet — add your first one below.</p>
        )}

        {items.map((item) => {
          const lots = lotsByItem[item.id] ?? [];
          const { totalRemaining, weightedAvgCost } = computeStock(lots);
          const isLow = item.safety_stock != null && totalRemaining <= item.safety_stock;
          const form = purchaseForms[item.id] ?? { qty: "", costPerUnit: "", purchasedAt: localDateISO() };

          return (
            <div key={item.id} className="farmos-inv-item">
              <div className="farmos-inv-item__header">
                <span className="farmos-inv-item__name">{item.name}</span>
                <span
                  className={`farmos-inv-item__stock${isLow ? " farmos-inv-item__stock--low" : ""}`}
                >
                  {totalRemaining.toFixed(2)} {item.unit}
                </span>
              </div>

              <p className="farmos-inv-item__meta">
                Avg cost ৳{weightedAvgCost.toFixed(2)}/{item.unit}
                {item.safety_stock != null && ` · Safety stock ${item.safety_stock} ${item.unit}`}
              </p>

              {lots.length > 0 && (
                <details className="farmos-inv-item__lots">
                  <summary>{lots.length} lot{lots.length > 1 ? "s" : ""} on record</summary>
                  <ul>
                    {lots.map((lot) => (
                      <li key={lot.id}>
                        {lot.purchased_at}: {Number(lot.qty_remaining).toFixed(2)} / {Number(lot.qty_purchased).toFixed(2)} {item.unit} remaining
                        {" "}at ৳{Number(lot.cost_per_unit).toFixed(2)}/{item.unit}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="farmos-inv-item__purchase-row">
                <input
                  type="number"
                  step="any"
                  placeholder={`Qty (${item.unit})`}
                  value={form.qty}
                  onChange={(e) => updatePurchaseForm(item.id, "qty", e.target.value)}
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Cost/unit (৳)"
                  value={form.costPerUnit}
                  onChange={(e) => updatePurchaseForm(item.id, "costPerUnit", e.target.value)}
                />
                <input
                  type="date"
                  value={form.purchasedAt}
                  onChange={(e) => updatePurchaseForm(item.id, "purchasedAt", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleRecordPurchase(item)}
                  disabled={savingPurchase === item.id}
                >
                  {savingPurchase === item.id ? "Saving…" : "Record purchase"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <form className="farmos-inventory__add-item" onSubmit={handleAddItem}>
        <h2 className="farmos-inventory__section-title">Add inventory item</h2>
        <div className="farmos-inventory__add-item-fields">
          <input
            type="text"
            placeholder="Name, e.g. Quail Layer Feed"
            value={newItem.name}
            onChange={(e) => setNewItem((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <select
            value={newItem.unit}
            onChange={(e) => setNewItem((p) => ({ ...p, unit: e.target.value }))}
          >
            <option value="kg">kg</option>
            <option value="liter">liter</option>
            <option value="bag">bag</option>
            <option value="unit">unit</option>
          </select>
          <input
            type="number"
            placeholder="Reorder lead time (days)"
            value={newItem.reorderLeadTimeDays}
            onChange={(e) => setNewItem((p) => ({ ...p, reorderLeadTimeDays: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Safety stock"
            value={newItem.safetyStock}
            onChange={(e) => setNewItem((p) => ({ ...p, safetyStock: e.target.value }))}
          />
          <button type="submit" disabled={addingItem}>
            {addingItem ? "Adding…" : "Add item"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Inventory;
