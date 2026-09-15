// Farm-local date utilities.
// The Farm OS records calendar dates for the farm, so avoid UTC-based
// Date#toISOString() for "today" because it can be a day behind in Bangladesh.

export function todayFarmDate() {
  const now = new Date();

  const year = now.toLocaleString("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
  });
  const month = now.toLocaleString("en-CA", {
    timeZone: "Asia/Dhaka",
    month: "2-digit",
  });
  const day = now.toLocaleString("en-CA", {
    timeZone: "Asia/Dhaka",
    day: "2-digit",
  });

  return `${year}-${month}-${day}`;
}
