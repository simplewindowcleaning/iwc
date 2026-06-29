import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const today = new Date().toISOString().split("T")[0];

  // "prebooked" expires at 14 days; "lead_pending" (was texted) gets 1 extra day → 13 days
  const cutoff14 = shiftDate(today, 14);
  const cutoff13 = shiftDate(today, 13);

  const [prebookRes, leadRes] = await Promise.all([
    supabase.from("bookings").select("id, service_date, address")
      .eq("status", "prebooked").gte("service_date", today).lte("service_date", cutoff14),
    supabase.from("bookings").select("id, service_date, address")
      .eq("status", "lead_pending").gte("service_date", today).lte("service_date", cutoff13),
  ]);

  const expiring = [...(prebookRes.data ?? []), ...(leadRes.data ?? [])];
  if (!expiring.length) return NextResponse.json({ cancelled: 0 });

  const ids = expiring.map((b) => b.id);
  await supabase.from("bookings").update({ status: "cancelled" }).in("id", ids);

  // Cancel sibling HOLDs
  const holdDates: string[] = [];
  for (const b of expiring) {
    holdDates.push(shiftDate(b.service_date, -1));
    holdDates.push(shiftDate(b.service_date, 1));
  }
  const addresses = [...new Set(expiring.map((b) => b.address))];
  await supabase.from("bookings").update({ status: "cancelled" })
    .eq("status", "hold").in("service_date", holdDates).in("address", addresses);

  return NextResponse.json({ cancelled: expiring.length, releasedDates: expiring.map((b) => b.service_date) });
}
