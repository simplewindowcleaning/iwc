import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { getServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { phone, first_name, address, type } = await req.json();
  if (!phone) return NextResponse.json({ error: "phone required" }, { status: 400 });

  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM;
  if (!sid || !token || !from) return NextResponse.json({ ok: true });

  const digits = phone.replace(/\D/g, "");
  const e164 = digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith("1") ? `+${digits}` : null;
  if (!e164) return NextResponse.json({ error: "invalid phone" }, { status: 400 });

  // TCPA/Twilio: if this number belongs to a website booking, honor its consent
  // checkbox. Numbers with no booking record (walk-ups added in the worker app)
  // had consent collected verbally and are allowed through.
  const db = getServiceClient();
  const { data: recent } = await db
    .from("bookings")
    .select("phone, sms_consent")
    .not("phone", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);
  const match = (recent ?? []).find(b => (b.phone ?? "").replace(/\D/g, "").slice(-10) === digits.slice(-10));
  if (match && !match.sms_consent) {
    return NextResponse.json({ ok: true, skipped: "no_sms_consent" });
  }

  const name = first_name ? `, ${first_name}` : "";
  const body =
    type === "arrival"
      ? `Hi${name}! Your Simple Windows crew has arrived and is starting on your windows now. — Simple Windows`
      : type === "wrapping_up"
      ? `Hi${name}! Your windows are almost done — we'll be wrapping up and out of your way shortly. — Simple Windows`
      : type === "finished"
      ? `Hi${name}! All done! Your windows are clean. Thank you for choosing Simple Windows! — Simple Windows`
      : `Hi${name}! Your Simple Windows crew is on the way to ${address}. See you shortly! — Simple Windows`;

  try {
    const client = twilio(sid, token);
    await client.messages.create({ body: `${body} Reply STOP to opt out.`, from, to: e164 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "SMS failed" }, { status: 500 });
  }
}
