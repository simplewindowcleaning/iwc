import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("staff_profiles")
    .select("id, name, photo_url, role")
    .eq("active", true)
    .order("provider_number");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workers: data });
}
