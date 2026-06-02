import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchUnsubscribeInfo } from "@/lib/graph";
import { fetchGmailUnsubscribeInfo } from "@/lib/gmail";

export interface UnsubscribeResult {
  method: "one-click" | "link" | "mailto" | "none";
  success?: boolean;
  url?: string;
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

  const info = session.provider === "google"
    ? await fetchGmailUnsubscribeInfo(session.accessToken, messageId)
    : await fetchUnsubscribeInfo(session.accessToken, messageId);

  if (info.postUrl) {
    try {
      const res = await fetch(info.postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "List-Unsubscribe=One-Click",
        signal: AbortSignal.timeout(10_000),
      });
      const success = res.status < 400;
      const result: UnsubscribeResult = { method: "one-click", success };
      return NextResponse.json(result);
    } catch {
      // fall through
    }
  }

  if (info.linkUrl) {
    return NextResponse.json({ method: "link", url: info.linkUrl } as UnsubscribeResult);
  }

  if (info.mailtoUrl) {
    return NextResponse.json({ method: "mailto", url: info.mailtoUrl } as UnsubscribeResult);
  }

  return NextResponse.json({ method: "none" } as UnsubscribeResult);
}
