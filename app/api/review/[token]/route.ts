import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from("gig_completions")
      .select(`
        worker_notes, customer_review_text, customer_stars, review_submitted_at, review_status,
        bookings ( first_name, service_date )
      `)
      .eq("review_token", params.token)
      .single();

    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { customer_review_text, customer_stars } = await req.json();

    if (!customer_review_text?.trim() || !customer_stars) {
      return NextResponse.json({ error: "Text and stars required" }, { status: 400 });
    }
    if (typeof customer_stars !== "number" || customer_stars < 1 || customer_stars > 5) {
      return NextResponse.json({ error: "Stars must be 1–5" }, { status: 400 });
    }

    const db = getServiceClient();

    // Idempotency: don't allow overwriting a submitted review
    const { data: existing } = await db
      .from("gig_completions")
      .select("review_submitted_at")
      .eq("review_token", params.token)
      .single();
    if (existing?.review_submitted_at) {
      return NextResponse.json({ error: "Review already submitted" }, { status: 409 });
    }

    const { error } = await db
      .from("gig_completions")
      .update({
        customer_review_text: customer_review_text.trim(),
        customer_stars,
        review_submitted_at: new Date().toISOString(),
      })
      .eq("review_token", params.token);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
