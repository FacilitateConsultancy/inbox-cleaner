import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchUnsubscribeInfo } from "@/lib/graph";

export interface UnsubscribeResult {
  method: "one-click" | "link" | "mailto" | "none";
  success?: boolean;      // set when method === "one-click"
  url?: string;           // set when method === "link" | "mailto"
  error?: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const messageId: string = body.messageId ?? "";
  if (!messageId) {
    return NextResponse.json({ error: "No messageId" }, { status: 400 });
  }

  const info = await fetchUnsubscribeInfo(session.accessToken, messageId);

  // ── RFC 8058 one-click (best) ─────────────────────────────────────────
  if (info.postUrl) {
    try {
      const res = await fetch(info.postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "List-Unsubscribe=One-Click",
        // Follow redirects, short timeout
        signal: AbortSignal.timeout(10_000),
      });
      // 2xx or 3xx all count as success — most senders return 200/302
      const success = res.status < 400;
      const result: UnsubscribeResult = { method: "one-click", success };
      return NextResponse.json(result);
    } catch {
      // POST failed — fall through to link method
    }
  }

  // ── HTTPS link (open in tab) ─────────────────────────────────────────
  if (info.linkUrl) {
    const result: UnsubscribeResult = { method: "link", url: info.linkUrl };
    return NextResponse.json(result);
  }

  // ── mailto fallback ───────────────────────────────────────────────────
  if (info.mailtoUrl) {
    const result: UnsubscribeResult = { method: "mailto", url: info.mailtoUrl };
    return NextResponse.json(result);
  }

  // ── No unsubscribe mechanism found ────────────────────────────────────
  const result: UnsubscribeResult = { method: "none" };
  return NextResponse.json(result);
}
