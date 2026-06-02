import type { EmailMessage } from "@/types";

const BASE = "https://graph.microsoft.com/v1.0";

async function gFetch(
  path: string,
  token: string,
  opts: RequestInit = {}
): Promise<Response> {
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
    throw new Error(`Graph ${res.status}: ${body}`);
  }
  return res;
}

export async function fetchInboxMessages(
  token: string
): Promise<EmailMessage[]> {
  const messages: EmailMessage[] = [];
  let url =
    `/me/mailFolders/inbox/messages` +
    `?$select=id,subject,receivedDateTime,sender` +
    `&$top=100` +
    `&$orderby=receivedDateTime%20desc`;

  while (url && messages.length < 2000) {
    const res = await gFetch(url, token);
    const data = await res.json();
    messages.push(...(data.value ?? []));
    url = data["@odata.nextLink"] ?? null;
  }

  return messages;
}

export async function batchDeleteMessages(
  token: string,
  ids: string[]
): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;

  for (let i = 0; i < ids.length; i += 20) {
    const chunk = ids.slice(i, i + 20);
    const body = {
      requests: chunk.map((id, j) => ({
        id: String(j),
        method: "DELETE",
        url: `/me/messages/${id}`,
      })),
    };

    const res = await fetch(`${BASE}/$batch`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      failed += chunk.length;
      continue;
    }

    const data = await res.json();
    for (const r of data.responses ?? []) {
      r.status >= 200 && r.status < 300 ? deleted++ : failed++;
    }
  }

  return { deleted, failed };
}

/** Fetch the List-Unsubscribe URL from the most recent message of a sender. */
export interface UnsubscribeInfo {
  /** RFC 8058 one-click POST URL — most reliable */
  postUrl: string | null;
  /** Fallback HTTPS link to open in browser */
  linkUrl: string | null;
  /** mailto: fallback */
  mailtoUrl: string | null;
}

export async function fetchUnsubscribeInfo(
  token: string,
  messageId: string
): Promise<UnsubscribeInfo> {
  const empty: UnsubscribeInfo = { postUrl: null, linkUrl: null, mailtoUrl: null };
  try {
    const res = await gFetch(
      `/me/messages/${messageId}?$select=internetMessageHeaders`,
      token
    );
    const data = await res.json();
    const headers: { name: string; value: string }[] =
      data.internetMessageHeaders ?? [];

    const get = (name: string) =>
      headers.find((h) => h.name.toLowerCase() === name)?.value ?? null;

    const listUnsub     = get("list-unsubscribe");
    const listUnsubPost = get("list-unsubscribe-post");

    if (!listUnsub) return empty;

    // Extract HTTPS URL from angle brackets
    const httpsMatch  = listUnsub.match(/<(https?:\/\/[^>]+)>/i);
    const mailtoMatch = listUnsub.match(/<(mailto:[^>]+)>/i);

    // RFC 8058: one-click only when List-Unsubscribe-Post is present
    const supportsOneClick =
      !!listUnsubPost &&
      listUnsubPost.toLowerCase().includes("list-unsubscribe=one-click");

    return {
      postUrl:   supportsOneClick && httpsMatch ? httpsMatch[1] : null,
      linkUrl:   httpsMatch  ? httpsMatch[1]  : null,
      mailtoUrl: mailtoMatch ? mailtoMatch[1] : null,
    };
  } catch {
    return empty;
  }
}
