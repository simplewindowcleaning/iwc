import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin";
import { getServiceClient } from "@/lib/supabase";

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
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
