import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const ALLOWED_ORIGINS = [
  "https://www.simplewindowcleaning.com",
  "https://simplewindowcleaning.com",
];

function corsHeaders(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(req: NextRequest) {
  const headers = corsHeaders(req);
  const body = await req.json().catch(() => ({}));
  const { email, phone, sms_consent, email_consent } = body;

  if (!email || !String(email).includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400, headers });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("early_signups")
    .upsert({
      email: String(email).toLowerCase().trim(),
      phone: phone ? String(phone).replace(/\D/g, "") : null,
      sms_consent: Boolean(sms_consent),
      email_consent: Boolean(email_consent),
    }, { onConflict: "email" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers });
  return NextResponse.json({ ok: true }, { headers });
}
