import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import twilio from "twilio";

async function sendReviewSMS(to: string, firstName: string | null, reviewUrl: string) {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_FROM;
  if (!sid || !token || !from) return;

  const name = firstName ? `, ${firstName}` : "";
  const body = `Hi${name}! Thanks for choosing Simple Windows today. How'd we do? Leave us a quick review (takes 30 sec) and we'll send you a discount on your next visit:\n${reviewUrl}`;

  const client = twilio(sid, token);
  await client.messages.create({ body, from, to });
}

export async function POST(req: NextRequest) {
  try {
    const { booking_id, worker_notes } = await req.json();
    if (!worker_notes?.trim()) {
      return NextResponse.json({ error: "worker_notes required" }, { status: 400 });
    }

    const db = getServiceClient();

    const review_token = crypto.randomUUID();
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ladderlesswindows.com";
    const review_url = `${site}/review/${review_token}`;

    let booking: { phone: string | null; first_name: string | null } | null = null;
    if (booking_id) {
      const { data } = await db
        .from("bookings")
        .select("phone, first_name, service_date")
        .eq("id", booking_id)
        .single();
      booking = data;
      if (booking) {
        await db.from("bookings").update({ status: "completed" }).eq("id", booking_id);
      }
    }

    const { error } = await db.from("gig_completions").insert({
      ...(booking_id ? { booking_id } : {}),
      worker_notes: worker_notes.trim(),
      review_token,
      customer_phone: booking?.phone ?? null,
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (booking?.phone) {
      sendReviewSMS(booking.phone, booking.first_name, review_url).catch(() => {});
    }

    return NextResponse.json({ review_token, review_url });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
