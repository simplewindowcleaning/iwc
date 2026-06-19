import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin";
import { getServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const denied = assertAdmin(req);
  if (denied) return denied;
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .select("code, notes, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ codes: data ?? [] });
}

export async function POST(req: NextRequest) {
  const denied = assertAdmin(req);
  if (denied) return denied;
  const { code, notes } = await req.json() as { code: string; notes?: string };
  const clean = code?.trim().toUpperCase();
  if (!clean) return NextResponse.json({ error: "Code required" }, { status: 400 });
  const supabase = getServiceClient();
  const { error } = await supabase.from("promo_codes").insert({ code: clean, notes: notes?.trim() || null });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const denied = assertAdmin(req);
  if (denied) return denied;
  const { code } = await req.json() as { code: string };
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 });
  const supabase = getServiceClient();
  const { error } = await supabase.from("promo_codes").delete().eq("code", code);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
