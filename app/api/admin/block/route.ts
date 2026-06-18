import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { assertAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const denied = assertAdmin(req);
  if (denied) return denied;
  const db = getServiceClient();
  const { data, error } = await db.from("availability").select("*").eq("is_blocked", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ blocked: data });
}

export async function POST(req: NextRequest) {
  const denied = assertAdmin(req);
  if (denied) return denied;
  const { date, time_slot, reason } = await req.json();
  const db = getServiceClient();
  const { error } = await db.from("availability").upsert(
    { date, time_slot: time_slot ?? null, is_blocked: true, reason: reason ?? "Blocked" },
    { onConflict: "date,time_slot" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const denied = assertAdmin(req);
  if (denied) return denied;
  const { id } = await req.json();
  const db = getServiceClient();
  const { error } = await db.from("availability").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
