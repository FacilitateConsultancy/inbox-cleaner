import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchInboxMessages } from "@/lib/graph";
import { fetchGmailMessagesLimited } from "@/lib/gmail";
import { analyseMessages } from "@/lib/classify";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Gmail uses a smaller limit + delays to avoid rate limit errors
    const messages = session.provider === "google"
      ? await fetchGmailMessagesLimited(session.accessToken, 500)
      : await fetchInboxMessages(session.accessToken);

    const raw = messages.map(m => ({
      id: m.id,
      subject: m.subject ?? "",
      senderEmail: m.sender?.emailAddress?.address?.toLowerCase() ?? "unknown",
      senderName: m.sender?.emailAddress?.name ?? "Unknown",
    }));

    const result = analyseMessages(raw);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
