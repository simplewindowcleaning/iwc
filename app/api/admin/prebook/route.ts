import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { assertAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

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

  const oneYearOut = new Date(original.service_date);
  oneYearOut.setFullYear(oneYearOut.getFullYear() + 1);
  const prebookDate = oneYearOut.toISOString().split("T")[0];

  const { data: created, error: insertErr } = await supabase
    .from("bookings")
    .insert({
      first_name:   original.first_name,
      last_name:    original.last_name,
      address:      original.address,
      phone:        original.phone,
      email:        original.email,
      service_date: prebookDate,
      service_time: original.service_time ?? "09:00",
      window_count,
      total_price,
      status:       "prebooked",
      notes:        `Auto-prebooked from session ${original.service_date} (booking ${booking_id})`,
    })
    .select("id, service_date")
    .single();

  if (insertErr || !created) {
    return NextResponse.json({ error: insertErr?.message ?? "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({ id: created.id, service_date: created.service_date });
}
