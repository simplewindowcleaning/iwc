import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { assertAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const deny = assertAdmin(req);
  if (deny) return deny;
  const db = getServiceClient();
  const { data, error } = await db.from("transactions").select("*").order("date", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transactions: data });
}

export async function POST(req: NextRequest) {
  const deny = assertAdmin(req);
  if (deny) return deny;
  const body = await req.json();
  const db = getServiceClient();
  // accepts single object or array (for bulk CSV import)
  const rows = Array.isArray(body) ? body : [body];
  const { data, error } = await db.from("transactions").insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transactions: data });
}

export async function DELETE(req: NextRequest) {
  const deny = assertAdmin(req);
  if (deny) return deny;
  const { id } = await req.json();
  const db = getServiceClient();
  const { error } = await db.from("transactions").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
