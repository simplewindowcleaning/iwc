import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { assertAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const deny = assertAdmin(req);
  if (deny) return deny;

  const supabase = getServiceClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: checkin } = await supabase
    .from("checkin_requests")
    .select("id, booking_id, tech_name, status, created_at")
    .in("status", ["pending", "confirmed"])
    .gte("created_at", todayStart.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!checkin) return NextResponse.json({ checkin: null });

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, first_name, last_name, address, service_date, service_time, window_count, total_price, status")
    .eq("id", checkin.booking_id)
    .single();

  return NextResponse.json({ checkin: { ...checkin, booking: booking ?? null } });
}
