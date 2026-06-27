import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { id, pin } = await req.json();
  if (!id || !pin) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("staff_profiles")
    .select("id, name, role, pin")
    .eq("id", id)
    .eq("active", true)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (data.pin !== pin) return NextResponse.json({ error: "Wrong PIN" }, { status: 401 });

  return NextResponse.json({ ok: true, name: data.name, role: data.role });
}
