import type { EmailMessage } from "@/types";

const BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

async function gFetch(path: string, token: string, opts: RequestInit = {}): Promise<Response> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gmail ${res.status}: ${body}`);
  }
  return res;
}

export async function fetchGmailMessages(token: string): Promise<EmailMessage[]> {
  const messages: EmailMessage[] = [];
  let pageToken: string | undefined;

  while (messages.length < 2000) {
    const params = new URLSearchParams({ maxResults: "500", labelIds: "INBOX" });
    if (pageToken) params.set("pageToken", pageToken);

    const listRes = await gFetch(`/messages?${params}`, token);
    const listData = await listRes.json();
    const items: { id: string }[] = listData.messages ?? [];
    if (items.length === 0) break;

    // Batch fetch metadata for up to 100 messages at a time
    for (let i = 0; i < items.length; i += 100) {
      const chunk = items.slice(i, i + 100);
      const batchBody = chunk.map((m, j) => [
        `--batch_boundary`,
        `Content-Type: application/http`,
        `Content-ID: <${j}>`,
        ``,
        `GET /gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Date HTTP/1.1`,
        ``,
      ].join("\r\n")).join("\r\n") + "\r\n--batch_boundary--";

      const batchRes = await fetch("https://www.googleapis.com/batch/gmail/v1", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/mixed; boundary=batch_boundary",
        },
        body: batchBody,
      });

      const raw = await batchRes.text();
      // Parse each part from the multipart response
      const parts = raw.split(/--[^\r\n]+/).filter(p => p.includes("{"));
      for (const part of parts) {
        const jsonMatch = part.match(/\{[\s\S]*\}/);
        if (!jsonMatch) continue;
        try {
          const msg = JSON.parse(jsonMatch[0]);
          if (!msg.id) continue;
          const headers: { name: string; value: string }[] = msg.payload?.headers ?? [];
          const get = (n: string) => headers.find(h => h.name.toLowerCase() === n.toLowerCase())?.value ?? "";
          const from = get("From");
          const date = get("Date");
          const emailMatch = from.match(/<([^>]+)>/) ?? from.match(/(\S+@\S+)/);
          const nameMatch = from.match(/^([^<]+)</);
          messages.push({
            id: msg.id,
            subject: "",
            receivedDateTime: date ? new Date(date).toISOString() : new Date().toISOString(),
            sender: {
              emailAddress: {
                name: nameMatch ? nameMatch[1].trim() : (emailMatch ? emailMatch[1] : from),
                address: emailMatch ? emailMatch[1] : from,
              },
            },
          });
        } catch {
          // skip malformed
        }
      }
    }

    pageToken = listData.nextPageToken;
    if (!pageToken) break;
  }

  return messages;
}

export async function batchDeleteGmailMessages(
  token: string,
  ids: string[]
): Promise<{ deleted: number; failed: number }> {
  // Gmail batch delete — max 1000 per request
  let deleted = 0;
  let failed = 0;

  for (let i = 0; i < ids.length; i += 1000) {
    const chunk = ids.slice(i, i + 1000);
    try {
      await gFetch("/messages/batchDelete", token, {
        method: "POST",
        body: JSON.stringify({ ids: chunk }),
      });
      deleted += chunk.length;
    } catch {
      failed += chunk.length;
    }
  }

  return { deleted, failed };
}

export interface GmailUnsubscribeInfo {
  postUrl: string | null;
  linkUrl: string | null;
  mailtoUrl: string | null;
}

export async function fetchGmailUnsubscribeInfo(
  token: string,
  messageId: string
): Promise<GmailUnsubscribeInfo> {
  const empty: GmailUnsubscribeInfo = { postUrl: null, linkUrl: null, mailtoUrl: null };
  try {
    const res = await gFetch(
      `/messages/${messageId}?format=metadata&metadataHeaders=List-Unsubscribe&metadataHeaders=List-Unsubscribe-Post`,
      token
    );
    const data = await res.json();
    const headers: { name: string; value: string }[] = data.payload?.headers ?? [];
    const get = (name: string) =>
      headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? null;

    const listUnsub = get("List-Unsubscribe");
    const listUnsubPost = get("List-Unsubscribe-Post");

    if (!listUnsub) return empty;

    const httpsMatch = listUnsub.match(/<(https?:\/\/[^>]+)>/i);
    const mailtoMatch = listUnsub.match(/<(mailto:[^>]+)>/i);
    const supportsOneClick =
      !!listUnsubPost &&
      listUnsubPost.toLowerCase().includes("list-unsubscribe=one-click");

    return {
      postUrl: supportsOneClick && httpsMatch ? httpsMatch[1] : null,
      linkUrl: httpsMatch ? httpsMatch[1] : null,
      mailtoUrl: mailtoMatch ? mailtoMatch[1] : null,
    };
  } catch {
    return empty;
  }
}
