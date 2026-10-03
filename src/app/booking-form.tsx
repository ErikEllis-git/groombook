"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitBookingRequest, type BookingFormState } from "./actions";
import {
  BOOKING_FIELDS,
  DOG_SIZES,
  HONEYPOT_FIELD,
  SERVICES,
  TIME_WINDOWS,
  type BookingField,
} from "@/lib/booking";

const inputClass =
  "mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900 shadow-sm placeholder:text-stone-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30 aria-[invalid=true]:border-red-500";

export function BookingForm({ minDate }: { minDate: string }) {
  const [state, formAction, pending] = useActionState<
    BookingFormState,
    FormData
  >(submitBookingRequest, undefined);

  const value = (f: BookingField) => state?.values[f] ?? "";
  const error = (f: BookingField) => state?.errors?.[f]?.[0];

  // After a failed submit, take the customer straight to the first problem.
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state?.errors) return;
    const firstField = BOOKING_FIELDS.find((f) => state.errors?.[f]);
    if (firstField) {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstField}"]`)
        ?.focus();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-8">
      {state?.message && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {state.message}
        </p>
      )}

      <Section title="Your dog">
        <Field label="Dog's name" name="dogName" error={error("dogName")}>
          <input
            id="dogName"
            name="dogName"
            defaultValue={value("dogName")}
            required
            maxLength={60}
            className={inputClass}
            aria-invalid={!!error("dogName")}
            aria-describedby="dogName-error"
          />
        </Field>
        <Field
          label="Breed"
          optional
          name="breed"
          error={error("breed")}
        >
          <input
            id="breed"
            name="breed"
            defaultValue={value("breed")}
            maxLength={60}
            placeholder="e.g. Goldendoodle"
            className={inputClass}
            aria-invalid={!!error("breed")}
            aria-describedby="breed-error"
          />
        </Field>
        <fieldset className="sm:col-span-2" aria-describedby="dogSize-error">
          <legend className="block text-sm font-medium text-stone-800">Size</legend>
          <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(DOG_SIZES).map(([key, size]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-2.5 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:ring-1 has-[:checked]:ring-teal-600"
              >
                <input
                  type="radio"
                  name="dogSize"
                  value={key}
                  defaultChecked={value("dogSize") === key}
                  required
                  aria-label={`${size.label} (${size.weight})`}
                  className="accent-teal-700"
                />
                <span aria-hidden="true">
                  <span className="block text-sm font-medium text-stone-900">
                    {size.label}
                  </span>
                  <span className="block text-xs text-stone-600">{size.weight}</span>
                </span>
              </label>
            ))}
          </div>
          <ErrorText id="dogSize-error" message={error("dogSize")} />
        </fieldset>
      </Section>

      <Section title="Service">
        <fieldset className="sm:col-span-2" aria-describedby="service-error">
          <legend className="sr-only">Service</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(SERVICES).map(([key, s]) => (
              <label
                key={key}
                className="flex cursor-pointer gap-3 rounded-lg border border-stone-300 bg-white p-3 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:ring-1 has-[:checked]:ring-teal-600"
              >
                <input
                  type="radio"
                  name="service"
                  value={key}
                  defaultChecked={value("service") === key}
                  required
                  className="mt-1 accent-teal-700"
                />
                <span>
                  <span className="block font-medium text-stone-900">
                    {s.label}
                  </span>
                  <span className="block text-sm text-stone-600">
                    {s.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <ErrorText id="service-error" message={error("service")} />
        </fieldset>
      </Section>

      <Section title="When works for you?">
        <Field
          label="Preferred date"
          name="preferredDate"
          error={error("preferredDate")}
        >
          <input
            id="preferredDate"
            name="preferredDate"
            type="date"
            min={minDate}
            defaultValue={value("preferredDate")}
            required
            className={inputClass}
            aria-invalid={!!error("preferredDate")}
            aria-describedby="preferredDate-error"
          />
        </Field>
        <Field
          label="Time of day"
          name="timeWindow"
          error={error("timeWindow")}
        >
          <select
            id="timeWindow"
            name="timeWindow"
            defaultValue={value("timeWindow")}
            required
            className={inputClass}
            aria-invalid={!!error("timeWindow")}
            aria-describedby="timeWindow-error"
          >
            <option value="" disabled>
              Choose a time window
            </option>
            {Object.entries(TIME_WINDOWS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="About you">
        <Field label="Your name" name="customerName" error={error("customerName")}>
          <input
            id="customerName"
            name="customerName"
            autoComplete="name"
            defaultValue={value("customerName")}
            required
            maxLength={100}
            className={inputClass}
            aria-invalid={!!error("customerName")}
            aria-describedby="customerName-error"
          />
        </Field>
        <Field label="Mobile number" name="phone" error={error("phone")}>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            defaultValue={value("phone")}
            required
            placeholder="(555) 123-4567"
            className={inputClass}
            aria-invalid={!!error("phone")}
            aria-describedby="phone-error"
          />
        </Field>
        <Field
          label="Email"
          optional
          name="email"
          error={error("email")}
        >
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={value("email")}
            className={inputClass}
            aria-invalid={!!error("email")}
            aria-describedby="email-error"
          />
        </Field>
        <Field
          label="Address for the appointment"
          name="address"
          error={error("address")}
        >
          <input
            id="address"
            name="address"
            autoComplete="street-address"
            defaultValue={value("address")}
            required
            maxLength={200}
            placeholder="Street, city"
            className={inputClass}
            aria-invalid={!!error("address")}
            aria-describedby="address-error"
          />
        </Field>
        <Field
          label="Anything Kevin should know?"
          optional
          name="notes"
          error={error("notes")}
          className="sm:col-span-2"
        >
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={value("notes")}
            maxLength={1000}
            placeholder="Matting, nervous with clippers, gate code, where to park…"
            className={inputClass}
            aria-invalid={!!error("notes")}
            aria-describedby="notes-error"
          />
        </Field>
      </Section>

      {/* Honeypot: hidden from people and screen readers, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="space-y-3">
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-teal-700 px-5 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-teal-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/40 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Sending request…" : "Request appointment"}
        </button>
        <p className="text-center text-sm text-stone-600">
          This is a request, not a booking yet. Kevin will text you to confirm
          an exact time.
        </p>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold text-stone-900">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  optional,
  error,
  className,
  children,
}: {
  label: string;
  name: string;
  optional?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-stone-800">
        {label}
        {optional && <span className="font-normal text-stone-500"> (optional)</span>}
      </label>
      {children}
      <ErrorText id={`${name}-error`} message={error} />
    </div>
  );
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  return (
    <p id={id} className="mt-1 min-h-0 text-sm text-red-700" aria-live="polite">
      {message}
    </p>
  );
}
