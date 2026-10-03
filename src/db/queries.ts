import "server-only";

import { and, asc, count, desc, eq, gte } from "drizzle-orm";
import type { BookingRequestInput, Status } from "@/lib/booking";
import { db } from "./index";
import { appointmentRequests, type AppointmentRequest } from "./schema";

/**
 * Saves a booking request. Idempotent on `submissionId`: if the same form
 * submission arrives twice (e.g. a retry after a dropped mobile connection),
 * the original row is returned with `created: false` and nothing is inserted.
 */
export async function createAppointmentRequest(
  input: BookingRequestInput,
  meta: { submissionId: string; clientIpHash: string | null },
): Promise<{ request: AppointmentRequest; created: boolean }> {
  const [row] = await db
    .insert(appointmentRequests)
    .values({
      customerName: input.customerName,
      phone: input.phone,
      email: input.email ?? null,
      address: input.address,
      dogName: input.dogName,
      breed: input.breed ?? null,
      dogSize: input.dogSize,
      service: input.service,
      preferredDate: input.preferredDate,
      timeWindow: input.timeWindow,
      customerNotes: input.notes ?? null,
      submissionId: meta.submissionId,
      clientIpHash: meta.clientIpHash,
    })
    .onConflictDoNothing({ target: appointmentRequests.submissionId })
    .returning();
  if (row) return { request: row, created: true };

  const [existing] = await db
    .select()
    .from(appointmentRequests)
    .where(eq(appointmentRequests.submissionId, meta.submissionId));
  return { request: existing, created: false };
}

/** How many requests this visitor has sent since `since` (for rate limiting). */
export async function countRecentRequestsFrom(
  clientIpHash: string,
  since: Date,
): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(appointmentRequests)
    .where(
      and(
        eq(appointmentRequests.clientIpHash, clientIpHash),
        gte(appointmentRequests.createdAt, since),
      ),
    );
  return row?.n ?? 0;
}

/** Max requests shown per dashboard tab; the page says when there are more. */
export const LIST_LIMIT = 200;

export async function listRequestsByStatus(
  status: Status,
): Promise<AppointmentRequest[]> {
  const t = appointmentRequests;
  // Each tab gets the ordering that matches how Kevin works it:
  // new requests oldest-first (first come, first served), upcoming jobs by
  // appointment time, and history newest-first.
  const orderBy =
    status === "new"
      ? [asc(t.createdAt)]
      : status === "confirmed"
        ? [asc(t.confirmedDate), asc(t.confirmedTime)]
        : [desc(t.updatedAt)];

  return db
    .select()
    .from(t)
    .where(eq(t.status, status))
    .orderBy(...orderBy)
    .limit(LIST_LIMIT);
}

export async function countRequestsByStatus(): Promise<Record<Status, number>> {
  const rows = await db
    .select({ status: appointmentRequests.status, n: count() })
    .from(appointmentRequests)
    .groupBy(appointmentRequests.status);

  const counts: Record<Status, number> = {
    new: 0,
    confirmed: 0,
    completed: 0,
    declined: 0,
  };
  for (const row of rows) counts[row.status] = row.n;
  return counts;
}

/**
 * Confirms a request for an exact date and time. Only applies while the request
 * is still New, so a stale dashboard tab can't pull a declined or completed job
 * back into Upcoming. Returns false if the request had already changed.
 */
export async function confirmRequest(
  id: string,
  confirmedDate: string,
  confirmedTime: string,
): Promise<boolean> {
  const rows = await db
    .update(appointmentRequests)
    .set({ status: "confirmed", confirmedDate, confirmedTime })
    .where(
      and(eq(appointmentRequests.id, id), eq(appointmentRequests.status, "new")),
    )
    .returning({ id: appointmentRequests.id });
  return rows.length > 0;
}

/**
 * Moves a request to a new status, but only from an allowed previous status,
 * so a stale dashboard tab can't, say, re-decline a completed job.
 */
export async function transitionRequest(
  id: string,
  from: Status,
  to: Status,
): Promise<boolean> {
  const rows = await db
    .update(appointmentRequests)
    // Back to New means the old appointment slot no longer applies.
    .set(
      to === "new"
        ? { status: to, confirmedDate: null, confirmedTime: null }
        : { status: to },
    )
    .where(
      and(eq(appointmentRequests.id, id), eq(appointmentRequests.status, from)),
    )
    .returning({ id: appointmentRequests.id });
  return rows.length > 0;
}

export async function updateInternalNotes(
  id: string,
  internalNotes: string | null,
): Promise<void> {
  await db
    .update(appointmentRequests)
    .set({ internalNotes })
    .where(eq(appointmentRequests.id, id));
}
