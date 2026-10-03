"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { business } from "@/config";
import {
  confirmRequest,
  markConfirmationSent,
  transitionRequest,
  updateInternalNotes,
} from "@/db/queries";
import { requireOwner } from "@/lib/auth";
import {
  nowTimeInTimeZone,
  todayInTimeZone,
  type Status,
} from "@/lib/booking";

const idSchema = z.uuid();

const confirmSchema = z.object({
  confirmedDate: z.iso.date({ error: "Pick a date." }),
  confirmedTime: z.iso.time({ precision: -1, error: "Pick a time." }), // HH:MM
});

// The only status changes the dashboard offers.
const ALLOWED_TRANSITIONS: Record<Status, Status[]> = {
  new: ["declined"],
  confirmed: ["completed", "declined"],
  declined: ["new"],
  completed: [],
};

export type ConfirmState = { error?: string } | undefined;

export async function confirmAction(
  id: string,
  _prev: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  await requireOwner();
  if (!idSchema.safeParse(id).success) return { error: "Unknown request." };

  const parsed = confirmSchema.safeParse({
    confirmedDate: formData.get("confirmedDate"),
    confirmedTime: formData.get("confirmedTime"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the date and time." };
  }

  const { confirmedDate, confirmedTime } = parsed.data;
  const today = todayInTimeZone(business.timeZone);
  if (
    confirmedDate < today ||
    (confirmedDate === today && confirmedTime <= nowTimeInTimeZone(business.timeZone))
  ) {
    return { error: "That time has already passed. Pick a future time." };
  }

  if (!(await confirmRequest(id, confirmedDate, confirmedTime))) {
    // Leave the page as-is so Kevin sees why; auto-refresh will catch it up.
    return {
      error: "This request was already updated elsewhere. Refresh to see its current status.",
    };
  }
  revalidatePath("/dashboard");
  return {};
}

export async function changeStatusAction(
  id: string,
  from: Status,
  to: Status,
) {
  await requireOwner();
  if (!idSchema.safeParse(id).success) return;
  if (!ALLOWED_TRANSITIONS[from]?.includes(to)) return;

  await transitionRequest(id, from, to);
  revalidatePath("/dashboard");
}

export async function markTextSentAction(id: string) {
  await requireOwner();
  if (!idSchema.safeParse(id).success) return;
  await markConfirmationSent(id);
  revalidatePath("/dashboard");
}

export async function saveNotesAction(id: string, formData: FormData) {
  await requireOwner();
  if (!idSchema.safeParse(id).success) return;
  const notes = z
    .string()
    .trim()
    .max(2000)
    .safeParse(formData.get("internalNotes") ?? "");
  if (!notes.success) return;

  await updateInternalNotes(id, notes.data || null);
  revalidatePath("/dashboard");
}
