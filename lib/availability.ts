import { supabase } from "./supabase";

export const FALLBACK_DATE = "2026-09-06";
export const FALLBACK_TIME = "10:00";
export const MIN_BOOKING_DATE = "2026-09-01";

export const SLOT_TIMES = ["08:00", "10:00", "12:00", "14:00", "16:00"];

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

export function getNextDays(n = 60): string[] {
  const days: string[] = [];
  const start = new Date(Math.max(Date.now(), new Date(MIN_BOOKING_DATE + "T00:00:00").getTime()));
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i <= n; i++) {
    const next = new Date(start);
    next.setDate(start.getDate() + i);
    days.push(next.toISOString().split("T")[0]);
  }
  if (!days.includes(FALLBACK_DATE)) days.push(FALLBACK_DATE);
  return days;
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function extractZip(address: string | null | undefined): string | null {
  if (!address) return null;
  const m = address.match(/\b(\d{5})\b/);
  return m ? m[1] : null;
}

async function fetchBookedSlots(dates: string[]): Promise<{ date: string; time: string; address: string | null; status: string }[]> {
  const { data } = await supabase
    .from("bookings")
    .select("service_date, service_time, address, status")
    .in("service_date", dates)
    .not("status", "in", '("cancelled")');
  return (data ?? []).map((r: { service_date: string; service_time: string; address: string | null; status: string }) => ({
    date: r.service_date,
    time: (r.service_time ?? "").slice(0, 5),
    address: r.address ?? null,
    status: r.status ?? "",
  }));
}

export async function fetchAvailability(dates: string[]) {
  try {
    const { data, error } = await supabase
      .from("availability")
      .select("date, time_slot, is_blocked")
      .in("date", dates);

    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.error("fetchAvailability failed:", err);
    return [];
  }
}

export function buildSlotMap(
  dates: string[],
  dbRows: { date: string; time_slot: string | null; is_blocked: boolean }[],
  fullyBlockedDates: Set<string> = new Set(),
  perDateBlockedTimes: Record<string, Set<string>> = {}
) {
  const map: Record<string, string[]> = {};

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  for (const date of dates) {
    if (fullyBlockedDates.has(date)) {
      map[date] = [];
      continue;
    }

    const blocked = new Set(
      dbRows
        .filter((r) => r.date === date && r.is_blocked)
        .map((r) => (r.time_slot ?? "").slice(0, 5))
    );

    const bookedTimes = perDateBlockedTimes[date];
    if (bookedTimes) {
      for (const t of bookedTimes) blocked.add(t);
    }

    let slots = SLOT_TIMES.filter((t) => !blocked.has(t));

    if (date === todayStr || date < MIN_BOOKING_DATE) {
      slots = [];
    }

    map[date] = slots;
  }
  return map;
}

export function formatDateFull(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatPhone(p: string): string {
  const d = p.replace(/\D/g, "");
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return p;
}

export async function getAvailableSlots(customerZip?: string) {
  const dates = getNextDays();
  const [rows, bookedSlots] = await Promise.all([
    fetchAvailability(dates),
    fetchBookedSlots(dates),
  ]);

  const fullyBlocked = new Set<string>();
  const perDateBlockedTimes: Record<string, Set<string>> = {};

  for (const slot of bookedSlots) {
    const isHold = slot.status === "hold";
    const bookingZip = extractZip(slot.address);
    const sameZip = !isHold && customerZip && bookingZip && customerZip === bookingZip;

    if (sameZip) {
      // Same zip: only block this specific time slot, open the rest of the day
      if (!perDateBlockedTimes[slot.date]) perDateBlockedTimes[slot.date] = new Set();
      if (slot.time) perDateBlockedTimes[slot.date].add(slot.time);
    } else {
      // Different zip (or unknown): block full day + adjacent days
      fullyBlocked.add(slot.date);
      fullyBlocked.add(shiftDate(slot.date, -1));
      fullyBlocked.add(shiftDate(slot.date, 1));
    }
  }

  return buildSlotMap(dates, rows, fullyBlocked, perDateBlockedTimes);
}
