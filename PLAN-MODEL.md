# SWC Plan Model — Eliminating "Exterior Only"

**Status:** Concept locked, pre-implementation
**Supersedes:** Exterior-only positioning with third-party interior affiliate as the primary interior path

---

## The Reframe

**Target market: Silicon Valley and Morgan Hill — Santa Cruz is the soft-launch proving ground.** The model is built for households with pool-guy expectations and monthly-exterior money; the Santa Cruz launch validates the machine before it meets its real market.

**The whole model in four words — INTERNAL ONLY, never customer-facing: "Interiors free for regulars."** Exterior is the $20 product; interior is the loyalty currency, reachable only by rhythm. Every mechanism below is an implementation detail of that sentence. The customer experiences this truth (inside-and-out on visit one, renewed by rhythm) but is never handed the sentence — spoken, it's a coupon; unspoken, it's a relationship. Files with "underfilled"/"soil rate" as internal language.

Simple Window Cleaning is not an "instant booking, exterior-only" company. Instant booking is a feature. The model is **affordable regularity through itemization and repeatable access**, with automation as the cost accelerant, not the customer promise.

Exterior vs. interior no longer defines the product line. Two variables define everything:

1. **Traffic** (household activity → how fast glass degrades)
2. **Access** (attended vs. unattended, rigid vs. flexible scheduling)

Every window in every home is classified on these axes. Plan eligibility is computed, not judged.

## Core Economic Logic

- **First visit is a first clean** (built-up grime, screens, tracks, frames) — full price, absorbs onboarding cost. NOT restoration: hard water removal, oxidation, and stain work are a different trade and never part of SWC. Etched/stained glass gets a referral, not a quote. Plans exist so glass never reaches that state.
- **Maintenance visits are genuinely cheaper work** (~40–60% of first-visit labor; WFP rinse-class vs. scrub-class). The plan discount is a cost-of-service truth, not a promotion.
- **Frequency is the eligibility condition, not the reward.** Glass only stays rinse-class (interior-WFP-compatible) if visits stay frequent enough for the household's traffic. Lapse past the floor → window reverts to scrub-class → detail rate returns automatically. The physics is the contract; no penalty clause needed.
- **Scrub-class windows never qualify** (kitchen sink window, high-traffic panes). They ride the plan schedule as à-la-carte add-ons at $20 standing, never at plan price.

## Pricing Architecture

- **The pricing atom: $20 per side.** A window has two sides; you pay per side. Everything derives: exterior visit = one side = $20, in-and-out = $40 retail, free interior = a countable $20/window gift, half-price interior add-on = $10. "Per side" is layer-two vocabulary — revealed only at the window-6 add-on moment and in the agent's deeper answers; the mantra stays "$20 each" for skimmers.
- **Anchor:** $20/window, 1st and 2nd story (flat height pricing = silent ladderless differentiator)
- **Plan rate:** ~half of standard, never printed as a number in marketing ("most of our customers pay about half that")
- **Reveal moment:** the quote widget — itemized house, price-pair display (first visit $X → every visit after $Y → plan $Z/mo). The gap between the numbers *is* the business model explaining itself.
- **Billing lean:** per-window pricing displayed on the quote, flat monthly on the card after visit one calculates the house.

## The Four Plans

Each plan monetizes a different scarce thing.

### 🐦 Birdhouse — monetizes glass condition
- **Who:** quiet, low-traffic homes (empty nesters, couples). Internal: "underfilled" — never say to customer.
- **Scope:** whole house, interior + exterior — the flagship, full realization of the model
- **Floor:** 3 exterior + 2 interior per year (minimum to keep glass rinse-class)
- **Default (not bonus):** quarterly both — sell the default, allow the floor
- **Interior method:** interior WFP viable because soil stays light; 60-day max interval

### 🏠 Active — monetizes access limits
- **Who:** everyone — no rejection possible; this is the front door of the plan system
- **Scope:** living areas interior + full exterior. Bedrooms/bathrooms/kitchen-sink excluded from plan rate
- **Floor:** quarterly exterior; interior included on 3 of 4 visits (frame as inclusion, not a smaller number)
- **À la carte:** all excluded windows $20 anytime, riding the plan schedule
- **Trust ramp:** attended visits 1–2, then offer unattended ("after a couple visits you won't even need to be home") — access earned through demonstrated visits, SAFE badge as reassurance behind a natural ask

### 🔑 Guests — monetizes schedule flexibility
- **Who:** Airbnbs, STRs, vacant listings
- **Cadence:** weekly or biweekly only
- **The rule (keep near-verbatim in terms):** *full-day flexibility required — if you need 11–3, use Instant Booking.* Rigid demand routes to the full-price product; the plan pool stays route-optimizable.
- **Access:** unattended by definition; full interior every visit; visits keyed to route, not turnover windows

### 🌴 Second — monetizes absence
- **Who:** second homes, seasonal properties
- **Scope:** standing exterior + interior before arrivals ("it's clean when you get there")
- **Add-on (itemized, priced — NOT free goodwill):** "Arrival-Ready" — named short list only (mail in, water plants, photo walkthrough per visit), $X/visit
- **⚠️ Compliance flag:** non-window services approach "home watch," a regulated/separately-insured category in some states. Verify CA posture + GL endorsement before offering. Photo walkthrough uses existing before/after app feature — for this segment the photo set IS the product.

## Interior Rules Matrix (traffic × interval)

| Household | Interior scope | Max interval | Method |
|---|---|---|---|
| Quiet (Birdhouse) | All windows | 60 days | Interior WFP |
| Active (kids/dogs) | Living areas only | Monthly | Interior WFP / squeegee mix |
| Vacant/STR (Guests) | All windows | Weekly–biweekly | Interior WFP / Winbot |
| Any | Scrub-class panes | n/a — never qualifies | Squeegee, $20 standing |

## Language Rules (hard-won this session)

- **Name the proof, not the prestige.** Never: VIP, upper-class, Royal, luxury. Instead: badged staff, standing schedule, half rate.
- **Say "traffic," never "soil"** in anything customer-facing.
- **"Qualify" is the verb.** Discount = earned status (Costco psychology). Full price = didn't qualify, not overcharged.
- **Mirror, don't rank.** Plan names describe the household/operation, never a tier. No letters, no Type B.
- **Sell the state, not the interval.** "Plans keep your windows in maintenance condition — that's why they're cheaper."
- **"Living areas,"** never "common areas." Frame scope as what they get, not what's excluded.
- Internal labels (house types, soil rate, underfilled) never face the customer.

## Marketing Skeleton

**Banner:**
> Simple Windows. $20 each. Instant Booking. Done.
> *Plans: Airbnbs · second homes · quiet homes · your living areas + full exterior*

- Two audiences, two CTAs: "Book Now" (transactional) / "See if you qualify" (plans)
- Star bubble carries ONE claim max (e.g., "Like your pool guy — but windows.")
- Category analogy is the comprehension engine: **pool and lawn service, for glass.** The name carries trust, the tagline carries the analogy, the quote widget carries the explanation.

**Agent line (Haiku booking flow):**
> "Regular visits are easier work, so our plans run about half price. Want to see which of your windows qualify?"

Per-window qualification planted before the quote → itemized exclusions land as expected, not gotcha.

## Systems Implications (for Claude Code)

- **The iPad app stays crucial under flat pricing** — three irreplaceable jobs: (1) adding windows beyond the 5 preordered, (2) the on-site screens conversation (staging lesson, $2 removal call), (3) the per-window "is this 1 window?" documenter. Until the golf ball has timed ~1000 windows, the app IS the empirical dataset — every human qualification call is calibration data for computed plan eligibility later.
- **Qualification generosity policy (interim):** exterior "counts as 1 window" calls are EXTRA GENEROUS until the golf-ball dataset is done (marginal cost is pole time; generosity buys goodwill + data). Interior calls are stricter — real manual labor inside the home.

- **Plan schema:** plan = eligibility rules + visit floor + included scope + à-la-carte rate card
- **Promo engine repurposed:** promo codes become plan-enrollment instruments, not one-off discounts
- **LLR pod second axis:** visit-over-visit time deltas per window = empirical traffic rate. Window rating = access difficulty × traffic rate → computed plan eligibility
- **Unattended visits:** timestamped entry/exit photos (existing job-sequence flow) double as access accountability layer; one-page access agreement required before first unattended entry (insurance endorsement check)
- **House typing:** internal classification at quote time (matrix cell), customer sees plan name only

## Brand/Domain Portfolio Notes

- **Simple Window Cleaning** = the service brand; "Simple" repositioned from easy-booking to handled-forever
- **Rinsers** = strongest crew-noun candidate; method-honest (maintenance visit IS a rinse); possible future route/maintenance brand
- **WeeklyWindows.com** = robot-era reveal domain (weekly = impossible today, the point later); premium aesthetic-maintenance register
- **WindowGloss** = future coating/product SKU name, not a service brand
- **Windogram / Ladderless** = unchanged; national fulfillment + hardware/standards entities
- Naming test: does it imply *someone else, on a rhythm*?

## Upsell Ladder (July 2026 refinement)

On-site upsell is binary: **take a Plan, or it's standard online booking from here.** No counteroffers in person. If they decline the plan, the "next offer deal" arrives later **by email**: commit to annual cadence and keep the first-visit deal locked on (at least) the windows originally booked. Ladder: Plan (~half) → Annual next-offer (first-visit deal, locked) → Online at $20 flat. Each rung is honest and strictly worse than the one above, so the plan sells itself. The next-offer email is the first concrete SendGrid use case.

The email requires nothing from the customer — no acceptance, no commitment. Core copy: "this same deal is locked in and you'll get reminders — would you like to see the plan you can consider?" Deal locked + reminders = retention by default; the plan link rides along as a soft P.S. ("your windows already qualified on our visit").

## First-Visit Tier Structure (settled July 2026)

The customer state machine — no grudge ledger, physics wins:

- **Windows 1–5 (new customer):** interiors FREE — "new customer special," stamped as a special from the start so nobody mistakes it for the permanent price.
- **Windows 6–10:** alert reveals layer-two truth: "Your first 5 have interior free as a new customer special. Normal rate is $20 per side of a standard 1st or 2nd floor window — but right now, add up to 5 more windows and get their interiors for half price (may also be added on-site if time permits)." Add-on special is ONCE PER ADDRESS, EVER.
- **Window 11+:** back to normal rate, with a second alert that doubles as the ladderless qualification check ("1st and 2nd story, reachable without a ladder?") — verify before accepting that much commitment.
- **Regular:** book every year → deal stays locked, reminders carry the rhythm.
- **Lapsed:** quiet expiry, no penalty. Return in 5 years with horrible windows → start over as a NEW customer (full 5-window special again) — but no add-on deal. Exploit-checked: strategic lapsing yields the deal at best 2 years in 3; faithful annual keeps it every year. The loyal path strictly dominates.
- **Plans:** the upgrade path out of the whole machine — interiors free for regulars, said by no one, felt by everyone.
- **Screens:** remain the honest pain point — always cleaned free, $2/window for tech removal/reinstall, staging lesson offered. No way around it; keep it truthful and small.

## Rhythm Economics — the Locked Deal, Formally (settled July 2026)

**The locked deal is a locked PER-SIDE RATE, portable across surfaces and cadence — never a locked bundle.** A "10 windows in/out for $250" first deal is really 20 sides at ~$12.50/side; on rhythm, the customer may re-allocate those sides however life demands (all-exterior monthly, all-interior via partner, any mix). The deal never changes; the rhythm does — which is how a $250/year household becomes a $250/month household with zero renegotiation.

- **The mission in one line:** convert people who clean windows every 2+ years into every-6-months-or-shorter people. The frequency ladder: never → first visit → annual (locked deal + reminders) → semi-annual (month-nine discomfort + mid-year touch offer) → plan. Each rung up is a better deal for them, lighter work for us (physics), and more revenue per household.
- **Fungibility cuts both ways:** the customer allocates sides across surfaces; we allocate fulfillment across labor (own WFP for high-margin exterior, partner for interiors at a per-side cost below the locked rate). Even if a "cheaper guy" takes a surface, whoever holds the rhythm owns the household — the relationship, reminders, history, and locked deal are the asset, not the squeegee time.
- **Rich-guy stress test — passes structurally:** the discounted rate is unreachable without rhythm. Cold or sporadic arrivals pay retail ($20/side) every time, because the deal lapses between their visits. The only wealthy customer paying the locked rate is one on-rhythm — the dream account. Remaining soft spot is psychological (some wealthy buyers distrust cheap): that's the WeeklyWindows premium-register lever, parked for later.
- **Floor check — the gamer is fine:** the 18-month 5-window optimizer gets fair-pay work ($/hr never underwater), a bounded basket (add-on special is once-per-address ever), and lives with a 5-clean/10-dirty contrast that sells the upgrade from inside their own house.
- **The competitive bar:** the deal just needs to be good enough, plus the convenience, to beat any "other guy" offer. Convenience compounds (reminders, locked rate, known house, history, plan number waiting); discounts don't. The other guy sells a price; we sell never-thinking-about-it.
- **Complexity policy:** edge cases (partner spread, quality accountability, dual-fulfiller scheduling) get refined over time from app + golf-ball data — measurement, not whiteboard debate.

## First-Visit Economics Defense

The $100 in-and-out first visit is acquisition cost, not a price — it only loses money if plan conversion stays at zero. The metric is plan conversion rate, not first-visit volume. Fences:

1. **"First-Year Special" framing** — the generous first visit (interior included) is explicitly a founding-year promotion. Pre-authorizes future tightening (a special ends; prices don't "go up"), makes "locked in" mean founding-customer status, and creates honest urgency. Clock aligns with the launch narrative (soft launch → all areas Oct 1).
2. **Once per address** — first-visit treatment is enforced by address lookup in bookings (data already exists).
3. **The locked deal = the RATE, never free interior.** The next-offer email locks $20 flat on the original windows against future increases. Recurring interior is purchasable ONLY as a plan — if the lock included in-and-out, it would undercut the entire plan ladder.
4. **Calendar as throttle** — control first-visit slots per week; surging demand becomes wait time (reads as popularity), not price panic.
5. **Grandfather loudly** — when floors rise for new addresses, locked customers keep theirs and get told so ("prices went up, yours didn't" — the strongest retention email in existence).
6. **The deal is earned annually, one law system-wide: your rate reflects your rhythm.** Book every year → the founding deal stays. Miss a year → the special quietly expires; the landing pad is a fresh NEW-customer state (full 5-window special, no penalty, no add-on deal). A lapsed customer is recoverable, an insulted one is gone.
7. **No account walls.** Address + email from the booking IS the account — deal tracking, lapse detection, and once-per-address enforcement all run on data already collected. If customers ever need to see their status, a passwordless magic-link page — never a signup gate on Instant Booking.

## Open Decisions

1. Per-window-billed vs. flat-monthly plan billing (lean: itemized quote, flat card)
2. Second plan "Arrival-Ready" price point + CA home-watch compliance check
3. Guests plan monthly-interior load vs. margin model — confirm spreadsheet before copy ships
4. Plan minimum term / churn guard on visit-two enrollment (physics handles lapse; decide if a term is still wanted)
5. Referral partner for restoration work (hard water / oxidation / stain removal) — SWC declines these jobs; a standing referral makes the decline a service
