import "server-only";

import { and, asc, count, desc, eq } from "drizzle-orm";
import type { BookingRequestInput, Status } from "@/lib/booking";
import { db } from "./index";
import { appointmentRequests, type AppointmentRequest } from "./schema";

export async function createAppointmentRequest(
  input: BookingRequestInput,
): Promise<AppointmentRequest> {
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
    })
    .returning();
  return row;
}

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
    .limit(200);
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

export async function confirmRequest(
  id: string,
  confirmedDate: string,
  confirmedTime: string,
): Promise<AppointmentRequest | undefined> {
  const [row] = await db
    .update(appointmentRequests)
    .set({ status: "confirmed", confirmedDate, confirmedTime })
    .where(eq(appointmentRequests.id, id))
    .returning();
  return row;
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
    .set({ status: to })
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
