// Display helpers for the dashboard.

export { formatDate } from "./notify";

/** "14:30:00" or "14:30" → "2:30 PM" */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Timestamp in the business time zone, e.g. "Oct 3, 2:15 PM". */
export function formatTimestamp(d: Date, timeZone: string): string {
  return d.toLocaleString("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Builds an sms: link with a prefilled message (works on iOS and Android). */
export function smsLink(phone: string, body: string): string {
  return `sms:${phone}?&body=${encodeURIComponent(body)}`;
}

export function mapsLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
