import { supabase } from "./supabaseClient";
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
      const { error } = await supabase
        .from("entity_events")
        .insert(item.payload);
      if (error) throw error;
      return { ok: true };
    }

    case "finance_transactions_insert": {
      const { error } = await supabase
        .from("finance_transactions")
        .insert(item.payload);
      if (error) throw error;
      return { ok: true };
    }

    case "content_items_insert": {
      const { error } = await supabase
        .from("content_items")
        .insert(item.payload);
      if (error) throw error;
      return { ok: true };
    }

    case "daily_log": {
      const { events, expense, content } = item.payload;
      const { data, error } = await supabase.rpc("process_daily_log", {
        p_events: events ?? [],
        p_expense: expense ?? null,
        p_content: content ?? null,
      });
      if (error) throw error;
      return { ok: true, shortfalls: data?.shortfalls ?? [] };
    }

    case "inventory_consume": {
      throw new Error(
        "Legacy inventory consumption operation is no longer supported. " +
          "Re-save this operation through Daily Log while online.",
      );
    }

    default:
      throw new Error(`Unsupported offline queue operation: ${item.type}`);
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
      if (result.shortfalls) shortfalls.push(...result.shortfalls);
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
