import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { assertAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const denied = assertAdmin(req);
  if (denied) return denied;
  const db = getServiceClient();
  const { data, error } = await db
    .from("bookings")
    .select("*")
    .order("service_date", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bookings: data });
}

export async function PATCH(req: NextRequest) {
  const denied = assertAdmin(req);
  if (denied) return denied;

  const body = await req.json();
  const db = getServiceClient();

  // Reschedule a single booking (drag-to-reschedule from AdminCalendar)
  if (body.id && body.service_date && body.service_time) {
    const { error } = await db
      .from("bookings")
      .update({ service_date: body.service_date, service_time: body.service_time })
      .eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Batch status update
  const { ids, status } = body;
  if (!Array.isArray(ids) || !ids.length)
    return NextResponse.json({ error: "No ids" }, { status: 400 });
  const VALID_STATUSES = ["pending", "batched", "confirmed", "cancelled"] as const;
  if (!VALID_STATUSES.includes(status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const { error } = await db.from("bookings").update({ status }).in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
