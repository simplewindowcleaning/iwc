# CLAUDE.md — Instant Window Cleaning

## Who You're Working With
Chris, Santa Cruz CA. Solo operator, 25 years window cleaning experience, returning to work despite disability. Technically capable, big-picture thinker. Casual tone, no hand-holding. Claude Code is the primary dev assistant.

## Business
- **Operating name:** Simple Window Cleaning (sole prop, LLC deferred until revenue)
- **Primary print domain:** InstantWindowCleaning.com
- **Flagship site domain:** SimpleWindowCleaning.com → redirects to Instant
- **Live site:** ladderlesswindows.com / www.ladderlesswindows.com (Vercel)
- **Address:** 325 Soquel Ave, Santa Cruz CA (virtual suite)
- **Payment:** Venmo only for now

### Pricing
- Anchor: $20/window + $2/screen (no promo = sticker price)
- Real target via promo: ~$10/window
- Estimate visits: $22/$44/$66 (distance tiers), includes 1-3 windows cleaned on spot
- Recurring: monthly exterior $5/window, quarterly interior $5/window

---

## Projects

### Landing Site (this repo)
**Path:** `/Users/czilla/Projects/IWC/landing`
**Git:** `github.com/ladderlesswindows/iwc` → main branch auto-deploys to Vercel
**Vercel project:** `iwc` (chris-vinson-s-projects)
**Framework:** Next.js 14, App Router, TypeScript, Tailwind

### Worker App (Expo)
**Path:** `/Users/czilla/Projects/ladderless-landing/ladderless-provider-app`
**Git:** `github.com/ladderlesswindows/site` → main branch
**Framework:** Expo Router v3, React Native, TypeScript
**Key rule:** All API calls go through the landing site's Next.js API — never direct to Supabase. This is intentional: multi-employer architecture where each employer gets their own site URL.

---

## Deploy Pipeline
GitHub → Vercel auto-deploys on every push to `main` (wired June 2026).
Both `ladderlesswindows.com` and `www.ladderlesswindows.com` are configured as Vercel project domains — they update automatically on deploy.

If a manual deploy is ever needed:
```bash
vercel --prod --force
```
No `vercel alias set` needed anymore — domains are in Vercel project settings, not manual aliases.

---

## Supabase
**Project:** `ujorfgfilmbwgkecpdck.supabase.co`
**URL:** `https://ujorfgfilmbwgkecpdck.supabase.co`
**Anon key (public):** `sb_publishable_rVJvhKm5hbLZ8Dz8SIZs4g_WATm9bTy`
**Client:** `lib/supabase.ts` — use `getServiceClient()` for server-side (bypasses RLS), `getPublicClient()` for client-side

**CLI link:**
```bash
supabase link --project-ref ujorfgfilmbwgkecpdck
```

**If schema cache errors appear** ("cannot find column X in schema cache"):
Run in Supabase SQL editor: `SELECT pg_notify('pgrst', 'reload schema');`
If that doesn't work, run each statement separately (the editor can fail on multi-statement blocks).

### Tables
```
bookings
  id uuid PK, created_at, service_date date NOT NULL, service_time text NOT NULL,
  window_count int, address text, first_name text, last_name text, phone text,
  email text, notes text, needs_estimate bool, estimate_deadline text,
  total_price numeric, status text (pending/confirmed/completed/cancelled),
  worker_notes text

gig_completions
  id uuid PK, created_at, booking_id uuid → bookings(id),
  worker_notes text, review_token uuid UNIQUE, customer_phone text,
  customer_review_text text, customer_stars int,
  review_submitted_at timestamptz, review_status text

availability      — blocked dates/times for booking calendar
chat_escalations  — escalated chatbot conversations
mileage_log       — per-gig mileage for worker app
promo_codes       — discount code engine (not yet implemented in UI)
providers         — worker/provider accounts
site_settings     — key/value admin-configurable settings
transactions      — financial records per booking
```

---

## Landing Site File Map
```
app/
  (main)/
    page.tsx          — homepage, full booking flow (map, window counter, slot picker)
    summary/page.tsx  — checkout page with Venmo button
    about/page.tsx
    commercial/page.tsx
  admin/
    page.tsx          — main admin dashboard (bookings, completions, finance tabs)
    worker/page.tsx   — worker-facing admin tab (gig list, new gig, end gig)
    types.ts          — shared Booking type
  api/
    bookings/route.ts         — POST: customer creates booking from website
    bookings/[id]/route.ts    — GET: single booking lookup
    worker/gigs/route.ts      — GET: list active gigs, POST: add manual gig, PATCH: status
    worker/end-gig/route.ts   — POST: complete gig, create review token
    worker/cant-make-it/route.ts
    admin/bookings/route.ts   — admin-authed booking list
    admin/auth/route.ts
    admin/settings/route.ts
    admin/reviews/route.ts
    admin/transactions/route.ts
    admin/analytics/route.ts
    admin/mileage/route.ts
    admin/promo-codes/route.ts
    admin/block/route.ts
    admin/ics/route.ts
    review/[token]/route.ts   — GET/POST for customer review page
    chat/route.ts             — AI chatbot
    chat/escalate/route.ts
    settings/route.ts
  booking/[id]/updates/page.tsx — post-booking page (email/text opt-in)
  review/[token]/page.tsx       — customer review submission page

lib/
  supabase.ts       — getServiceClient(), getPublicClient()
  availability.ts   — date/time formatting + availability fetch
  admin.ts          — adminHeader() for auth
  constants.ts
  ics.ts
  location.ts
  serviceAreas.ts / serviceAreaTypes.ts

components/
  MapPanel.tsx      — Mapbox service area map
  MobileView.tsx    — mobile booking flow
  SlotPicker.tsx    — time slot picker
  WindowCounter.tsx — window count step
  ChatWidget.tsx    — customer chatbot UI
  NPCWidget.tsx + npc/ — admin quick-access widget
  AppHeader.tsx, HamburgerMenu.tsx, AppWrapper.tsx
  EstimateToggle.tsx, ReviewsSection.tsx, SlideshowHtml.tsx
  SparkleBackground.tsx
  admin/AdminCalendar.tsx, FinanceTab.tsx, ICSUploader.tsx
```

---

## Worker App File Map
```
app/
  gig-list.tsx      — main gig list, "Add Gig" form (walks up/manual jobs)
  gig-safety.tsx    — safety checklist before starting gig
  schedule.tsx      — stub (coming soon — will show website bookings)
  (clock-in)/clock-in.tsx
  (walls)/new-job/  — wall-by-wall job documentation flow
    walls.tsx, wall-capture.tsx, camera.tsx, summary.tsx, final.tsx, review.tsx
  (screens)/new-job/ — screen documentation
  (address-navigation)/home.tsx
  (past-jobs)/previous-jobs.tsx + [id].tsx
  (welcome)/welcome.tsx

src/
  features/
    schedule/ScheduleScreen.tsx  — stub (old broken version replaced)
    walls/actions/QuickComplete.ts — stub (not yet implemented)
  lib/supabase.ts  — direct Supabase client (used only internally if ever needed)
```

---

## Key Rules
- **No comments** unless the WHY is non-obvious (a hidden constraint, workaround, or subtle invariant)
- **No speculative code** — don't build for hypothetical future needs
- **Minimal changes** — solve exactly what's asked, nothing more
- **No "optional" label** in customer-facing UI
- **No cash/in-person payment** option on the website
- **Review flow must stay FTC/Google ToS compliant** — no auto-submit, no fabricated text
- The Expo app routing through Next.js API is intentional — do not add direct Supabase calls to the Expo app

## Brand Positioning (July 2026 pivot) — READ PLAN-MODEL.md
"Exterior only" positioning is DEAD. New theme: **"Simple Windows. $20 each. Instant Booking. Done."** with four subscription plans (Birdhouse / Active / Guests / Second) siloed under "Simple Window Cleaning Plans." Full strategy, pricing logic, language rules, and systems implications: `PLAN-MODEL.md` in this repo. Status: concept locked, pre-implementation — don't rewrite existing site copy until Chris green-lights implementation.

## Next on the Roadmap (as of June 2026)
1. Promo code engine (admin create/edit + customer calculator)
2. Post-job review + discount sequence (Twilio SMS → approval portal → Google handoff)
3. Estimate calculator page
4. Analytics inline in admin (Vercel Pro required)
