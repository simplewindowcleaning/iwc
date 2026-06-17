// Service areas for Ladderless Windows — 9 ZIP codes, Santa Cruz County
// center: [longitude, latitude] (Mapbox order)

export interface ServiceArea {
  zip: string;
  name: string;
  center: [number, number];
}

export const SERVICE_AREAS: Record<string, ServiceArea> = {
  "95060": { zip: "95060", name: "Santa Cruz",        center: [-122.0308,  36.9741] },
  "95062": { zip: "95062", name: "Live Oak",           center: [-121.9934,  36.9657] },
  "95003": { zip: "95003", name: "Aptos",              center: [-121.8956,  36.9771] },
  "95018": { zip: "95018", name: "Felton",             center: [-122.0721,  37.0513] },
  "95066": { zip: "95066", name: "Scotts Valley",      center: [-122.0130,  37.0508] },
  "95073": { zip: "95073", name: "Soquel",             center: [-121.9574,  36.9918] },
  "95064": { zip: "95064", name: "Santa Cruz (UCSC)",  center: [-122.0584,  36.9967] },
  "95065": { zip: "95065", name: "Pleasure Point",     center: [-121.9666,  36.9825] },
  "95010": { zip: "95010", name: "Capitola",           center: [-121.9527,  36.9750] },
};

// Default area when nothing is confirmed yet
export const DEFAULT_ZIP = "95060";

// Initial wide camera — shows all 9 service areas at once
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

// Detect which service ZIP (if any) a user-typed string matches
export function detectZip(input: string): string | null {
  const found = Object.keys(SERVICE_AREAS).find((z) => input.includes(z));
  return found ?? null;
}
