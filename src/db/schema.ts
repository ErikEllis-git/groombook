import {
  date,
  index,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  dogSizeValues,
  serviceValues,
  statusValues,
  timeWindowValues,
} from "@/lib/booking";

export const statusEnum = pgEnum("request_status", statusValues);
export const serviceEnum = pgEnum("service", serviceValues);
export const dogSizeEnum = pgEnum("dog_size", dogSizeValues);
export const timeWindowEnum = pgEnum("time_window", timeWindowValues);

export const appointmentRequests = pgTable(
  "appointment_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: statusEnum("status").notNull().default("new"),

    customerName: text("customer_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    address: text("address").notNull(),

    dogName: text("dog_name").notNull(),
    breed: text("breed"),
    dogSize: dogSizeEnum("dog_size").notNull(),

    service: serviceEnum("service").notNull(),
    preferredDate: date("preferred_date").notNull(),
    timeWindow: timeWindowEnum("time_window").notNull(),
    customerNotes: text("customer_notes"),

    // Abuse protection. submissionId makes a retried form submit idempotent;
    // clientIpHash (an HMAC, never the raw IP) powers the per-visitor rate limit.
    submissionId: uuid("submission_id").unique(),
    clientIpHash: text("client_ip_hash"),

    // Filled in by Kevin from the dashboard.
    confirmedDate: date("confirmed_date"),
    confirmedTime: time("confirmed_time"),
    // When Kevin marked that he texted the customer their confirmation.
    confirmationSentAt: timestamp("confirmation_sent_at", { withTimezone: true }),
    internalNotes: text("internal_notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("appointment_requests_status_created_idx").on(t.status, t.createdAt),
    index("appointment_requests_ip_created_idx").on(t.clientIpHash, t.createdAt),
  ],
);

export type AppointmentRequest = typeof appointmentRequests.$inferSelect;
export type NewAppointmentRequest = typeof appointmentRequests.$inferInsert;
