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

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function fetchGmailBatch(
  token: string,
  items: { id: string }[],
  withSubject: boolean,
  delayMs: number
): Promise<EmailMessage[]> {
  const messages: EmailMessage[] = [];
  const headers = withSubject
    ? "metadataHeaders=From&metadataHeaders=Date&metadataHeaders=Subject"
    : "metadataHeaders=From&metadataHeaders=Date";

  // Each sub-request in the batch counts as 1 query against the 15,000 QPM limit.
  // With chunks of 25 and a 500ms delay we stay well under 250 QPS.
  const CHUNK = 25;

  for (let i = 0; i < items.length; i += CHUNK) {
    if (i > 0 && delayMs > 0) await sleep(delayMs);
    const chunk = items.slice(i, i + CHUNK);
    const batchBody = chunk.map((m, j) => [
      `--batch_boundary`,
      `Content-Type: application/http`,
      `Content-ID: <${j}>`,
      ``,
      `GET /gmail/v1/users/me/messages/${m.id}?format=metadata&${headers} HTTP/1.1`,
      ``,
    ].join("\r\n")).join("\r\n") + "\r\n--batch_boundary--";

    // Retry up to 3 times on rate-limit errors with exponential backoff
    let batchRes: Response | null = null;
    let rateLimited = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await sleep(1500 * Math.pow(2, attempt));
      batchRes = await fetch("https://www.googleapis.com/batch/gmail/v1", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/mixed; boundary=batch_boundary",
        },
        body: batchBody,
      });
      if (batchRes.status !== 429 && batchRes.status !== 403) { rateLimited = false; break; }
      rateLimited = true;
    }
    // If still rate-limited after retries, return what we have so far (partial results)
    if (rateLimited || !batchRes) break;

    const raw = await batchRes.text();
    const parts = raw.split(/--[^\r\n]+/).filter(p => p.includes("{"));
    for (const part of parts) {
      const jsonMatch = part.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;
      try {
        const msg = JSON.parse(jsonMatch[0]);
        if (!msg.id) continue;
        const hdrs: { name: string; value: string }[] = msg.payload?.headers ?? [];
        const get = (n: string) => hdrs.find(h => h.name.toLowerCase() === n.toLowerCase())?.value ?? "";
        const from = get("From");
        const date = get("Date");
        const subject = get("Subject");
        const emailMatch = from.match(/<([^>]+)>/) ?? from.match(/(\S+@\S+)/);
        const nameMatch = from.match(/^([^<]+)</);
        messages.push({
          id: msg.id,
          subject,
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
  return messages;
}

export async function fetchGmailMessages(token: string, limit = 5_000): Promise<EmailMessage[]> {
  const messages: EmailMessage[] = [];
  let pageToken: string | undefined;

  while (messages.length < limit) {
    // Use q:"in:inbox" to exclude trashed/moved emails from results
    const params = new URLSearchParams({
      maxResults: "500",
      q: "in:inbox",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const listRes = await gFetch(`/messages?${params}`, token);
    const listData = await listRes.json();
    const items: { id: string }[] = (listData.messages ?? []).slice(0, limit - messages.length);
    if (items.length === 0) break;

    // 500ms delay between chunks of 25 → ~50 QPS, well under the 250 QPS limit
    const batch = await fetchGmailBatch(token, items, false, 500);
    messages.push(...batch);

    pageToken = listData.nextPageToken;
    if (!pageToken) break;
  }

  return messages;
}

/** Rate-limited fetch with subjects — for intelligence analysis. */
export async function fetchGmailMessagesLimited(token: string, limit: number): Promise<EmailMessage[]> {
  const params = new URLSearchParams({ maxResults: String(Math.min(limit, 500)), labelIds: "INBOX" });
  const listRes = await gFetch(`/messages?${params}`, token);
  const listData = await listRes.json();
  const items: { id: string }[] = (listData.messages ?? []).slice(0, limit);
  if (items.length === 0) return [];
  // 500ms delay between chunks of 25 to stay within rate limits
  return fetchGmailBatch(token, items, true, 500);
}

/** Move messages to Trash — works with gmail.modify scope. */
export async function batchDeleteGmailMessages(
  token: string,
  ids: string[]
): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;

  // Use batchModify to add TRASH label and remove INBOX — no permanent delete scope needed
  for (let i = 0; i < ids.length; i += 1000) {
    const chunk = ids.slice(i, i + 1000);
    try {
      const res = await fetch(`${BASE}/messages/batchModify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ids: chunk, addLabelIds: ["TRASH"], removeLabelIds: ["INBOX"] }),
      });
      if (res.ok || res.status === 204) {
        deleted += chunk.length;
      } else {
        const body = await res.text().catch(() => "");
        console.error(`Gmail trash ${res.status}: ${body}`);
        failed += chunk.length;
      }
    } catch (e) {
      console.error("Gmail trash error:", e);
      failed += chunk.length;
    }
  }

  return { deleted, failed };
}

// ── Label (folder) operations ────────────────────────────────────────────────

export async function listGmailLabels(token: string): Promise<{ id: string; name: string }[]> {
  const res = await gFetch("/labels", token);
  const data = await res.json();
  return data.labels ?? [];
}

export async function createGmailLabel(token: string, name: string): Promise<string> {
  const res = await gFetch("/labels", token, {
    method: "POST",
    body: JSON.stringify({ name, labelListVisibility: "labelShow", messageListVisibility: "show" }),
  });
  const data = await res.json();
  return data.id as string;
}

export async function getOrCreateGmailLabel(token: string, name: string): Promise<string> {
  const labels = await listGmailLabels(token);
  const existing = labels.find(l => l.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing.id;
  return createGmailLabel(token, name);
}

/** Apply a label and remove from INBOX — Gmail's equivalent of "move to folder". */
export async function moveGmailMessagesToLabel(
  token: string,
  messageIds: string[],
  labelId: string
): Promise<{ moved: number; failed: number }> {
  let moved = 0;
  let failed = 0;

  // Gmail batchModify supports up to 1000 IDs per request
  for (let i = 0; i < messageIds.length; i += 1000) {
    const chunk = messageIds.slice(i, i + 1000);
    try {
      const res = await fetch(`${BASE}/messages/batchModify`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ids: chunk, addLabelIds: [labelId], removeLabelIds: ["INBOX"] }),
      });
      if (res.ok || res.status === 204) {
        moved += chunk.length;
      } else {
        const body = await res.text().catch(() => "");
        console.error(`Gmail batchModify ${res.status}: ${body}`);
        failed += chunk.length;
      }
    } catch (e) {
      console.error("Gmail batchModify error:", e);
      failed += chunk.length;
    }
  }

  return { moved, failed };
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
