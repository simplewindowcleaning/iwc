import { supabase } from "./supabase";

export const FALLBACK_DATE = "2026-07-04";
export const FALLBACK_TIME = "14:50";

export const SLOT_TIMES = ["08:00", "10:00", "12:00", "14:00", "14:50", "16:00"];

export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

export function getNext14Days(): string[] {
  return getNextDays(30);
}

export function getNextDays(n = 30): string[] {
  const days: string[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 1; i <= n; i++) {
    const next = new Date(d);
    next.setDate(d.getDate() + i);
    days.push(next.toISOString().split("T")[0]);
  }
  // Always include fallback date if not already present
  if (!days.includes(FALLBACK_DATE)) days.push(FALLBACK_DATE);
  return days;
}

export async function fetchAvailability(dates: string[]) {
  try {
    const { data, error } = await supabase
      .from("availability")
      .select("slot_date, slot_time, is_available, is_blocked")
      .in("slot_date", dates);

    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export function buildSlotMap(
  dates: string[],
  dbRows: { slot_date: string; slot_time: string; is_available: boolean; is_blocked: boolean }[]
) {
  const map: Record<string, string[]> = {};

  for (const date of dates) {
    const blocked = new Set(
      dbRows
        .filter((r) => r.slot_date === date && (r.is_blocked || !r.is_available))
        .map((r) => r.slot_time.slice(0, 5))
    );
    map[date] = SLOT_TIMES.filter((t) => !blocked.has(t));
  }
  return map;
}

export async function getAvailableSlots() {
  const dates = getNext14Days();
  const rows = await fetchAvailability(dates);
  return buildSlotMap(dates, rows);
}
