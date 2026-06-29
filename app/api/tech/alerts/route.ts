import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { assertAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const deny = assertAdmin(req);
  if (deny) return deny;

  const bookingId = req.nextUrl.searchParams.get("booking_id");
  const type = req.nextUrl.searchParams.get("type");
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const supabase = getServiceClient();

  let query = supabase
    .from("tech_alerts")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (bookingId) query = query.eq("booking_id", bookingId);
  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ alerts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const deny = assertAdmin(req);
  if (deny) return deny;

  const { booking_id, type, message, technician_name, customer_name, address } = await req.json();
  if (!booking_id || !type) return NextResponse.json({ error: "booking_id and type required" }, { status: 400 });

  const supabase = getServiceClient();

  // Fill in customer info from the booking if caller didn't provide it
  let resolvedName = customer_name ?? null;
  let resolvedAddress = address ?? null;
  if (!resolvedName || !resolvedAddress) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("first_name, last_name, address")
      .eq("id", booking_id)
      .single();
    if (booking) {
      resolvedName = resolvedName ?? ([booking.first_name, booking.last_name].filter(Boolean).join(" ") || null);
      resolvedAddress = resolvedAddress ?? booking.address ?? null;
    }
  }

  const { error } = await supabase.from("tech_alerts").insert({
    booking_id,
    type,
    message: message ?? null,
    technician_name: technician_name ?? null,
    customer_name: resolvedName,
    address: resolvedAddress,
    windows_added: 0,
    interiors_added: 0,
    screens_added: 0,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const deny = assertAdmin(req);
  if (deny) return deny;

  const { id } = await req.json();
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("tech_alerts")
    .update({ acknowledged: true })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
