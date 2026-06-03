import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getOrCreateFolder, moveMessagesToFolder, batchDeleteMessages } from "@/lib/graph";
import { batchDeleteGmailMessages, getOrCreateGmailLabel, moveGmailMessagesToLabel } from "@/lib/gmail";
import type { IntelligenceRule } from "@/types";

interface ApplyResult {
  ruleId: string;
  action: string;
  category: string;
  moved?: number;
  deleted?: number;
  failed: number;
  error?: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const rules: (IntelligenceRule & { duplicateIds?: string[] })[] = body.rules ?? [];

  if (rules.length === 0) {
    return NextResponse.json({ error: "No rules provided" }, { status: 400 });
  }

  const isGoogle = session.provider === "google";
  const token = session.accessToken;
  const results: ApplyResult[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    const ids: string[] = rule.messageIds ?? [];
    // delete-duplicates only trashes the duplicate IDs, not all
    const deleteIds: string[] = rule.action === "delete-duplicates"
      ? (rule.duplicateIds ?? ids)
      : ids;

    const result: ApplyResult = {
      ruleId: rule.id,
      action: rule.action,
      category: rule.category,
      failed: 0,
    };

    try {
      if (rule.action === "move" && rule.folder) {
        if (isGoogle) {
          const labelId = await getOrCreateGmailLabel(token, rule.folder);
          const { moved, failed } = await moveGmailMessagesToLabel(token, ids, labelId);
          result.moved = moved;
          result.failed = failed;
        } else {
          const folderId = await getOrCreateFolder(token, rule.folder);
          const { moved, failed } = await moveMessagesToFolder(token, ids, folderId);
          result.moved = moved;
          result.failed = failed;
        }
      } else if (rule.action === "delete" || rule.action === "delete-duplicates" || rule.action === "unsubscribe") {
        // Outlook DELETE moves to Deleted Items (bin) — not permanent
        // Gmail batchModify adds TRASH label — not permanent
        if (isGoogle) {
          const { deleted, failed } = await batchDeleteGmailMessages(token, deleteIds);
          result.deleted = deleted;
          result.failed = failed;
        } else {
          const { deleted, failed } = await batchDeleteMessages(token, deleteIds);
          result.deleted = deleted;
          result.failed = failed;
        }
      }
      // "keep" — do nothing
    } catch (e) {
      result.failed = deleteIds.length;
      result.error = e instanceof Error ? e.message : "Unknown error";
      console.error(`Rule ${rule.id} (${rule.category}) failed:`, e);
    }

    results.push(result);
  }

  const totalMoved   = results.reduce((s, r) => s + (r.moved   ?? 0), 0);
  const totalDeleted = results.reduce((s, r) => s + (r.deleted ?? 0), 0);
  const totalFailed  = results.reduce((s, r) => s + r.failed, 0);

  return NextResponse.json({ results, totalMoved, totalDeleted, totalFailed });
}
