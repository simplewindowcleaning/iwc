import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { assertAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

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

// 1–5 windows = 2h, every 5 over that adds 1h
function durationHours(windowCount: number): number {
  return 2 + Math.ceil(Math.max(0, windowCount - 5) / 5);
}

export async function POST(req: NextRequest) {
  const deny = assertAdmin(req);
  if (deny) return deny;

  const { booking_id, window_count, total_price } = await req.json();
  const supabase = getServiceClient();

  const { data: original, error: fetchErr } = await supabase
    .from("bookings")
    .select("first_name, last_name, address, phone, email, service_date, service_time")
    .eq("id", booking_id)
    .single();

  if (fetchErr || !original) {
    return NextResponse.json({ error: "Original booking not found" }, { status: 404 });
  }

  const customerZip = extractZip(original.address);

  // Target: exactly 1 year from original booking
  const oneYearOut = new Date(original.service_date);
  oneYearOut.setFullYear(oneYearOut.getFullYear() + 1);
  const targetDate = oneYearOut.toISOString().split("T")[0];

  // Fetch bookings in a 90-day window ending at targetDate
  const windowStart = shiftDate(targetDate, -90);
  const { data: existing } = await supabase
    .from("bookings")
    .select("service_date, address, status")
    .gte("service_date", windowStart)
    .lte("service_date", targetDate)
    .not("status", "in", '("cancelled")');

  // Build set of dates blocked for this customer (different zip, or hold)
  const blockedDates = new Set<string>();
  for (const b of (existing ?? [])) {
    const bZip = extractZip(b.address);
    const sameZip = customerZip && bZip && bZip === customerZip;
    if (!sameZip || b.status === "hold") {
      blockedDates.add(b.service_date);
    }
  }

  // Scan backward from targetDate for the nearest available date
  let prebookDate = targetDate;
  for (let i = 0; i < 90; i++) {
    const candidate = shiftDate(targetDate, -i);
    if (!blockedDates.has(candidate)) {
      prebookDate = candidate;
      break;
    }
  }

  const holdTime = original.service_time ?? "09:00";
  const duration = durationHours(window_count ?? 1);
  const baseNote = `Auto-prebooked from session ${original.service_date} (booking ${booking_id}) · ${window_count}w · ${duration}h`;

  // Hold: day before
  await supabase.from("bookings").insert({
    first_name:     original.first_name,
    last_name:      original.last_name,
    address:        original.address,
    phone:          original.phone,
    email:          original.email,
    service_date:   shiftDate(prebookDate, -1),
    service_time:   holdTime,
    window_count:   0,
    total_price:    0,
    status:         "hold",
    needs_estimate: false,
    notes:          `HOLD for prebook ${prebookDate}`,
  });

  // Main prebook
  const { data: created, error: insertErr } = await supabase
    .from("bookings")
    .insert({
      first_name:     original.first_name,
      last_name:      original.last_name,
      address:        original.address,
      phone:          original.phone,
      email:          original.email,
      service_date:   prebookDate,
      service_time:   holdTime,
      window_count,
      total_price,
      status:         "prebooked",
      needs_estimate: false,
      notes:          baseNote,
    })
    .select("id, service_date")
    .single();

  if (insertErr || !created) {
    return NextResponse.json({ error: insertErr?.message ?? "Insert failed" }, { status: 500 });
  }

  // Hold: day after
  await supabase.from("bookings").insert({
    first_name:     original.first_name,
    last_name:      original.last_name,
    address:        original.address,
    phone:          original.phone,
    email:          original.email,
    service_date:   shiftDate(prebookDate, 1),
    service_time:   holdTime,
    window_count:   0,
    total_price:    0,
    status:         "hold",
    needs_estimate: false,
    notes:          `HOLD for prebook ${prebookDate}`,
  });

  return NextResponse.json({ id: created.id, service_date: created.service_date });
}
