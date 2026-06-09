"use client";

import { useState, useMemo } from "react";
import type { SenderGroup } from "@/types";
import { classifySender, type SenderBucket } from "@/lib/senderClassify";

const B = {
  navy: "#1C213E", teal: "#3B8590", tealLight: "#7BC7CC",
  plum: "#4B2C42", muted: "#6B7299", border: "#DDE1ED",
  bg: "#F7F8FC", bgMid: "#ECEEF5", white: "#FFFFFF",
};

// ── Types ─────────────────────────────────────────────────────────────────────

type BucketAction = "keep" | "move" | "delete";

interface SenderState {
  email: string;
  name: string;
  count: number;
  messageIds: string[];
  bucket: SenderBucket;
  confidence: number;
  included: boolean;
  action: BucketAction;
  folder: string;
}

// ── Bucket config ─────────────────────────────────────────────────────────────

const BUCKET_META: Record<SenderBucket, {
  label: string; icon: string; color: string; bg: string;
  desc: string; safeFromDelete: boolean;
}> = {
  important:    { label: "Important Contacts", icon: "⭐", color: "#1B7A34", bg: "#E8F5EC", desc: "Family, employers, banks, healthcare, utilities — keep all", safeFromDelete: true  },
  transactional:{ label: "Transactional",       icon: "📦", color: B.teal,    bg: "#E6F4F5", desc: "Orders, receipts, deliveries, bookings",                    safeFromDelete: true  },
  newsletter:   { label: "Newsletters",          icon: "📰", color: "#1C5FA0", bg: "#E8F0FA", desc: "Subscriptions, blogs, digests",                             safeFromDelete: false },
  promotion:    { label: "Promotions",           icon: "🏷️", color: "#B85C00", bg: "#FFF0E0", desc: "Sales, discounts, marketing campaigns",                    safeFromDelete: false },
  spam:         { label: "Spam / Low Value",     icon: "🗑️", color: B.plum,   bg: "#F5EEF3", desc: "High-volume irrelevant or unknown senders",                 safeFromDelete: false },
};

const DEFAULT_ACTIONS: Record<SenderBucket, { action: BucketAction; folder: string; included: boolean }> = {
  important:    { action: "keep",   folder: "",            included: true  },
  transactional:{ action: "keep",   folder: "",            included: true  },
  newsletter:   { action: "move",   folder: "Newsletters", included: true  },
  promotion:    { action: "move",   folder: "Promotions",  included: true  },
  spam:         { action: "delete", folder: "",            included: false }, // OFF by default for safety
};

const BUCKET_ORDER: SenderBucket[] = ["important", "transactional", "newsletter", "promotion", "spam"];

// ── Main component ────────────────────────────────────────────────────────────

type Stage = "idle" | "dashboard" | "applying" | "done";
interface ApplyResult { totalMoved: number; totalDeleted: number; totalFailed: number; }

export function IntelligenceScreen({ senders, onRescan }: { senders: SenderGroup[]; onRescan: () => void }) {
  const [stage, setStage]             = useState<Stage>("idle");
  const [senderStates, setSenderStates] = useState<SenderState[]>([]);
  const [doneResult, setDoneResult]   = useState<ApplyResult | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [collapsed, setCollapsed]     = useState<Record<SenderBucket, boolean>>({
    important: false, transactional: false, newsletter: false, promotion: false, spam: true,
  });

  // Classify all senders instantly (client-side, no API call needed)
  const analyse = () => {
    const states: SenderState[] = senders.map(s => {
      const { bucket, confidence } = classifySender(s.email, s.name, s.count);
      const def = DEFAULT_ACTIONS[bucket];
      return { email: s.email, name: s.name, count: s.count, messageIds: s.messageIds, bucket, confidence, included: def.included, action: def.action, folder: def.folder };
    });
    setSenderStates(states);
    setStage("dashboard");
  };

  const updateSender = (email: string, updates: Partial<SenderState>) =>
    setSenderStates(ss => ss.map(s => s.email === email ? { ...s, ...updates } : s));

  const toggleBucket = (bucket: SenderBucket, included: boolean) =>
    setSenderStates(ss => ss.map(s => s.bucket === bucket ? { ...s, included } : s));

  const applyChanges = async () => {
    setStage("applying");
    setError(null);

    // Group senders by action into rules
    const moveMap = new Map<string, string[]>();
    const deleteIds: string[] = [];
    for (const s of senderStates) {
      if (!s.included) continue;
      if (s.action === "move" && s.folder) {
        const arr = moveMap.get(s.folder) ?? [];
        arr.push(...s.messageIds);
        moveMap.set(s.folder, arr);
      } else if (s.action === "delete") {
        deleteIds.push(...s.messageIds);
      }
    }

    // Build rules compatible with existing /api/intelligence/apply
    const rules: object[] = [];
    for (const [folder, messageIds] of moveMap) {
      rules.push({ id: `move-${folder}`, category: folder, action: "move", folder, messageIds, duplicateIds: [], enabled: true, confidence: 80, emailCount: messageIds.length });
    }
    if (deleteIds.length > 0) {
      rules.push({ id: "delete-bulk", category: "Spam", action: "delete", messageIds: deleteIds, duplicateIds: [], enabled: true, confidence: 80, emailCount: deleteIds.length });
    }

    if (rules.length === 0) {
      setDoneResult({ totalMoved: 0, totalDeleted: 0, totalFailed: 0 });
      setStage("done");
      return;
    }

    try {
      const res = await fetch("/api/intelligence/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Apply failed");
      setDoneResult(data);
      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Apply failed");
      setStage("dashboard");
    }
  };

  // Stats for the sticky apply bar
  const stats = useMemo(() => {
    const toMove    = senderStates.filter(s => s.included && s.action === "move").reduce((n, s) => n + s.messageIds.length, 0);
    const toDelete  = senderStates.filter(s => s.included && s.action === "delete").reduce((n, s) => n + s.messageIds.length, 0);
    const activeSenders = senderStates.filter(s => s.included && s.action !== "keep").length;
    return { toMove, toDelete, activeSenders };
  }, [senderStates]);

  // Group by bucket
  const byBucket = useMemo(() => {
    const map: Record<SenderBucket, SenderState[]> = { important: [], transactional: [], newsletter: [], promotion: [], spam: [] };
    for (const s of senderStates) map[s.bucket].push(s);
    return map;
  }, [senderStates]);

  // ── Done screen ──
  if (stage === "done" && doneResult) {
    return <DoneScreen result={doneResult}
      onReset={() => { setStage("idle"); setSenderStates([]); setDoneResult(null); }}
      onRescan={onRescan}
    />;
  }

  // ── Applying screen ──
  if (stage === "applying") {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div style={{ width: 32, height: 2, backgroundColor: B.teal, animation: "pulse 1.5s ease infinite" }} />
        <p style={{ color: B.navy, fontWeight: 900, fontSize: 22 }}>Applying changes…</p>
        <p style={{ color: B.muted, fontSize: 14, fontWeight: 300 }}>This may take a moment.</p>
      </div>
    );
  }

  // ── Dashboard screen ──
  if (stage === "dashboard") {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 120px" }}>
        <p style={{ color: B.teal, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 12 }} className="uppercase">Sender Review Dashboard</p>
        <h2 style={{ color: B.navy, fontWeight: 900, fontSize: "clamp(1.6rem,3vw,2.2rem)", lineHeight: 1.1, marginBottom: 8 }}>
          Review senders before applying
        </h2>
        <p style={{ color: B.muted, fontSize: 15, fontWeight: 300, marginBottom: 32 }}>
          {senderStates.length} senders classified · Toggle senders on/off · Change actions · Then click Apply Changes
        </p>

        {error && (
          <div style={{ backgroundColor: B.plum + "12", border: `1px solid ${B.plum}30`, color: B.plum, padding: "12px 16px", fontSize: 14, marginBottom: 24 }}>
            {error}
          </div>
        )}

        {BUCKET_ORDER.map(bucket => {
          const meta  = BUCKET_META[bucket];
          const items = byBucket[bucket];
          if (items.length === 0) return null;
          const allOn = items.every(s => s.included);
          const isCollapsed = collapsed[bucket];

          return (
            <div key={bucket} style={{ marginBottom: 12, border: `1px solid ${B.border}`, backgroundColor: B.white }}>
              {/* Section header */}
              <div
                style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", backgroundColor: meta.bg, userSelect: "none" }}
                onClick={() => setCollapsed(c => ({ ...c, [bucket]: !c[bucket] }))}
              >
                <span style={{ fontSize: 18 }}>{meta.icon}</span>
                <div style={{ flex: 1 }}>
                  <span style={{ color: meta.color, fontWeight: 700, fontSize: 14 }}>{meta.label}</span>
                  <span style={{ color: B.muted, fontSize: 12, marginLeft: 10 }}>{items.length} sender{items.length !== 1 ? "s" : ""}</span>
                </div>
                <p style={{ color: B.muted, fontSize: 11, fontWeight: 300, display: "none" }} className="md:block">{meta.desc}</p>
                {/* Select/deselect all */}
                <button
                  onClick={e => { e.stopPropagation(); toggleBucket(bucket, !allOn); }}
                  style={{ fontSize: 10, color: B.muted, fontWeight: 700, letterSpacing: "0.1em", padding: "3px 10px", border: `1px solid ${B.border}`, backgroundColor: B.white, cursor: "pointer" }}
                  className="uppercase"
                >
                  {allOn ? "Deselect all" : "Select all"}
                </button>
                <span style={{ color: B.muted, fontSize: 12 }}>{isCollapsed ? "▶" : "▼"}</span>
              </div>

              {/* Sender rows */}
              {!isCollapsed && (
                <div style={{ borderTop: `1px solid ${B.border}` }}>
                  {items.map(sender => (
                    <SenderRow key={sender.email} sender={sender} meta={meta} onUpdate={u => updateSender(sender.email, u)} onChangeBucket={newBucket => {
                      const def = DEFAULT_ACTIONS[newBucket];
                      updateSender(sender.email, { bucket: newBucket, action: def.action, folder: def.folder, included: def.included });
                    }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Sticky apply bar */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: B.navy, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, zIndex: 100 }}>
          <div>
            <p style={{ color: B.white, fontWeight: 700, fontSize: 14, margin: 0 }}>
              {stats.activeSenders} sender{stats.activeSenders !== 1 ? "s" : ""} with actions
            </p>
            <p style={{ color: B.tealLight, fontSize: 12, fontWeight: 300, margin: 0 }}>
              {stats.toMove > 0    && `${stats.toMove.toLocaleString()} to move`}
              {stats.toMove > 0 && stats.toDelete > 0 && " · "}
              {stats.toDelete > 0 && `${stats.toDelete.toLocaleString()} to bin`}
              {stats.toMove === 0 && stats.toDelete === 0 && "No changes selected"}
            </p>
          </div>
          <button
            onClick={applyChanges}
            disabled={stats.activeSenders === 0}
            style={{ backgroundColor: stats.activeSenders > 0 ? B.teal : B.muted, color: B.white, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", padding: "14px 28px", border: "none", cursor: stats.activeSenders > 0 ? "pointer" : "not-allowed" }}
            className="uppercase"
          >
            Apply Changes →
          </button>
        </div>
      </div>
    );
  }

  // ── Idle screen ──
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
      <p style={{ color: B.teal, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 12 }} className="uppercase">
        Inbox Intelligence
      </p>
      <h2 style={{ color: B.navy, fontWeight: 900, fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 16 }}>
        Organise by relationship,<br />
        <span style={{ color: B.teal }}>not just email type.</span>
      </h2>
      <p style={{ color: B.muted, fontSize: 16, fontWeight: 300, lineHeight: 1.7, maxWidth: 520, marginBottom: 32 }}>
        We classify every sender by their relationship to you — important contacts, transactional services, newsletters, promotions, and spam — then let you decide what happens to each one. Nothing changes until you confirm.
      </p>

      {senders.length === 0 ? (
        <p style={{ color: B.muted, fontSize: 14 }}>Scan your inbox first to use Inbox Intelligence.</p>
      ) : (
        <button
          onClick={analyse}
          style={{ backgroundColor: B.navy, color: B.white, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", padding: "16px 32px" }}
          className="uppercase hover:opacity-90 transition-opacity"
        >
          Analyse {senders.length} Senders →
        </button>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 1, backgroundColor: B.border, marginTop: 48 }}>
        {[
          { icon: "⭐", title: "Relationship-first",  desc: "Classifies by who the sender is, not just what the email says" },
          { icon: "🔒", title: "Safe by default",      desc: "Important contacts and transactional emails are never deleted" },
          { icon: "✏️", title: "Fully editable",       desc: "Override any classification or action before applying" },
          { icon: "👁️", title: "Review before acting", desc: "Nothing is changed until you click Apply Changes" },
        ].map(f => (
          <div key={f.title} style={{ backgroundColor: B.white, padding: "24px 20px" }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
            <p style={{ color: B.navy, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{f.title}</p>
            <p style={{ color: B.muted, fontSize: 12, fontWeight: 300, lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sender Row ────────────────────────────────────────────────────────────────

function SenderRow({
  sender, meta, onUpdate, onChangeBucket,
}: {
  sender: SenderState;
  meta: typeof BUCKET_META[SenderBucket];
  onUpdate: (u: Partial<SenderState>) => void;
  onChangeBucket: (bucket: SenderBucket) => void;
}) {
  return (
    <div style={{
      padding: "10px 20px", display: "flex", alignItems: "center", gap: 14,
      borderBottom: `1px solid ${B.border}`,
      backgroundColor: sender.included ? B.white : B.bgMid,
      opacity: sender.included ? 1 : 0.5,
      transition: "all 0.15s",
    }}>
      {/* Toggle */}
      <button
        onClick={() => onUpdate({ included: !sender.included })}
        aria-label={sender.included ? "Exclude sender" : "Include sender"}
        style={{ width: 36, height: 20, borderRadius: 10, flexShrink: 0, backgroundColor: sender.included ? meta.color : B.border, position: "relative", transition: "background-color 0.2s", border: "none", cursor: "pointer" }}
      >
        <span style={{ position: "absolute", top: 2, left: sender.included ? 18 : 2, width: 16, height: 16, borderRadius: "50%", backgroundColor: B.white, transition: "left 0.2s" }} />
      </button>

      {/* Name + email */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: B.navy, fontWeight: 700, fontSize: 13, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sender.name}</p>
        <p style={{ color: B.muted, fontSize: 11, fontWeight: 300, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sender.email}</p>
      </div>

      {/* Bucket override selector */}
      <select
        value={sender.bucket}
        onChange={e => onChangeBucket(e.target.value as SenderBucket)}
        style={{ fontSize: 10, fontWeight: 700, padding: "3px 6px", border: `1px solid ${meta.color}40`, backgroundColor: meta.bg, color: meta.color, fontFamily: "inherit", cursor: "pointer", flexShrink: 0 }}
      >
        <option value="important">⭐ Important</option>
        <option value="transactional">📦 Transactional</option>
        <option value="newsletter">📰 Newsletter</option>
        <option value="promotion">🏷️ Promotion</option>
        <option value="spam">🗑️ Spam</option>
      </select>

      {/* Email count */}
      <span style={{ color: B.muted, fontSize: 11, fontWeight: 600, flexShrink: 0, backgroundColor: B.bgMid, padding: "2px 8px", borderRadius: 2 }}>
        {sender.count}
      </span>

      {/* Action selector — locked to "keep" for safe buckets */}
      {sender.included ? (
        <select
          value={sender.action}
          onChange={e => onUpdate({ action: e.target.value as BucketAction })}
          disabled={meta.safeFromDelete}
          style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", border: `1px solid ${B.border}`, backgroundColor: meta.safeFromDelete ? B.bgMid : B.white, color: B.navy, fontFamily: "inherit", cursor: meta.safeFromDelete ? "default" : "pointer" }}
        >
          <option value="keep">Keep in inbox</option>
          <option value="move">Move to folder</option>
          {!meta.safeFromDelete && <option value="delete">Move to bin</option>}
        </select>
      ) : (
        <span style={{ fontSize: 11, color: B.muted, fontStyle: "italic", minWidth: 100 }}>Skipped</span>
      )}

      {/* Folder input — shown when action is "move" */}
      {sender.included && sender.action === "move" && (
        <input
          value={sender.folder}
          onChange={e => onUpdate({ folder: e.target.value })}
          placeholder="Folder name"
          style={{ fontSize: 11, padding: "4px 8px", border: `1px solid ${B.border}`, color: B.teal, fontWeight: 600, width: 110, fontFamily: "inherit" }}
        />
      )}
    </div>
  );
}

// ── Done Screen ───────────────────────────────────────────────────────────────

function DoneScreen({ result, onReset, onRescan }: { result: ApplyResult; onReset: () => void; onRescan: () => void }) {
  const nothingHappened = result.totalMoved === 0 && result.totalDeleted === 0;
  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ width: 48, height: 2, backgroundColor: nothingHappened ? B.plum : B.teal, margin: "0 auto 24px" }} />
        <p style={{ color: nothingHappened ? B.plum : B.teal, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 12 }} className="uppercase">
          {nothingHappened ? "Nothing Changed" : "Complete"}
        </p>
        <h2 style={{ color: B.navy, fontWeight: 900, fontSize: "clamp(1.8rem,3vw,2.5rem)", lineHeight: 1.05, marginBottom: 12 }}>
          {nothingHappened ? "No emails were processed." : "Changes applied."}
        </h2>
        <p style={{ color: B.muted, fontSize: 15, fontWeight: 300 }}>
          {nothingHappened
            ? "Your session may have expired. Sign out and back in, then try again."
            : "Your inbox has been reorganised."}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, backgroundColor: B.border, marginBottom: 32 }}>
        {[
          { label: "Moved",  value: result.totalMoved,   color: B.teal },
          { label: "Binned", value: result.totalDeleted,  color: B.plum },
          { label: "Failed", value: result.totalFailed,   color: result.totalFailed > 0 ? B.plum : B.muted },
        ].map(m => (
          <div key={m.label} style={{ backgroundColor: B.white, padding: "28px 16px", textAlign: "center" }}>
            <p style={{ color: m.color, fontWeight: 900, fontSize: 36, lineHeight: 1, marginBottom: 6 }}>{m.value.toLocaleString()}</p>
            <p style={{ color: B.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em" }} className="uppercase">{m.label}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={onRescan} style={{ backgroundColor: B.navy, color: B.white, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", padding: "14px 28px" }} className="uppercase hover:opacity-90 transition-opacity">
          Rescan Inbox →
        </button>
        <button onClick={onReset} style={{ backgroundColor: B.bgMid, color: B.muted, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", padding: "14px 28px", border: `1px solid ${B.border}` }} className="uppercase hover:opacity-90 transition-opacity">
          Run Again
        </button>
      </div>
    </div>
  );
}
