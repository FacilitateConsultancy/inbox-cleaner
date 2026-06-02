import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchInboxMessages } from "@/lib/graph";
import type { SenderGroup } from "@/types";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const messages = await fetchInboxMessages(session.accessToken);

    const map = new Map<string, SenderGroup>();
    for (const msg of messages) {
      const email =
        msg.sender?.emailAddress?.address?.toLowerCase() ?? "unknown";
      const name = msg.sender?.emailAddress?.name ?? email;

      if (!map.has(email)) {
        map.set(email, {
          email,
          name,
          count: 0,
          latestDate: msg.receivedDateTime,
          messageIds: [],
        });
      }

      const g = map.get(email)!;
      g.count++;
      g.messageIds.push(msg.id);
      if (msg.receivedDateTime > g.latestDate) {
        g.latestDate = msg.receivedDateTime;
      }
    }

    const senders = [...map.values()].sort((a, b) => b.count - a.count);
    return NextResponse.json({ senders, total: messages.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
