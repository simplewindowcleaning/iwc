import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin";
import { getServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const guard = assertAdmin(req);
  if (guard) return guard;

  try {
    const db = getServiceClient();
    const { data } = await db
      .from("early_signups")
      .select("*")
      .order("created_at", { ascending: false });

    return NextResponse.json({ signups: data ?? [] });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
