import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: NextRequest) {
  const { phone, first_name, address } = await req.json();
  if (!phone) return NextResponse.json({ error: "phone required" }, { status: 400 });

  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM;
  if (!sid || !token || !from) return NextResponse.json({ ok: true });

  const digits = phone.replace(/\D/g, "");
  const e164 = digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith("1") ? `+${digits}` : null;
  if (!e164) return NextResponse.json({ error: "invalid phone" }, { status: 400 });

  const name = first_name ? `, ${first_name}` : "";
  const body = `Hi${name}! Your Simple Windows crew is on the way to ${address}. See you shortly! — Simple Windows`;

  try {
    const client = twilio(sid, token);
    await client.messages.create({ body, from, to: e164 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "SMS failed" }, { status: 500 });
  }
}
