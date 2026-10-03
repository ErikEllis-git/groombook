# GroomBook

> **Take-home assessment:** built by Erik Ellis for the **AC Innovations "Client Engagement"
> assessment** (October 2026). Kevin and his business are the fictional client from the
> assessment brief; the brief allowed any AI tools, and [how I used them](#how-i-used-ai) is
> described below.

A booking-request MVP for **Kevin's Mobile Dog Grooming**.

**Live demo:** https://groombook-eta.vercel.app
· Owner dashboard: [/dashboard](https://groombook-eta.vercel.app/dashboard) (password: `kevin-demo`)
· One-page overview: [docs/GroomBook-MVP-Overview.pdf](docs/GroomBook-MVP-Overview.pdf)
· Walkthrough video (1:32): [docs/GroomBook-walkthrough.mp4](docs/GroomBook-walkthrough.mp4)

> The live site is a public demo with sample data. The demo password is shared on purpose so
> reviewers can try the dashboard, and a banner asks visitors to use made-up details.

Kevin's brief: clients text him to book, he loses track, and he wants people to request an
appointment, to see all requests in one place, and to be notified of new ones. GroomBook does
exactly those three things:

1. **A booking page** customers fill in with the core details for reviewing a request: dog,
   size, service, address, preferred day and time window, and notes.
2. **One dashboard** with every request, sorted into *New → Upcoming → Completed / Declined*.
3. **A phone alert** for each new request, via free [ntfy](https://ntfy.sh) push
   notifications, with an optional email copy.

Kevin still texts customers himself, but each text starts from a structured request, the
dashboard writes the confirmation for him, and he ticks off which customers he has texted.

## Client assumptions and rollout

This MVP is built from the assessment brief, not from a discovery interview. I assumed one
owner who works from his phone, US customers, his local time zone, and that he wants to approve
every appointment himself (a mobile groomer's day depends on drive time and each dog).

Before rollout I would confirm with Kevin:

1. Where the chaos actually happens: missed requests, slow replies, or double-booking?
2. What he already uses: calendar, payments, customer list.
3. How his scheduling works: service area, travel buffers, which days he covers which towns.
4. How customers book today, including repeat clients and multi-dog households.
5. What he can sustain: monthly budget, preferred alert channel, support expectations.

Then a two-week pilot: share the link, reply to booking texts with it, and compare unanswered
requests and his admin time before and after. Existing texts aren't imported, so current
bookings get reconciled once at the start.

## Build vs. buy

Off-the-shelf tools already cover parts of this. [Square Appointments](https://squareup.com/help/us/en/article/8444-accept-or-decline-appointments)
(free plan available) can require the business to accept or decline each request, and
[MoeGo](https://www.moego.pet/pricing) ($49/month for solo mobile groomers) adds reminders,
two-way texting and mobile scheduling. For Kevin's real business I would compare those against
his workflow and budget before committing to custom software, counting setup, support and
maintenance, not only subscription prices. GroomBook meets the assessment's working-MVP
requirement and is ready to pilot the focused request-and-review flow.

## Features

**Customer booking page (`/`)**
- Mobile-first form with clear, field-level validation; input is kept when something needs fixing
- Validated on the server (Zod): well-formed 10-digit US numbers only (so Call/Text links are
  usable), and no past dates, judged in the business's time zone
- Spam and accident protection without a CAPTCHA: a honeypot field, a per-visitor limit
  (5 requests/hour, keyed on a salted hash of the IP, never the raw IP), and a per-form
  submission ID so a retried submit on a flaky connection can't create a duplicate request

**Owner dashboard (`/dashboard`)**
- Password-protected, signed httpOnly session cookie, 30-day login
- Tabs with live counts: New requests (oldest first), Upcoming (grouped by day), Completed, Declined
- One-tap **Call**, **Text** (message prefilled) and **Maps** links on every request
- Confirm with an exact date and time, decline, mark completed, or move a declined request back to New
- Safe with several tabs or devices open: every status change only applies from the status Kevin
  was looking at, past times can't be confirmed, and a stale action explains what happened
  instead of silently overwriting
- "Customer not texted yet" on each upcoming booking until Kevin marks the confirmation text as sent
- Private notes per request (pricing, behavior), never shown to customers
- Refreshes itself every 30 seconds and when the tab regains focus

**Notifications**
- Push notification to Kevin's phone, typically within seconds; tapping it opens the dashboard
- Alerts carry only the dog, service, day and the customer's first name. Phone, address and notes
  stay behind the dashboard login, since anyone who learns an ntfy topic name can read it
- Sent after the response (`after()`), so customers never wait on it. Delivery is best effort: a
  failed alert is logged and the request is still saved and on the dashboard

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
| Tests | Vitest (unit), Playwright (end-to-end, mobile viewport) | Run by GitHub Actions on pushes to `main` and on pull requests |

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
scripts/     seed.mts (demo data), render-one-pager.mjs (the PDF overview)
```

## Running locally

Requires Node 24 (see `.nvmrc`, same as CI) and Docker.

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
| `npm run test:e2e` | End-to-end on a mobile viewport: request → confirm → text sent → complete, plus regression tests |
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

## How I used AI

The brief allowed any AI models, so I treated AI as a team I directed and checked rather than a
shortcut. Every decision, finding and line of code went through me before it shipped.

**1. Building: AI pair programming (Claude Code).** I used Claude Code to research the stack
(free tiers, Supabase's 7-day inactivity pause vs. Neon), scaffold the app, write tests, set up
CI, and deploy to Vercel and Neon. I made the final calls on architecture and product:
request-then-confirm, save-before-notify, one owner account, and free push alerts instead of
paid SMS.

**2. Independent review: a second model (OpenAI Codex).** To avoid one model grading its own
work, I had Codex review the project from scratch in a read-only sandbox, three times:

- *Code review:* 14 findings. I verified each against the code, and 13 were real. The fixes
  include guarding every status change against stale tabs, clearing a cancelled booking's old
  slot, blocking past-time confirmations, idempotent submissions, per-visitor rate limiting,
  removing contact details from push alerts, and stricter phone validation, with end-to-end
  regression tests for the serious ones.
- *Strategy and research review:* researched AC Innovations, real mobile-groomer operations,
  and off-the-shelf tools (Square Appointments, MoeGo). That review shaped the client
  assumptions, discovery questions, pilot plan and build-vs-buy section above, and led to the
  "confirmation text sent" tracking.
- *Video review:* a critique of the walkthrough's pacing and clarity, which cut it from 2:08 to 1:32.

**3. The walkthrough video: produced by code.** The video isn't a screen recording I edited by
hand. A Playwright script drives the real app inside a 1080p stage (phone and browser frames,
cursor, captions), a local open-source voice model (Kokoro) narrates, and ffmpeg edits the
cut. Scripting the demo also tested the product: it surfaced two real UX bugs, both fixed and
covered by tests. A corrected field still showed "required" until resubmitting, and a failed
submit silently cleared the customer's "Time of day" choice.

**What I verified myself:** every review finding was checked against the code before I acted on
it, the research claims used in the docs were checked against their sources, and nothing
merged without lint, typecheck, 17 unit tests and the end-to-end suite passing in CI and against
the live site.

## Decisions and trade-offs

- **Requests, not instant booking.** A mobile groomer's day depends on drive time, coat
  condition and dog temperament. Kevin keeps the final say, and customers still get a
  clear, fast process.
- **Push over SMS for alerts.** SMS APIs cost money and need carrier registration; ntfy
  push is free and usually arrives within seconds. Kevin installs the ntfy app once. The email
  channel is a fallback.
- **A single shared password** instead of user accounts: Kevin is the only user. The
  session check runs in the page and in every Server Action, not only in `proxy.ts`.
  Sessions last 30 days and are signed with `SESSION_SECRET`, so before real use (or after
  the password leaks) rotate **both** `DASHBOARD_PASSWORD` and `SESSION_SECRET`. Changing only
  the password leaves existing sessions logged in.
- **Confirmation texts are sent by Kevin.** "Text confirmation" opens his own messaging app with
  the message written; the app can't see whether he pressed send, so he ticks "Mark text sent".
- **Hosting cost:** the demo runs on free tiers, but Vercel's Hobby tier is for non-commercial
  use. Kevin's real business would need a paid plan (Vercel Pro is ~$20/month) plus an agreed
  support arrangement.

## What I'd build next

Driven by what the pilot shows, roughly in this order:

1. Customer and pet history with one-tap rebooking (repeat clients every 4–8 weeks)
2. Reminder texts, once Kevin wants to pay for SMS
3. Service-area and working-day rules, so customers only pick days Kevin covers their town
4. Login rate limiting and pagination beyond 200 requests per tab, once this runs for real
