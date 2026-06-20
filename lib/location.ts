// ── LOCATION CONFIG ──────────────────────────────────────────────────────────
// To clone this site for a new location, edit ONLY this file.
// Everything else in the codebase imports from here.
//
// Checklist for a new location:
//   1. Update BUSINESS_NAME and LOCATION_CITY
//   2. Replace SERVICE_AREAS with that location's ZIPs, names, centers, minWindows
//   3. Update DEFAULT_ZIP to the location's most central ZIP
//   4. Update INITIAL_CAMERA to center on the new service area
//   5. Update CLOCK_TOWER_ZIP_KEY and CLOCK_TOWER_COORDS / CLOCK_TOWER_CAMERA
//      (or remove the clock-tower special case in MapPanel if not applicable)
//   6. Update the saved flyTo comment in MapPanel.tsx and MobileView.tsx
//   7. Update the fine-print footnote in the "Not Your First Rodeo" modal
//      (app/(main)/page.tsx — search "Minimums vary by distance") — it lists
//      neighborhood names and their minWindows tiers by proximity, so it needs
//      to reflect the new location's ZIP/name groupings.
// ─────────────────────────────────────────────────────────────────────────────

import type { ServiceArea } from "./serviceAreaTypes";

export const BUSINESS_NAME  = "Simple Windows";
export const LOCATION_CITY  = "Santa Cruz, CA";

// The ZIP whose fly-to gets a dramatic landmark zoom (set to "" to disable)
export const CLOCK_TOWER_ZIP_KEY = "95060";
export const CLOCK_TOWER_COORDS: [number, number] = [-122.0285, 36.9742];
export const CLOCK_TOWER_CAMERA = {
  zoom: 17,
  pitch: 62,
  bearing: -20,
  duration: 5500,
  curve: 1.8,
};

// Wide overview camera — shown on page load (still, no animation)
export const INITIAL_CAMERA = {
  center: [-121.9900, 37.0050] as [number, number],
  zoom: 9.8,
  pitch: 0,
  bearing: 0,
};

// Zoomed-in camera used when flying to a confirmed ZIP
export const ZOOMED_CAMERA = {
  zoom: 13.5,
  pitch: 52,
  bearing: -14,
  duration: 4000,
  curve: 1.6,
};

export const DEFAULT_ZIP = "95060";

export const SERVICE_AREAS: Record<string, ServiceArea> = {
  "95060": {
    zip: "95060", name: "Santa Cruz", center: [-122.0308, 36.9741], minWindows: 1,
    alert: {
      headline: "Coverage notes — 95060",
      notes: [
        "1 window minimum for Santa Cruz addresses",
        "No coverage: Bonny Doon area",
        "No coverage: Empire Grade past 3959",
      ],
    },
  },
  "95062": {
    zip: "95062", name: "Live Oak", center: [-121.9934, 36.9657], minWindows: 1,
    alert: { headline: "Coverage notes — 95062", notes: ["1 window minimum for Live Oak addresses"] },
  },
  "95003": {
    zip: "95003", name: "Aptos", center: [-121.8956, 36.9771], minWindows: 3,
    alert: { headline: "Coverage notes — 95003", notes: ["3 window minimum for Aptos addresses"] },
  },
  "95018": {
    zip: "95018", name: "Felton", center: [-122.0721, 37.0513], minWindows: 3,
    alert: { headline: "Coverage notes — 95018", notes: ["3 window minimum for Felton addresses"] },
  },
  "95066": {
    zip: "95066", name: "Scotts Valley", center: [-122.0130, 37.0508], minWindows: 3,
    alert: { headline: "Coverage notes — 95066", notes: ["3 window minimum for Scotts Valley addresses"] },
  },
  "95073": {
    zip: "95073", name: "Soquel", center: [-121.9574, 36.9918], minWindows: 3,
    alert: { headline: "Coverage notes — 95073", notes: ["3 window minimum for Soquel addresses"] },
  },
  "95064": {
    zip: "95064", name: "Santa Cruz (UCSC)", center: [-122.0584, 36.9967], minWindows: 2,
    alert: { headline: "Coverage notes — 95064", notes: ["2 window minimum for UCSC area addresses"] },
  },
  "95065": {
    zip: "95065", name: "Pleasure Point", center: [-121.9666, 36.9825], minWindows: 3,
    alert: { headline: "Coverage notes — 95065", notes: ["3 window minimum for Pleasure Point addresses"] },
  },
  "95010": {
    zip: "95010", name: "Capitola", center: [-121.9527, 36.9750], minWindows: 2,
    alert: { headline: "Coverage notes — 95010", notes: ["2 window minimum for Capitola addresses"] },
  },
};
