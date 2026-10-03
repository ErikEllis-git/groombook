"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { business, siteUrl } from "@/config";
import {
  countRecentRequestsFrom,
  createAppointmentRequest,
} from "@/db/queries";
import {
  BOOKING_FIELDS,
  HONEYPOT_FIELD,
  SUBMISSION_ID_FIELD,
  bookingRequestSchema,
  todayInTimeZone,
  type BookingField,
} from "@/lib/booking";
import { clientIpHash } from "@/lib/client-ip";
import { buildNewRequestAlert, notifyOwner } from "@/lib/notify";

export type BookingFormState =
  | {
      errors?: Partial<Record<BookingField, string[]>>;
      message?: string;
      values: Partial<Record<BookingField, string>>;
    }
  | undefined;

const RATE_LIMIT_PER_HOUR = Number(process.env.BOOKING_RATE_LIMIT_PER_HOUR ?? 5);

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

  const submissionId = z.uuid().safeParse(formData.get(SUBMISSION_ID_FIELD));
  if (!submissionId.success) {
    return {
      message: "Something went wrong. Please refresh the page and try again.",
      values,
    };
  }

  const schema = bookingRequestSchema(todayInTimeZone(business.timeZone));
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors, values };
  }

  let result;
  try {
    const ipHash = await clientIpHash();
    if (ipHash) {
      const since = new Date(Date.now() - 60 * 60 * 1000);
      if ((await countRecentRequestsFrom(ipHash, since)) >= RATE_LIMIT_PER_HOUR) {
        return {
          message: `You've sent several requests in the last hour. Please try again later, or text ${business.ownerName} directly.`,
          values,
        };
      }
    }
    result = await createAppointmentRequest(parsed.data, {
      submissionId: submissionId.data,
      clientIpHash: ipHash,
    });
  } catch (err) {
    console.error("[booking] failed to save request:", err);
    return {
      message:
        "Sorry, we couldn't send your request. Please try again in a moment.",
      values,
    };
  }

  const { request, created } = result;
  // Alert Kevin after the response is sent so the customer isn't kept waiting.
  // A retried duplicate submission doesn't alert him twice.
  if (created) {
    after(() =>
      notifyOwner(buildNewRequestAlert(request, `${siteUrl()}/dashboard`)),
    );
  }

  redirect(`/thanks?dog=${encodeURIComponent(request.dogName)}`);
}
