import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchInboxMessages } from "@/lib/graph";
import { fetchGmailMessagesLimited } from "@/lib/gmail";
import { analyseMessages } from "@/lib/classify";
import type { SenderGroup } from "@/types";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Client sends its full sender list so we can expand message IDs
  const body = await req.json().catch(() => ({}));
  const allSenders: SenderGroup[] = body.senders ?? [];

  try {
    // Sample messages for subject-based classification
    const messages = session.provider === "google"
      ? await fetchGmailMessagesLimited(session.accessToken, 500)
      : await fetchInboxMessages(session.accessToken);

    const raw = messages.map(m => ({
      id: m.id,
      subject: m.subject ?? "",
      senderEmail: m.sender?.emailAddress?.address?.toLowerCase() ?? "unknown",
      senderName: m.sender?.emailAddress?.name ?? "Unknown",
    }));

    // Also synthesise "messages" from the full sender list so even senders
    // not in the 500-message sample get classified via sender-name/email hints.
    const senderSynthetic = allSenders.map(s => ({
      id: s.messageIds[0] ?? "",
      subject: "",
      senderEmail: s.email.toLowerCase(),
      senderName: s.name,
    }));

    const combined = [...raw, ...senderSynthetic.filter(
      s => !raw.some(r => r.senderEmail === s.senderEmail)
    )];

    // Pass full sender data so rules cover ALL emails, not just the sample
    const fullSenders = allSenders.map(s => ({
      email: s.email.toLowerCase(),
      name: s.name,
      messageIds: s.messageIds,
    }));

    const result = analyseMessages(combined, fullSenders.length > 0 ? fullSenders : undefined);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
