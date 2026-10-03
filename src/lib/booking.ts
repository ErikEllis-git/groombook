import { z } from "zod";

// Shared booking vocabulary. Used by the database schema, the public form,
// server-side validation, and the dashboard, so labels never drift apart.

export const SERVICES = {
  full_groom: {
    label: "Full groom",
    description: "Bath, haircut, nails, ears and a tidy finish.",
  },
  bath_brush: {
    label: "Bath & brush",
    description: "Bath, blow-dry, brush-out, nails and ears.",
  },
  deshed: {
    label: "De-shedding treatment",
    description: "Bath plus a deep de-shed for double coats.",
  },
  nail_trim: {
    label: "Nail trim only",
    description: "Quick nail trim and file.",
  },
} as const;

export const DOG_SIZES = {
  small: { label: "Small", weight: "under 20 lb" },
  medium: { label: "Medium", weight: "20–50 lb" },
  large: { label: "Large", weight: "50–90 lb" },
  xlarge: { label: "Extra large", weight: "90 lb+" },
} as const;

export function dogSizeText(size: keyof typeof DOG_SIZES): string {
  const { label, weight } = DOG_SIZES[size];
  return `${label} (${weight})`;
}

export const TIME_WINDOWS = {
  morning: "Morning (8am–12pm)",
  afternoon: "Afternoon (12pm–4pm)",
  evening: "Evening (4pm–7pm)",
} as const;

export const STATUSES = {
  new: "New",
  confirmed: "Confirmed",
  completed: "Completed",
  declined: "Declined",
} as const;

export type Service = keyof typeof SERVICES;
export type DogSize = keyof typeof DOG_SIZES;
export type TimeWindow = keyof typeof TIME_WINDOWS;
export type Status = keyof typeof STATUSES;

const keysOf = <T extends object>(obj: T) =>
  Object.keys(obj) as [keyof T & string, ...(keyof T & string)[]];

export const serviceValues = keysOf(SERVICES);
export const dogSizeValues = keysOf(DOG_SIZES);
export const timeWindowValues = keysOf(TIME_WINDOWS);
export const statusValues = keysOf(STATUSES);

/** Today's date (YYYY-MM-DD) in the business's time zone. */
export function todayInTimeZone(timeZone: string, now = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Keep only digits; US numbers get a leading 1 stripped for consistency. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1")
    ? digits.slice(1)
    : digits;
}

export function formatPhone(digits: string): string {
  return digits.length === 10
    ? `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    : digits;
}

const requiredText = (label: string, max: number) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, { error: `${label} is required.` })
    .max(max, { error: `${label} must be ${max} characters or fewer.` });

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Must be ${max} characters or fewer.` })
    .optional()
    .transform((v) => (v ? v : undefined));

/**
 * Validates a booking request from the public form.
 * `today` is injected so the "no past dates" rule is testable and
 * evaluated in the business's time zone rather than the server's.
 */
export function bookingRequestSchema(today: string) {
  return z.object({
    customerName: requiredText("Your name", 100),
    phone: z
      .string({ error: "Mobile number is required." })
      .trim()
      .min(1, { error: "Mobile number is required." })
      .transform(normalizePhone)
      .refine((v) => v.length >= 10 && v.length <= 15, {
        error: "Enter a valid phone number.",
      }),
    email: z
      .union([z.literal(""), z.email({ error: "Enter a valid email." })])
      .optional()
      .transform((v) => (v ? v.toLowerCase() : undefined)),
    address: requiredText("Address", 200),
    dogName: requiredText("Dog's name", 60),
    breed: optionalText(60),
    dogSize: z.enum(dogSizeValues, { error: "Choose your dog's size." }),
    service: z.enum(serviceValues, { error: "Choose a service." }),
    preferredDate: z
      .iso.date({ error: "Choose a date." })
      .refine((d) => d >= today, { error: "Choose today or a future date." }),
    timeWindow: z.enum(timeWindowValues, { error: "Choose a time window." }),
    notes: optionalText(1000),
  });
}

export type BookingRequestInput = z.infer<
  ReturnType<typeof bookingRequestSchema>
>;

export const BOOKING_FIELDS = [
  "customerName",
  "phone",
  "email",
  "address",
  "dogName",
  "breed",
  "dogSize",
  "service",
  "preferredDate",
  "timeWindow",
  "notes",
] as const;

export type BookingField = (typeof BOOKING_FIELDS)[number];

/** Hidden form field that real visitors never fill in; bots usually do. */
export const HONEYPOT_FIELD = "website";
