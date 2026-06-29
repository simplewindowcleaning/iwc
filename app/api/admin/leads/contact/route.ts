import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { assertAdmin } from "@/lib/admin";
import twilio from "twilio";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const deny = assertAdmin(req);
  if (deny) return deny;

  const { booking_id, action } = await req.json();
  if (!booking_id || !action) return NextResponse.json({ error: "booking_id and action required" }, { status: 400 });

  const supabase = getServiceClient();

  if (action === "confirm") {
    const { error } = await supabase.from("bookings").update({ status: "confirmed" }).eq("id", booking_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "contact") {
    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("first_name, phone, address, service_date, window_count")
      .eq("id", booking_id)
      .single();

    if (fetchErr || !booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const { error: updateErr } = await supabase
      .from("bookings")
      .update({ status: "lead_pending" })
      .eq("id", booking_id);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    if (booking.phone) {
      const sid   = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from  = process.env.TWILIO_FROM;
      if (sid && token && from) {
        const digits = booking.phone.replace(/\D/g, "");
        const e164 = digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith("1") ? `+${digits}` : null;
        if (e164) {
          const name = booking.first_name ? `, ${booking.first_name}` : "";
          const date = new Date(booking.service_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          const body = `Hi${name}! Just a heads-up — your window cleaning appointment is ${date} at ${booking.address?.split(",")[0]}. Reply YES to confirm your spot and we'll hold it. Otherwise it may open up soon. — Simple Windows`;
          try {
            const client = twilio(sid, token);
            await client.messages.create({ body, from, to: e164 });
          } catch {
            // SMS failed but status still updated — non-fatal
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
