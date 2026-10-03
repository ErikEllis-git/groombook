# Loom walkthrough scripts

The assessment asks for 1–3 videos. Two short ones work well: one for the
client view and one for the technical view. Keep each under about 4 minutes.

**Before recording**
- Open the live site on your phone and on your laptop.
- Install the **ntfy** app on your phone and subscribe to the project's topic, so the alert pops up on camera.
- Have the dashboard open and logged in in a second tab.
- Run `npm run db:seed` against production once, so the dashboard has realistic data.

---

## Video 1: "Kevin's new booking flow" (product demo, ~3–4 min)

**1. The problem (20s)**
> "Kevin runs a mobile dog-grooming business. Today clients text him to book, and those
> requests get buried in his messages. He told us he wants three things: a way for people to
> request an appointment, one place to see every request, and a notification when one comes in.
> Here's what I built."

**2. The customer side (60s)** *(phone screen, or a narrow browser window)*
- Show the booking page: "This is the link Kevin shares on Instagram, Google or his van."
- Point out the three steps: "Customers know it's a request and that Kevin will confirm."
- Submit with a mistake (skip the phone number) to show the friendly error and that nothing typed is lost.
- Fill it in properly. Mention the fields a *mobile* groomer needs: address, dog size, notes like gate codes.
- Submit, then show the confirmation page.

**3. The notification (20s)**
- Show your phone: the alert arrives within seconds with the dog, service and day. Contact
  details stay out of the alert on purpose, so they're only visible behind the login.
- "No more digging through texts. Tapping it opens the dashboard."

**4. Kevin's dashboard (90s)**
- New requests tab with the count badge: "Oldest first, so nobody waits."
- On the new card: tap-to-call, the address opens in Maps, the customer's note.
- Pick a time and click **Confirm booking**. The card moves to **Upcoming**.
- In Upcoming: jobs grouped by day, which is his schedule.
- **Text confirmation**: the message is prewritten. "He still texts customers personally, just without the typing."
- Private notes: "Quoted $95, matting behind ears."
- **Mark completed**, then show the Completed tab. Show **Decline** on another request.
- "It refreshes on its own, so he can leave it open in the van."

**5. Wrap-up (20s)**
> "Every request is now complete, in one place, with a status, so nothing falls through the cracks.
> It costs nothing to run as an MVP. Next steps would be automatic reminder texts and customer history."

---

## Video 2: "How it's built" (technical walkthrough, ~3–4 min)

**1. Stack and why (45s)** *(README in GitHub)*
- Next.js 16 with Server Actions: one codebase for the public page, the dashboard and server logic.
- Postgres on Neon with Drizzle ORM and versioned migrations, deployed on Vercel.
- ntfy for free push alerts instead of paid SMS. Resend email is optional.
- I compared Supabase, but its free tier pauses after 7 days idle, a bad fit for a live demo link.

**2. Code tour (2 min)**
- `src/lib/booking.ts`: one source of truth for services, sizes and time windows, plus the Zod schema.
  The form, the database enums and the dashboard all use it, so labels can't drift.
- `src/app/actions.ts`: the booking Server Action. It validates, saves, then sends the alert with
  `after()`, so the customer never waits on it and a failed alert can't lose a request.
- `src/db/queries.ts`: all SQL in one place. Every status change, confirming included, only
  applies from the status Kevin was looking at, so a stale tab on his laptop can't undo what he
  did on his phone. (An independent AI review caught that confirming wasn't guarded at first; the
  fix has e2e regression tests.)
- `src/lib/auth.ts` + `src/proxy.ts`: a signed httpOnly cookie. The proxy only redirects; the real check
  runs in the page and in every dashboard action.
- Abuse protection without a CAPTCHA: honeypot, a per-visitor limit keyed on a salted IP hash,
  and a per-form submission ID so a retried submit can't double-book.
- Constant-time password compare, US-only phone validation, time-zone-aware "no past dates".

**3. Quality (45s)**
- `npm test`: unit tests for validation, sessions and notifications.
- `npm run test:e2e`: Playwright on a phone viewport runs the full request → confirm → complete flow,
  plus regression tests for stale tabs, cancel → restore and past-time confirms.
- I had a second AI (OpenAI Codex) review the whole project against the brief, verified each
  finding, and fixed the real ones.
- GitHub Actions CI runs lint, typecheck, unit tests and e2e against a real Postgres on every push.

**4. Trade-offs and next steps (30s)**
- A request flow rather than instant booking: Kevin keeps control of drive time and difficult dogs.
- A single password, because Kevin is the only user.
- Vercel Hobby is non-commercial. For the real business it moves to a paid plan or Cloudflare.
- Next: SMS reminders, customer and pet history, a calendar with days off blocked out.
