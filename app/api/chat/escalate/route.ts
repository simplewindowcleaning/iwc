import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import twilio from "twilio";

export const dynamic = "force-dynamic";

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

async function sendSMS(name: string, phone: string, summary: string) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM;
  const to    = process.env.OWNER_PHONE;
  if (!sid || !token || !from || !to) return;

  const client = twilio(sid, token);
  const body = `Simple Windows Chat — ${name} (${phone}) wants to talk.\n"${summary}"`;
  await client.messages.create({ body, from, to });
}

export async function POST(req: NextRequest) {
  const { name, phone, summary, transcript } = await req.json();

  const db = getServiceClient();
  const { error } = await db.from("chat_escalations").insert({
    name,
    phone,
    summary: summary ?? null,
    transcript: transcript ?? null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders(req) });

  try {
    await sendSMS(name ?? "Unknown", phone ?? "no phone", summary ?? "");
  } catch (err) {
    console.error("Twilio error:", err);
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders(req) });
}

export async function GET() {
  const db = getServiceClient();
  const { data, error } = await db
    .from("chat_escalations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
