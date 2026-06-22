import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin";
import { getServiceClient } from "@/lib/supabase";
import twilio from "twilio";

async function sendApprovalSMS(to: string, firstName: string | null, reviewUrl: string, discountCode: string | null) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM;
  if (!sid || !token || !from) return;

  const name = firstName ? `, ${firstName}` : "";
  const googleUrl = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL;

  let body = `Hi${name}! Your Simple Windows review is confirmed. `;
  if (googleUrl) {
    body += `Mind sharing it on Google too? Your text is pre-loaded:\n${reviewUrl}\n\n`;
  }
  if (discountCode) {
    body += `As a thank-you, use code ${discountCode} for a discount on your next visit.`;
  }

  const client = twilio(sid, token);
  await client.messages.create({ body, from, to });
}

export async function GET(req: NextRequest) {
  const guard = assertAdmin(req);
  if (guard) return guard;

  try {
    const db = getServiceClient();
    const { data } = await db
      .from("gig_completions")
      .select(`*, bookings ( first_name, last_name, service_date, phone )`)
      .order("created_at", { ascending: false });

    return NextResponse.json({ completions: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const guard = assertAdmin(req);
  if (guard) return guard;

  try {
    const { id, review_status } = await req.json();
    if (!id || !["approved", "rejected", "pending"].includes(review_status)) {
      return NextResponse.json({ error: "Invalid" }, { status: 400 });
    }

    const db = getServiceClient();
    const { error } = await db
      .from("gig_completions")
      .update({ review_status })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (review_status === "approved") {
      const { data: completion } = await db
        .from("gig_completions")
        .select("review_token, customer_phone, bookings ( first_name )")
        .eq("id", id)
        .single();

      if (completion?.customer_phone) {
        const { data: settings } = await db
          .from("site_settings")
          .select("value")
          .eq("key", "review_discount_code")
          .single();

        const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ladderlesswindows.com";
        const reviewUrl = `${site}/review/${completion.review_token}`;
        const bookingData = completion.bookings as unknown as { first_name: string | null } | null;
        const firstName = bookingData?.first_name ?? null;

        sendApprovalSMS(completion.customer_phone, firstName, reviewUrl, settings?.value ?? null).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
