import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET() {
  const db = getServiceClient();
  const { data, error } = await db
    .from("bookings")
    .select("id, service_date, service_time, address, first_name, last_name, phone, email, notes, status, window_count, total_price")
    .in("status", ["pending", "batched", "lead"])
    .order("service_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ gigs: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { address, phone, customer_name, email, notes, service_date, status, window_count, total_price } = body;

  if (!address?.trim() || !phone?.trim()) {
    return NextResponse.json({ error: "address and phone required" }, { status: 400 });
  }

  const nameParts = (customer_name ?? "").trim().split(" ");
  const firstName = nameParts[0] || null;
  const lastName = nameParts.slice(1).join(" ") || null;

  const db = getServiceClient();
  const insertPayload: Record<string, unknown> = {
    address: address.trim(),
    phone: phone.trim(),
    email: email?.trim() || null,
    first_name: firstName,
    last_name: lastName,
    notes: notes?.trim() ?? null,
    service_date: service_date || new Date().toISOString().slice(0, 10),
    service_time: "09:00",
    window_count: window_count ?? 0,
    total_price: total_price ?? 0,
    status: status ?? "pending",
  };

  let { data, error } = await db.from("bookings").insert(insertPayload).select("id").single();

  // Schema cache sometimes lags on email — retry without it if needed
  if (error?.message?.includes("email")) {
    const { email: _email, ...withoutEmail } = insertPayload;
    ({ data, error } = await db.from("bookings").insert(withoutEmail).select("id").single());
    // Patch email in separately once the row exists
    if (!error && data?.id && email?.trim()) {
      await db.from("bookings").update({ email: email.trim() }).eq("id", data.id);
    }
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data?.id, ok: true });
}

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

  const db = getServiceClient();
  const { error } = await db.from("bookings").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
