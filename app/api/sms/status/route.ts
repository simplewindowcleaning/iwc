import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// Twilio delivery status webhook — POSTs form-encoded lifecycle updates
// (queued/sent/delivered/undelivered/failed) for every outbound message.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "bad payload" }, { status: 400 });

  const db = getServiceClient();
  await db.from("sms_status_log").insert({
    message_sid: form.get("MessageSid")?.toString() ?? null,
    status: form.get("MessageStatus")?.toString() ?? null,
    to_phone: form.get("To")?.toString() ?? null,
    error_code: form.get("ErrorCode")?.toString() ?? null,
  });

  return new NextResponse(null, { status: 204 });
}
