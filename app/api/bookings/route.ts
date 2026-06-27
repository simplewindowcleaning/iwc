import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { MIN_BOOKING_DATE } from "@/lib/availability";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { service_date, service_time, window_count, address, first_name, last_name,
          phone, email, notes, needs_estimate, estimate_deadline, total_price } = body;

  if (!service_date || !service_time || !window_count) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Reject dates before the soft-launch minimum
  if (service_date < MIN_BOOKING_DATE) {
    return NextResponse.json({ error: "Bookings not yet open for that date" }, { status: 400 });
  }

  // Reject same-day bookings where the slot has already passed (2hr buffer)
  const nowUtc = new Date();
  const todayStr = nowUtc.toISOString().split("T")[0];
  if (service_date === todayStr) {
    const [slotH, slotM] = service_time.split(":").map(Number);
    const slotMinutes = slotH * 60 + slotM;
    const nowMinutes = nowUtc.getUTCHours() * 60 + nowUtc.getUTCMinutes();
    if (slotMinutes <= nowMinutes + 120) {
      return NextResponse.json({ error: "Not enough advance notice for same-day booking" }, { status: 400 });
    }
  }

  const db = getServiceClient();
  const { data, error } = await db.from("bookings").insert({
    service_date, service_time, window_count,
    address: address || null,
    first_name: first_name || null,
    last_name: last_name || null,
    phone: phone || null,
    email: email || null,
    notes: notes || null,
    needs_estimate: Boolean(needs_estimate),
    estimate_deadline: estimate_deadline || null,
    total_price,
    status: "pending",
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data?.id });
}
