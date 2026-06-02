import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { batchDeleteMessages } from "@/lib/graph";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const ids: string[] = Array.isArray(body.messageIds) ? body.messageIds : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "No message IDs provided" }, { status: 400 });
  }

  try {
    const result = await batchDeleteMessages(session.accessToken, ids);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
