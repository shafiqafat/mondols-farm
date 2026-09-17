import { useEffect, useState } from "react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { getQueue, QUEUE_CHANGE_EVENT } from "../lib/offlineQueue";
import { processQueue } from "../lib/syncQueue";

function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const [queueLength, setQueueLength] = useState(getQueue().length);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncMessage, setLastSyncMessage] = useState("");

  useEffect(() => {
    function refresh() {
      setQueueLength(getQueue().length);
    }
    window.addEventListener(QUEUE_CHANGE_EVENT, refresh);
    return () => window.removeEventListener(QUEUE_CHANGE_EVENT, refresh);
  }, []);

  async function runSync() {
    setSyncing(true);
    setLastSyncMessage("");
    const result = await processQueue();
    setSyncing(false);
    setQueueLength(getQueue().length);

    if (result.error) {
      setLastSyncMessage(`Synced ${result.processed}, ${result.remaining} still pending.`);
    } else if (result.shortfalls.length > 0) {
      setLastSyncMessage(
        `Synced, but stock ran short: ${result.shortfalls
          .map((s) => `${s.itemName ?? "item"} short by ${s.shortfall.toFixed(2)}`)
          .join("; ")}`
      );
    } else if (result.processed > 0) {
      setLastSyncMessage("All caught up.");
    }
  }

  // Auto-sync the moment connectivity returns, so a farm visit that goes
  // out of signal and back doesn't need a manual step to catch up.
  useEffect(() => {
    if (isOnline && getQueue().length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      runSync();
    }
    // runSync intentionally isn't listed as a dependency — it would
    // resync on every render otherwise; this should only re-run when
    // online status changes.
  }, [isOnline]);

  if (isOnline && queueLength === 0 && !lastSyncMessage) return null;

  return (
    <div className="farmos-offline-indicator">
      {!isOnline && <span className="farmos-offline-indicator__badge">Offline</span>}
      {queueLength > 0 && (
        <span className="farmos-offline-indicator__queue">
          {queueLength} pending
        </span>
      )}
      {isOnline && queueLength > 0 && (
        <button type="button" onClick={runSync} disabled={syncing}>
          {syncing ? "Syncing…" : "Sync now"}
        </button>
      )}
      {lastSyncMessage && (
        <span className="farmos-offline-indicator__message">{lastSyncMessage}</span>
      )}
    </div>
  );
}

export default OfflineIndicator;
