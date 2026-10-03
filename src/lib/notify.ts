import { SERVICES, TIME_WINDOWS, dogSizeText } from "./booking";
import type { AppointmentRequest } from "@/db/schema";

// New-request alerts for Kevin.
//  - ntfy.sh: free phone push notifications, no account required.
//  - Resend: optional email copy, enabled only when RESEND_API_KEY is set.
// Delivery is best effort: failures are logged and never surface to the
// customer. The request is already stored and visible on the dashboard, and
// the dashboard refreshes itself, so a missed alert delays Kevin but loses nothing.

export type Alert = {
  title: string;
  body: string;
  clickUrl: string;
};

export function formatDate(isoDate: string): string {
  // Parse as a calendar date (noon UTC) so no time zone can shift the day.
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Builds the alert text. Deliberately minimal: push topics and inboxes are less
 * protected than the dashboard, so the alert carries no phone number, address
 * or notes (which can include gate codes). Kevin taps through for the details.
 */
export function buildNewRequestAlert(
  req: Pick<
    AppointmentRequest,
    | "customerName"
    | "dogName"
    | "breed"
    | "dogSize"
    | "service"
    | "preferredDate"
    | "timeWindow"
  >,
  dashboardUrl: string,
): Alert {
  const dog = req.breed ? `${req.dogName} (${req.breed})` : req.dogName;
  const firstName = req.customerName.split(" ")[0];
  const lines = [
    `${SERVICES[req.service].label} for ${dog}, ${dogSizeText(req.dogSize).toLowerCase()}`,
    `${formatDate(req.preferredDate)}, ${TIME_WINDOWS[req.timeWindow].toLowerCase()}`,
    `From ${firstName}. Open the dashboard for contact details.`,
  ];

  return {
    title: `New booking request: ${req.dogName}`,
    body: lines.join("\n"),
    clickUrl: dashboardUrl,
  };
}

async function sendPush(alert: Alert): Promise<void> {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;
  const server = process.env.NTFY_SERVER ?? "https://ntfy.sh";

  const res = await fetch(server, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic,
      title: alert.title,
      message: alert.body,
      click: alert.clickUrl,
      tags: ["dog"],
      priority: 4,
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`ntfy responded ${res.status}`);
}

async function sendEmail(alert: Alert): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFY_EMAIL;
  if (!apiKey || !to) return;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.NOTIFY_EMAIL_FROM ?? "GroomBook <onboarding@resend.dev>",
      to: [to],
      subject: alert.title,
      text: `${alert.body}\n\nOpen the dashboard: ${alert.clickUrl}`,
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}`);
}

export async function notifyOwner(alert: Alert): Promise<void> {
  const results = await Promise.allSettled([sendPush(alert), sendEmail(alert)]);
  for (const r of results) {
    if (r.status === "rejected") {
      console.error("[notify] alert failed:", r.reason);
    }
  }
}
