import { SubmitButton } from "@/components/submit-button";
import { business } from "@/config";
import type { AppointmentRequest } from "@/db/schema";
import { SERVICES, TIME_WINDOWS, dogSizeText, formatPhone } from "@/lib/booking";
import {
  formatDate,
  formatTime,
  formatTimestamp,
  mapsLink,
  smsLink,
} from "@/lib/format";
import { changeStatusAction, saveNotesAction } from "./actions";
import { ConfirmForm } from "./confirm-form";

const button =
  "rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600";
const primary = `${button} bg-teal-700 text-white hover:bg-teal-800`;
const secondary = `${button} bg-white text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50`;
const danger = `${button} bg-white text-red-700 ring-1 ring-red-200 hover:bg-red-50`;

/** `today` is the business-local date, used to default and bound the confirm form. */
export function RequestCard({ req, today }: { req: AppointmentRequest; today: string }) {
  const service = SERVICES[req.service].label;
  const firstName = req.customerName.split(" ")[0];
  // Only a live booking has a slot to show or text about; a cancelled one may
  // still carry its old slot, which must not read as "confirmed".
  const hasBooking = req.status === "confirmed" || req.status === "completed";
  const confirmedText =
    hasBooking && req.confirmedDate && req.confirmedTime
      ? `${formatDate(req.confirmedDate)} at ${formatTime(req.confirmedTime)}`
      : null;

  const textMessage =
    req.status === "confirmed" && confirmedText
    ? `Hi ${firstName}, it's ${business.ownerName} from ${business.name}. You're confirmed: ${service} for ${req.dogName} on ${confirmedText}. See you then!`
    : `Hi ${firstName}, it's ${business.ownerName} from ${business.name} about your grooming request for ${req.dogName}.`;

  return (
    <article className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-stone-200 sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">
            {req.dogName}
            <span className="font-normal text-stone-500">
              {req.breed ? ` · ${req.breed}` : ""}
            </span>
          </h3>
          <p className="text-sm text-stone-600">
            {service} · {dogSizeText(req.dogSize)}
          </p>
        </div>
        <p className="text-xs text-stone-500">
          Received {formatTimestamp(req.createdAt, business.timeZone)}
        </p>
      </header>

      <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <Detail label={confirmedText ? "Booked for" : "Requested"}>
          {confirmedText ? (
            <span className="font-semibold text-teal-800">{confirmedText}</span>
          ) : (
            <>
              {formatDate(req.preferredDate)}, {TIME_WINDOWS[req.timeWindow]}
            </>
          )}
        </Detail>
        <Detail label="Customer">
          {req.customerName}
          <br />
          <a href={`tel:${req.phone}`} className="text-teal-800 underline-offset-2 hover:underline">
            {formatPhone(req.phone)}
          </a>
          {req.email && (
            <>
              <br />
              <a href={`mailto:${req.email}`} className="text-teal-800 underline-offset-2 hover:underline">
                {req.email}
              </a>
            </>
          )}
        </Detail>
        <Detail label="Address">
          <a
            href={mapsLink(req.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-800 underline-offset-2 hover:underline"
          >
            {req.address}
          </a>
        </Detail>
        {req.customerNotes && (
          <Detail label="Customer note">
            <span className="whitespace-pre-line">{req.customerNotes}</span>
          </Detail>
        )}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <a href={smsLink(req.phone, textMessage)} className={secondary}>
          {req.status === "confirmed" ? "Text confirmation" : "Text customer"}
        </a>
        <a href={`tel:${req.phone}`} className={secondary}>
          Call
        </a>
      </div>

      <Actions req={req} today={today} />

      <details className="mt-4 border-t border-stone-100 pt-3">
        <summary className="cursor-pointer text-sm font-medium text-stone-700">
          Private notes{req.internalNotes ? " ✎" : ""}
        </summary>
        <form action={saveNotesAction.bind(null, req.id)} className="mt-2 space-y-2">
          <label htmlFor={`notes-${req.id}`} className="sr-only">
            Private notes
          </label>
          <textarea
            id={`notes-${req.id}`}
            name="internalNotes"
            rows={2}
            maxLength={2000}
            defaultValue={req.internalNotes ?? ""}
            placeholder="Never shown to customers (e.g. quoted $85, bring de-matting comb)"
            className="block w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
          />
          <SubmitButton className={secondary} pendingText="Saving…">
            Save notes
          </SubmitButton>
        </form>
      </details>
    </article>
  );
}

function Actions({ req, today }: { req: AppointmentRequest; today: string }) {
  switch (req.status) {
    case "new":
      return (
        <div className="mt-4 border-t border-stone-100 pt-4">
          <ConfirmForm
            requestId={req.id}
            // A request reviewed late defaults to today rather than a past date.
            defaultDate={req.preferredDate < today ? today : req.preferredDate}
            defaultTime={defaultTimeFor(req.timeWindow)}
            minDate={today}
            buttonClassName={primary}
          />
          <form action={changeStatusAction.bind(null, req.id, "new", "declined")} className="mt-2">
            <SubmitButton className={danger} pendingText="Declining…">
              Decline
            </SubmitButton>
          </form>
        </div>
      );
    case "confirmed":
      return (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
          <form action={changeStatusAction.bind(null, req.id, "confirmed", "completed")}>
            <SubmitButton className={primary} pendingText="Saving…">
              Mark completed
            </SubmitButton>
          </form>
          <form action={changeStatusAction.bind(null, req.id, "confirmed", "declined")}>
            <SubmitButton className={danger} pendingText="Cancelling…">
              Cancel booking
            </SubmitButton>
          </form>
        </div>
      );
    case "declined":
      return (
        <div className="mt-4 border-t border-stone-100 pt-4">
          <form action={changeStatusAction.bind(null, req.id, "declined", "new")}>
            <SubmitButton className={secondary} pendingText="Restoring…">
              Move back to New
            </SubmitButton>
          </form>
        </div>
      );
    case "completed":
      return null;
  }
}

function defaultTimeFor(window: AppointmentRequest["timeWindow"]): string {
  return { morning: "09:00", afternoon: "13:00", evening: "16:30" }[window];
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</dt>
      <dd className="mt-0.5 text-stone-900">{children}</dd>
    </div>
  );
}
