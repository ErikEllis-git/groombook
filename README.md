# GroomBook

A booking-request MVP for **Kevin's Mobile Dog Grooming**.

Kevin's problem: clients text him to book and requests get lost in his messages.
GroomBook gives him three things:

1. **A booking page** customers fill in, with everything Kevin needs: dog, size,
   service, address, preferred day and time window, and notes.
2. **One dashboard** with every request, sorted into *New → Upcoming → Completed / Declined*.
3. **An instant phone alert** for each new request, via free [ntfy](https://ntfy.sh)
   push notifications, with an optional email copy.

Kevin still texts customers the way he does today, but each text starts from a
structured request, and the dashboard prefills the confirmation message for him.

## Features

**Customer booking page (`/`)**
- Mobile-first form with clear, field-level validation; input is kept when something needs fixing
- Validated on the server (Zod); past dates are rejected in the business's time zone
- Honeypot field filters out bot spam without a CAPTCHA

**Owner dashboard (`/dashboard`)**
- Password-protected, signed httpOnly session cookie, 30-day login
- Tabs with live counts: New requests (oldest first), Upcoming (grouped by day), Completed, Declined
- One-tap **Call**, **Text** (message prefilled) and **Maps** links on every request
- Confirm with an exact date and time, decline, mark completed, or move a declined request back to New
- Private notes per request (pricing, behavior, gate codes)
- Refreshes itself every 30 seconds and when the tab regains focus

**Notifications**
- Push notification to Kevin's phone within seconds of a request; tapping it opens the dashboard
- Sent after the response (`after()`), so customers never wait on it, and a failed alert never loses a request

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router, Server Actions), React 19, TypeScript | One codebase for the public page, dashboard and server logic |
| Styling | Tailwind CSS 4 | Fast, consistent, mobile-first UI |
| Database | Postgres (Neon in production) + Drizzle ORM | Relational data, typed queries, versioned SQL migrations |
| Validation | Zod | One schema validates input and produces typed data |
| Auth | `jose` JWT in an httpOnly cookie | Follows the Next.js auth guide; right-sized for a single owner account |
| Alerts | ntfy.sh (push), Resend (optional email) | Free, with no account needed for push |
| Hosting | Vercel | Git-based deploys, preview URLs, free tier |
| Tests | Vitest (unit), Playwright (end-to-end, mobile viewport) | |

## Project structure

```
src/
  app/
    page.tsx, booking-form.tsx, actions.ts   Public booking page + Server Action
    thanks/                                  Confirmation page
    login/                                   Owner login (Server Actions)
    dashboard/                               Dashboard page, request cards, actions
  db/        schema.ts (Drizzle), queries.ts (all SQL lives here), index.ts
  lib/       booking.ts (shared options + validation), auth.ts, session.ts,
             notify.ts (alerts), format.ts
  proxy.ts   Optimistic redirect for signed-out visitors
drizzle/     Generated SQL migrations
e2e/         Playwright end-to-end tests
scripts/     seed.ts (demo data)
```

## Running locally

Requires Node 20.9+ and Docker.

```bash
npm install
cp .env.example .env.local        # then fill in SESSION_SECRET and DASHBOARD_PASSWORD
docker run -d --name groombook-db -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=groombook -p 5433:5432 postgres:17-alpine
npm run db:migrate
npm run db:seed                   # optional demo data
npm run dev                       # http://localhost:3000
```

To get alerts, install the **ntfy** phone app ([setup guide](https://docs.ntfy.sh/subscribe/phone/)) and subscribe to
the topic in `NTFY_TOPIC`. Use a long random name, since anyone who knows a topic can read it.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | Unit tests (validation, sessions, notifications) |
| `npm run test:e2e` | End-to-end: request → confirm → complete on a mobile viewport |
| `npm run lint` / `typecheck` | ESLint, TypeScript |
| `npm run db:generate` | Create a migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Insert demo requests |

## Deploying (Vercel + Neon)

1. Import the GitHub repo in Vercel.
2. **Storage → Create → Neon Postgres** and connect it to the project. This sets `DATABASE_URL`
   and `DATABASE_URL_UNPOOLED`.
3. Add `SESSION_SECRET`, `DASHBOARD_PASSWORD` and `NTFY_TOPIC` (plus the optional ones in
   `.env.example`).
4. Deploy. Vercel runs `npm run vercel-build`, which applies migrations and then builds.

## Decisions and trade-offs

- **Requests, not instant booking.** A mobile groomer's day depends on drive time, coat
  condition and dog temperament. Kevin keeps the final say, and customers still get a
  clear, fast process.
- **Push over SMS for alerts.** SMS APIs cost money and need carrier registration; ntfy
  push is free and instant. The email channel is a fallback.
- **A single shared password** instead of user accounts: Kevin is the only user. The
  session check runs in the page and in every Server Action, not only in `proxy.ts`.
- **Hosting cost:** Vercel's Hobby tier is for non-commercial use. For Kevin's real business
  it would move to Vercel Pro (~$20/mo) or a free commercial-friendly host such as
  Cloudflare. The code doesn't change.

## What I'd build next

1. Automatic confirmation texts and reminders (Twilio) once Kevin wants to pay for SMS
2. Customer and pet history (repeat clients, last cut, notes carried forward)
3. Calendar view and a block-out schedule, so customers only pick days Kevin works
4. Rate limiting on the public form (e.g. Upstash) if spam ever gets past the honeypot
