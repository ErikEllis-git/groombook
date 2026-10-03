"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { business, siteUrl } from "@/config";
import { createAppointmentRequest } from "@/db/queries";
import {
  BOOKING_FIELDS,
  HONEYPOT_FIELD,
  bookingRequestSchema,
  todayInTimeZone,
  type BookingField,
} from "@/lib/booking";
import { buildNewRequestAlert, notifyOwner } from "@/lib/notify";

export type BookingFormState =
  | {
      errors?: Partial<Record<BookingField, string[]>>;
      message?: string;
      values: Partial<Record<BookingField, string>>;
    }
  | undefined;

export async function submitBookingRequest(
  _prev: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  if (formData.get(HONEYPOT_FIELD)) redirect("/thanks");

  const values: Partial<Record<BookingField, string>> = {};
  for (const field of BOOKING_FIELDS) {
    const v = formData.get(field);
    if (typeof v === "string") values[field] = v;
  }

  const schema = bookingRequestSchema(todayInTimeZone(business.timeZone));
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  let request;
  try {
    request = await createAppointmentRequest(parsed.data);
  } catch (err) {
    console.error("[booking] failed to save request:", err);
    return {
      message:
        "Sorry, we couldn't send your request. Please try again in a moment.",
      values,
    };
  }

  // Alert Kevin after the response is sent so the customer isn't kept waiting.
  after(() =>
    notifyOwner(buildNewRequestAlert(request, `${siteUrl()}/dashboard`)),
  );

  redirect(`/thanks?dog=${encodeURIComponent(request.dogName)}`);
}
