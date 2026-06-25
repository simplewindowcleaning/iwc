import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { assertAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

let cachedSystem: string | null = null;
function getSystem(): string {
  if (!cachedSystem) {
    cachedSystem = readFileSync(join(process.cwd(), "lib/admin-secretary.md"), "utf-8");
  }
  return cachedSystem;
}

export async function POST(req: NextRequest) {
  const authError = assertAdmin(req);
  if (authError) return authError;

  try {
    const { messages } = await req.json();
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: getSystem(),
      messages,
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("Secretary API error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
