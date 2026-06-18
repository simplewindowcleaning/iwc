import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { service_date, service_time, window_count, address, first_name, last_name,
          phone, email, notes, needs_estimate, estimate_deadline, total_price } = body;

  if (!service_date || !service_time || !window_count) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
