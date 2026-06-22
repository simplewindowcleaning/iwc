import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { booking_id, worker_notes } = await req.json();
    if (!worker_notes?.trim()) {
      return NextResponse.json({ error: "worker_notes required" }, { status: 400 });
    }

    const db = getServiceClient();

    const review_token = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ladderlesswindows.com";
    const review_url = `${site}/review/${review_token}`;

    // booking_id is optional — worker app may not have a linked Supabase booking yet
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

    return NextResponse.json({ review_token, review_url });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
