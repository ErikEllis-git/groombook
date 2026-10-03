// Inserts a handful of realistic demo requests so the dashboard isn't empty
// for a walkthrough. Only inserts; it never deletes existing data.
// Usage: npm run db:seed

import { config } from "dotenv";
import postgres from "postgres";

config({ path: [".env.local", ".env"], quiet: true });

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set.");

const sql = postgres(url, { prepare: false, max: 1 });

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 3_600_000);
}

const demo = [
  {
    status: "new",
    customer_name: "Maria Lopez",
    phone: "4345550198",
    email: "maria.lopez@example.com",
    address: "1820 Rivermont Ave, Lynchburg, VA",
    dog_name: "Pepper",
    breed: "Miniature Schnauzer",
    dog_size: "small",
    service: "full_groom",
    preferred_date: daysFromNow(2),
    time_window: "morning",
    customer_notes: "She gets nervous with the dryer, so low and slow please!",
    created_at: hoursAgo(5),
  },
  {
    status: "new",
    customer_name: "James Carter",
    phone: "4345550117",
    email: null,
    address: "45 Boonsboro Rd, Lynchburg, VA",
    dog_name: "Tank",
    breed: "Bernese Mountain Dog",
    dog_size: "xlarge",
    service: "deshed",
    preferred_date: daysFromNow(4),
    time_window: "afternoon",
    customer_notes: "Gate code is 2580. Park in the driveway.",
    created_at: hoursAgo(2),
  },
  {
    status: "new",
    customer_name: "Priya Patel",
    phone: "4345550163",
    email: "priya@example.com",
    address: "310 Langhorne Rd, Lynchburg, VA",
    dog_name: "Mochi",
    breed: "Shih Tzu",
    dog_size: "small",
    service: "nail_trim",
    preferred_date: daysFromNow(1),
    time_window: "evening",
    customer_notes: null,
    created_at: hoursAgo(0.5),
  },
  {
    status: "confirmed",
    customer_name: "Tom Becker",
    phone: "4345550134",
    email: null,
    address: "88 Link Rd, Lynchburg, VA",
    dog_name: "Rosie",
    breed: "Goldendoodle",
    dog_size: "medium",
    service: "full_groom",
    preferred_date: daysFromNow(1),
    time_window: "morning",
    confirmed_date: daysFromNow(1),
    confirmed_time: "09:30",
    confirmation_sent_at: hoursAgo(28),
    customer_notes: "Teddy bear cut, same as last time.",
    internal_notes: "Quoted $95. Matting behind ears last visit.",
    created_at: hoursAgo(30),
  },
  {
    status: "confirmed",
    customer_name: "Alicia Nguyen",
    phone: "4345550176",
    email: "alicia.n@example.com",
    address: "1203 Old Forest Rd, Lynchburg, VA",
    dog_name: "Duke",
    breed: "German Shepherd",
    dog_size: "large",
    service: "bath_brush",
    preferred_date: daysFromNow(3),
    time_window: "afternoon",
    confirmed_date: daysFromNow(3),
    confirmed_time: "13:00",
    customer_notes: null,
    internal_notes: null,
    created_at: hoursAgo(26),
  },
  {
    status: "completed",
    customer_name: "Sam Rivera",
    phone: "4345550121",
    email: null,
    address: "640 Wards Rd, Lynchburg, VA",
    dog_name: "Lulu",
    breed: "Poodle mix",
    dog_size: "small",
    service: "full_groom",
    preferred_date: daysFromNow(-2),
    time_window: "morning",
    confirmed_date: daysFromNow(-2),
    confirmed_time: "10:00",
    customer_notes: null,
    internal_notes: "Paid cash. Rebook in 6 weeks.",
    created_at: hoursAgo(96),
  },
];

const columns = [
  "status",
  "customer_name",
  "phone",
  "email",
  "address",
  "dog_name",
  "breed",
  "dog_size",
  "service",
  "preferred_date",
  "time_window",
  "confirmed_date",
  "confirmed_time",
  "confirmation_sent_at",
  "customer_notes",
  "internal_notes",
  "created_at",
] as const;

const rows = demo.map((d) =>
  Object.fromEntries(
    columns.map((c) => [c, (d as Record<string, unknown>)[c] ?? null]),
  ),
);

await sql`insert into appointment_requests ${sql(rows, ...columns)}`;
console.log(`Inserted ${rows.length} demo requests.`);
await sql.end();
