// Offline write queue — localStorage-backed, per-device (not shared between
// viewers, which is fine: this is for one person's phone going in and out
// of signal, not multi-user sync).
//
// Each queued item is { id, type, payload, queuedAt }. `type` determines
// how syncQueue.js resolves it — see that file for the handlers.

const STORAGE_KEY = "farmos:offline-queue";
const CHANGE_EVENT = "farmos:queue-changed";

function readQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // localStorage can fail (private browsing, quota) — the write attempt
    // itself already happened online-first where possible, so this is a
    // last-resort path; failing silently here is preferable to crashing
    // the save flow over a queue that was only ever a fallback.
  }
}

export function enqueue(type, payload) {
  const queue = readQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    queuedAt: new Date().toISOString(),
  });
  writeQueue(queue);
}

export function getQueue() {
  return readQueue();
}

export function removeFromQueue(id) {
  writeQueue(readQueue().filter((item) => item.id !== id));
}

export function queueLength() {
  return readQueue().length;
}

export const QUEUE_CHANGE_EVENT = CHANGE_EVENT;
