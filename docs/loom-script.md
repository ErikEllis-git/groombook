# Walkthrough video scripts

Two short videos, each under 4 minutes (Loom's free plan allows 5).

**Before recording**
- Live site open on your phone and laptop; dashboard signed in (password `kevin-demo`).
- ntfy app on your phone, subscribed to the project's topic, so the alert appears on camera.
- Demo data loaded (`npm run db:seed`), so the dashboard looks lived-in.

---

## Video 1: Kevin's new booking flow (product, ~3 min)

**1. The brief and my decision (25s)**
> "Kevin's brief gives three clear needs: people can request an appointment, he sees every request
> in one place, and he gets notified when one comes in. I assumed he wants to keep approving each
> appointment himself, because a mobile groomer's day depends on drive time and the dog, and that
> he wants to keep texting customers personally. So this first release organizes requests while
> leaving him in control."

**2. The customer side (50s)** *(phone)*
- The booking page: "This is the link Kevin shares and replies to booking texts with."
- Point out that it's clearly a *request*, and the demo banner.
- Submit with a mistake (skip the phone) to show the friendly error; nothing typed is lost.
- Fill it in and submit. Show the thanks page.

**3. The alert (15s)**
- Phone: the alert shows the dog, service and day. "Contact details stay out of the alert on purpose;
  one tap opens the dashboard."

**4. Kevin's dashboard (70s)**
- New requests, oldest first. On the card: Call, Text, Maps, the customer's note.
- Pick a time, **Confirm booking**. "This saves the time on Kevin's side. It doesn't message the
  customer yet."
- Upcoming, grouped by day. **Text confirmation** opens his messages with the reply written.
  "He presses send himself, then ticks **Mark text sent**, so any customer still waiting stands out."
- Private notes ("Quoted $95"). **Mark completed**. Show **Decline** on another request.

**5. Next step (20s)**
> "Next I'd run a two-week pilot with Kevin: reply to booking texts with the link and check whether
> unanswered requests and admin time go down. Before a long-term build I'd also compare Square
> Appointments and MoeGo with him. Square can already require approving each request, so the
> question is fit and cost, not whether software exists."

---

## Video 2: How it's built, and why (technical, ~3 min)

**1. Three decisions that matter (90s)** *(README on GitHub)*
- **Manual approval.** Requests, not instant booking, because of travel and dog-specific timing.
  Every status change only applies from the status Kevin was looking at, so a stale tab on his
  laptop can't undo what he did on his phone (show `src/db/queries.ts`).
- **Save first, then notify.** The request is stored, then the alert is sent after the response
  with `after()` (show `src/app/actions.ts`). A failed alert never loses a request, and the alert
  carries no phone, address or notes.
- **Right-sized protection.** One owner password with a signed cookie; spam handled with a honeypot,
  a per-visitor limit and a per-form submission ID instead of a CAPTCHA that would slow customers down.

**2. How I verified it (45s)**
- `npm test` for validation, sessions and alerts; `npm run test:e2e` runs the whole flow on a phone
  viewport, including regression tests for stale tabs, cancelled bookings and past times.
- GitHub Actions runs lint, typecheck, unit and end-to-end tests against real Postgres.
- One sentence on AI: "I built this with Claude Code, had OpenAI Codex review it independently, and
  checked each finding myself before fixing it." Then name one fix you'd defend, e.g. the stale-tab bug.

**3. Trade-offs and next steps (30s)**
- Free tiers for the demo; real use needs paid hosting (~$20/month) and a support plan.
- Next, if the pilot supports it: pet history and rebooking, then reminder texts.
