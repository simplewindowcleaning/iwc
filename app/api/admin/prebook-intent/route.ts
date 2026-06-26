import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { assertAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Run once in Supabase SQL editor to create the intents table:
//
// CREATE TABLE IF NOT EXISTS prebook_intents (
//   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
//   booking_id uuid UNIQUE REFERENCES bookings(id),
//   next_visit_price numeric NOT NULL,
//   created_at timestamptz DEFAULT now()
// );

export async function POST(req: NextRequest) {
  const deny = assertAdmin(req);
  if (deny) return deny;

  const { booking_id, next_visit_price } = await req.json();
  if (!booking_id || next_visit_price == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Upsert so toggling off + on doesn't create duplicates
  const { error } = await supabase
    .from("prebook_intents")
    .upsert({ booking_id, next_visit_price }, { onConflict: "booking_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
