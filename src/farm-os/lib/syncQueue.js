import { supabase } from "./supabaseClient";
import { consumeFIFO } from "../engines/inventoryEngine";
import { getQueue, removeFromQueue } from "./offlineQueue";

/**
 * Resolve one queued item against Supabase. Inventory consumption is
 * deliberately computed here, at sync time, against then-current lots —
 * not against whatever was cached on the phone when offline — so FIFO
 * stays correct even if other purchases/consumption happened elsewhere
 * in the meantime.
 */
async function resolveItem(item) {
  switch (item.type) {
    case "entity_events_insert": {
      const { error } = await supabase.from("entity_events").insert(item.payload);
      if (error) throw error;
      return { ok: true };
    }

    case "finance_transactions_insert": {
      const { error } = await supabase.from("finance_transactions").insert(item.payload);
      if (error) throw error;
      return { ok: true };
    }

    case "content_items_insert": {
      const { error } = await supabase.from("content_items").insert(item.payload);
      if (error) throw error;
      return { ok: true };
    }

    case "inventory_consume": {
      const { itemId, qtyKg, itemName } = item.payload;
      const { data: lots, error: lotsError } = await supabase
        .from("inventory_lots")
        .select("*")
        .eq("item_id", itemId);
      if (lotsError) throw lotsError;

      const result = consumeFIFO(lots ?? [], qtyKg);
      for (const updated of result.updatedLots) {
        const { error } = await supabase
          .from("inventory_lots")
          .update({ qty_remaining: updated.qty_remaining })
          .eq("id", updated.id);
        if (error) throw error;
      }

      return {
        ok: true,
        shortfall: result.shortfall > 0 ? { itemName, shortfall: result.shortfall } : null,
      };
    }

    default:
      // Unknown item types are skipped rather than blocking the whole
      // queue forever — this can happen if a future version adds a type
      // and an old queued item from before that update is still pending.
      return { ok: true, skipped: true };
  }
}

/**
 * Process the whole queue in order. Stops at the first failure (e.g. a
 * connection drop mid-sync) so nothing is skipped or reordered — whatever
 * is left stays queued for the next attempt.
 */
export async function processQueue() {
  const queue = getQueue();
  const shortfalls = [];
  let processed = 0;

  for (const item of queue) {
    try {
      const result = await resolveItem(item);
      if (result.shortfall) shortfalls.push(result.shortfall);
      removeFromQueue(item.id);
      processed++;
    } catch (err) {
      return {
        processed,
        remaining: queue.length - processed,
        shortfalls,
        error: err.message ?? "Sync failed",
      };
    }
  }

  return { processed, remaining: 0, shortfalls, error: null };
}
