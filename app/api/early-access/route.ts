import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("early_signups")
    .upsert({ email: email.toLowerCase().trim() }, { onConflict: "email" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
