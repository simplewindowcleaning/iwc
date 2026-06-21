import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { email, phone } = await req.json();

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updates: Record<string, string | null> = {};
  if (email !== undefined) updates.email = email || null;
  if (phone !== undefined) updates.phone = phone || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true });
  }

  const db = getServiceClient();
  const { error } = await db.from("bookings").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
