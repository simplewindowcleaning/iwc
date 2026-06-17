---
name: project-iwc-overview
description: IWC / Ladderless Windows app — stack, hard rules, what to touch vs preserve
metadata:
  type: project
---

# IWC / Ladderless Windows — Project Overview

## Stack
- **Framework**: Next.js 14.2, React 18, TypeScript
- **Styling**: Tailwind CSS v3 + inline styles (glassmorphism, dark #080810 bg)
- **Animations**: Framer Motion 11
- **Font**: Space Grotesk (next/font/google)
- **Icons**: Lucide React
- **Backend**: Supabase JS v2 (anon + service role clients)
- **Admin calendar**: FullCalendar 6 (dynamic import, no SSR)
- **Project URL**: https://ujorfgfilmbwgkecpdck.supabase.co

## Directory
- App lives at `/Users/czilla/Projects/IWC/landing/`
- Reference files (old IWC code to review later): `/Users/czilla/Projects/IWC/reference/`
- DO NOT touch `/Users/czilla/Projects/ladderless-landing`

## Hard rules
- DO NOT rebuild Supabase slot logic, booking writes, or admin calendar from scratch
- Service role key in `.env.local` only — never in client code
- No direct Postgres connection (password not provided; use Supabase JS client)

## Fallback slot
- `FALLBACK_DATE = "2026-07-04"`, `FALLBACK_TIME = "14:50"` (July 4, 2026 at 2:50 PM)
- Used until real Supabase availability calendar is populated
- Default booking state: 1 window, "Santa Cruz, CA 95060", July 4 2026 at 2:50 PM

## Current desktop layout (two-panel, centered)
- **Left panel (480px)**: The booking form — frosted glass, SparkleBackground visible behind
- **Right panel (360px)**: NPCWidget — sticky, dark `#0a0614`, skinnable
- Both centered together (840px total); SparkleBackground fills the margins
- Mobile: form only (NPC hidden)

## NPC Panel architecture (components/npc/)
- `NPCWidget.tsx` — orchestrator: step state, quest log, skin toggle, slot fetch
- `npc/types.ts` — shared Step/Skin/SkinProps/QuestItem types
- `npc/GameSkin.tsx` — FF pixel-art canvas + Cinzel typewriter + quest log
- `npc/CleanSkin.tsx` — modern glass Q&A cards (no canvas)
- Toggle: "OFF" exits game → clean mode; "▶ GAME" restores it
- Quest log tracks confirmed steps in both skins; switching skins preserves progress

## "Power User Interface" — SAVED, not yet active
The current main panel (SlotPicker + EstimateToggle + WindowCounter + contact form) is the full booking form.
**Plan**: When customer auth is added (returning customers), restore this panel as a quick-checkout "power user" view — direct field access, no guided path, instant Book Now.
Will also be used for an app flow that links directly to index fields.
**Why:** Not needed during the Mapbox/guided-path redesign — hiding it is intentional, not a deletion.

## Desktop layout (current — Mapbox + NPC)
- **Left panel (flex 1)**: `MapPanel` — Mapbox GL JS satellite-v9, dynamic import (ssr:false)
  - Starts wide (zoom 9.8) showing all 9 service areas with pulsing teal dot markers
  - `flyTo()` zooms in (zoom 13.5, pitch 52, bearing -14, 4s curve 1.6) on step advance
  - Overlays: calendar (timeslot step), photo cards (windows step), summary (estimate+)
  - `onStepChange` callback → `activeStep` in page.tsx → MapPanel reacts
- **Right panel (360px)**: NPCWidget — unchanged; `onStepChange` prop added
- Token: `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local`
- Package: `mapbox-gl` + `@types/mapbox-gl` installed
- CSS: imported in `app/layout.tsx` (`import 'mapbox-gl/dist/mapbox-gl.css'`)
- Service areas: `lib/serviceAreas.ts` — 9 ZIPs with [lng, lat], `detectZip()` helper

## Key files
- `lib/serviceAreas.ts` — ZIP → { name, center:[lng,lat] }, INITIAL_CAMERA, ZOOMED_CAMERA
- `components/MapPanel.tsx` — satellite map + overlays (CalendarOverlay, PhotosOverlay, SummaryOverlay)
- `components/PowerUserPanel.tsx` — saved original form (for future auth/returning-customer flow)
- `components/NPCWidget.tsx` — `onStepChange` prop added; `goToStep()` wrapper calls it

## Supabase schema
- `bookings`: id, service_date, service_time, window_count, address, first/last name, phone, email, notes, needs_estimate, estimate_deadline, total_price, status
- `availability`: id, date, time_slot, is_blocked, reason (unique on date+time_slot)
- RLS: anon can INSERT bookings; anon can SELECT availability; service_role unrestricted
