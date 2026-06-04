import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchInboxMessages } from "@/lib/graph";
import { fetchGmailMessages } from "@/lib/gmail";
import { checkRateLimit } from "@/lib/rateLimit";
import type { SenderGroup } from "@/types";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: max 5 scans per user per 2 minutes
  const userKey = `scan:${session.user?.email ?? "unknown"}`;
  const { allowed, retryAfterMs } = checkRateLimit(userKey, 5, 2 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: `Too many requests. Please wait ${Math.ceil(retryAfterMs / 1000)} seconds before scanning again.` },
      { status: 429 }
    );
  }

  try {
    const messages = session.provider === "google"
      ? await fetchGmailMessages(session.accessToken)
      : await fetchInboxMessages(session.accessToken);

    const map = new Map<string, SenderGroup>();
    for (const msg of messages) {
      const email = msg.sender?.emailAddress?.address?.toLowerCase() ?? "unknown";
      const name = msg.sender?.emailAddress?.name ?? email;

      if (!map.has(email)) {
        map.set(email, { email, name, count: 0, latestDate: msg.receivedDateTime, messageIds: [] });
      }

      const g = map.get(email)!;
      g.count++;
      g.messageIds.push(msg.id);
      if (msg.receivedDateTime > g.latestDate) g.latestDate = msg.receivedDateTime;
    }

    const senders = [...map.values()].sort((a, b) => b.count - a.count);
    return NextResponse.json({ senders, total: messages.length });
  } catch (e) {
    console.error("Emails fetch error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "Failed to fetch emails. Please sign out and sign back in." }, { status: 500 });
  }
}
