// Task engine — pure functions only.

/**
 * Classify an incomplete task relative to today's date, for the
 * Overdue / Today / Upcoming / No due date groupings on the Tasks page.
 */
export function classifyTask(task, todayISO) {
  if (task.completed_at) return "completed";
  if (!task.due_at) return "no-due-date";
  if (task.due_at < todayISO) return "overdue";
  if (task.due_at === todayISO) return "today";
  return "upcoming";
}

/**
 * Given a completed recurring task's due date and its recurrence rule,
 * compute the next occurrence's due date. Returns null for one-time tasks.
 */
export function computeNextDueDate(dueAtISO, recurrence) {
  if (!recurrence || !dueAtISO) return null;

  const date = new Date(dueAtISO);
  switch (recurrence) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      return null;
  }
  return date.toISOString().slice(0, 10);
}
