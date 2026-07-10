// Mask technician last name until first verified customer contact
export function techDisplayName(fullName: string, revealed = false): string {
  if (revealed) return fullName;
  const parts = fullName.trim().split(" ");
  if (parts.length < 2) return fullName;
  const last = parts[parts.length - 1];
  return [...parts.slice(0, -1), last[0] + "*".repeat(5)].join(" ");
}

export const PRICE_PER_WINDOW       = 20; // flat rate — brand promise is "$20 each" (flattened July 2026)
export const PRICE_PER_WINDOW_EXTRA = 20; // kept for the tier machinery; equal values = flat pricing
export const MIN_WINDOWS = 5;
export const MAX_WINDOWS = 20;

// Tiered price: minimum windows at base rate, anything above at the discounted rate
export function calcPrice(count: number, min: number): number {
  const base  = Math.min(count, min) * PRICE_PER_WINDOW;
  const extra = Math.max(0, count - min) * PRICE_PER_WINDOW_EXTRA;
  return base + extra;
}

// Apply a promo discount to a base total.
// 'per_window' only reduces the rate on windows ABOVE the service-area minimum.
export function applyPromo(
  baseTotal: number,
  windows: number,
  minWindows: number,
  discountType: "percent" | "per_window" | "flat",
  discountValue: number
): number {
  if (discountType === "percent") {
    return Math.round(baseTotal * (1 - discountValue / 100) * 100) / 100;
  }
  if (discountType === "flat") {
    return Math.max(0, Math.round((baseTotal - discountValue) * 100) / 100);
  }
  if (discountType === "per_window") {
    const minCost   = Math.min(windows, minWindows) * PRICE_PER_WINDOW;
    const extraCost = Math.max(0, windows - minWindows) * discountValue;
    return minCost + extraCost;
  }
  return baseTotal;
}
