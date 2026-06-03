"use client";

import { useState, useCallback } from "react";
import type { IntelligenceResult, IntelligenceRule, CategoryGroup, EmailCategory, RuleAction, SenderGroup } from "@/types";

const B = {
  navy: "#1C213E", navyLight: "#2E3662", teal: "#3B8590", tealLight: "#7BC7CC",
  plum: "#4B2C42", muted: "#6B7299", border: "#DDE1ED", bg: "#F7F8FC",
  bgMid: "#ECEEF5", white: "#FFFFFF",
};

const CATEGORY_ICONS: Record<EmailCategory, string> = {
  "Order Confirmation": "📦",
  "Receipt":            "🧾",
  "Shipping Update":    "🚚",
  "Return & Refund":    "↩️",
  "Newsletter":         "📰",
  "Promotion":          "🏷️",
  "Sale Alert":         "🔖",
  "Travel":             "✈️",
  "Finance":            "💳",
  "Social":             "💬",
  "Other":              "📁",
};

const ACTION_LABELS: Record<RuleAction, string> = {
  "move":              "Move to folder",
  "delete":            "Move to bin",
  "delete-duplicates": "Bin duplicates only",
  "unsubscribe":       "Unsubscribe + Bin",
  "keep":              "Keep in inbox",
};

const ACTION_COLORS: Record<RuleAction, { bg: string; color: string }> = {
  "move":              { bg: B.teal + "18",  color: B.teal },
  "delete":            { bg: B.plum + "18",  color: B.plum },
  "delete-duplicates": { bg: "#E8780018",    color: "#B85C00" },
  "unsubscribe":       { bg: B.plum + "18",  color: B.plum },
  "keep":              { bg: B.bgMid,        color: B.muted },
};

type Stage = "idle" | "loading" | "results" | "reviewing" | "applying" | "done";

interface ApplyDoneResult {
  totalMoved: number;
  totalDeleted: number;
  totalFailed: number;
}

export function IntelligenceScreen({ senders, onRescan }: { senders: SenderGroup[]; onRescan: () => void }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<IntelligenceResult | null>(null);
  const [rules, setRules] = useState<IntelligenceRule[]>([]);
  const [doneResult, setDoneResult] = useState<ApplyDoneResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyse = useCallback(async () => {
    setStage("loading");
    setError(null);
    try {
      const res = await fetch("/api/intelligence/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senders }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setResult(data);
      setRules(data.suggestedRules.map((r: IntelligenceRule) => ({ ...r })));
      setStage("results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      setStage("idle");
    }
  }, []);

  const applyRules = useCallback(async () => {
    setStage("applying");
    setError(null);
    try {
      // Attach messageIds and duplicateIds from categories to each rule
      const enrichedRules = rules
        .filter(r => r.enabled)
        .map(r => {
          const cat = result?.categories.find(c => c.category === r.category);
          return {
            ...r,
            messageIds: cat?.messageIds ?? [],
            duplicateIds: cat?.duplicateIds ?? [],
          };
        });

      const res = await fetch("/api/intelligence/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: enrichedRules }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Apply failed");
      setDoneResult(data);
      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Apply failed");
      setStage("reviewing");
    }
  }, [rules, result]);

  const toggleRule = (id: string) => {
    setRules(rs => rs.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const setRuleAction = (id: string, action: RuleAction) => {
    setRules(rs => rs.map(r => r.id === id ? { ...r, action } : r));
  };

  if (stage === "done" && doneResult) {
    return <DoneScreen result={doneResult}
      onReset={() => { setStage("idle"); setResult(null); setRules([]); setDoneResult(null); }}
      onRescan={onRescan}
    />;
  }

  if (stage === "applying") {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div style={{ width: 32, height: 2, backgroundColor: B.teal, animation: "pulse 1.5s ease infinite" }} />
        <p style={{ color: B.navy, fontWeight: 900, fontSize: 22 }}>Applying rules…</p>
        <p style={{ color: B.muted, fontSize: 14, fontWeight: 300 }}>This may take a moment.</p>
      </div>
    );
  }

  if (stage === "reviewing") {
    return <ReviewScreen rules={rules} onToggle={toggleRule} onSetAction={setRuleAction} onApply={applyRules} onBack={() => setStage("results")} error={error} />;
  }

  if (stage === "results" && result) {
    return <ResultsScreen result={result} rules={rules} onReview={() => setStage("reviewing")} />;
  }

  if (stage === "loading") {
    return (
      <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div style={{ width: 32, height: 2, backgroundColor: B.teal, animation: "pulse 1.5s ease infinite" }} />
        <p style={{ color: B.navy, fontWeight: 900, fontSize: 22 }}>Analysing your inbox…</p>
        <p style={{ color: B.muted, fontSize: 14, fontWeight: 300 }}>Classifying emails by type. This takes a moment.</p>
      </div>
    );
  }

  // Idle
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
      {error && (
        <div style={{ backgroundColor: B.plum + "12", border: `1px solid ${B.plum}30`, color: B.plum, padding: "12px 16px", fontSize: 14, marginBottom: 24 }}>
          {error}
        </div>
      )}

      {/* Hero */}
      <div style={{ marginBottom: 48 }}>
        <p style={{ color: B.teal, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 12 }} className="uppercase">
          Inbox Intelligence
        </p>
        <h2 style={{ color: B.navy, fontWeight: 900, fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 16 }}>
          Understand what's<br />
          <span style={{ color: B.teal }}>filling your inbox.</span>
        </h2>
        <p style={{ color: B.muted, fontSize: 16, fontWeight: 300, lineHeight: 1.7, maxWidth: 520, marginBottom: 32 }}>
          We analyse every email by type — receipts, shipping updates, newsletters, promotions — and suggest smart rules to file, delete, or unsubscribe automatically.
        </p>
        <button
          onClick={analyse}
          style={{ backgroundColor: B.navy, color: B.white, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", padding: "16px 32px" }}
          className="uppercase hover:opacity-90 transition-opacity"
        >
          Analyse Inbox →
        </button>
      </div>

      {/* Feature grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 1, backgroundColor: B.border }}>
        {[
          { icon: "🔍", title: "Email Classification", desc: "Groups every email into 10 intelligent categories" },
          { icon: "📁", title: "Folder Suggestions", desc: "Proposes a clean folder structure for your inbox" },
          { icon: "⚡", title: "Bulk Actions", desc: "Apply rules to hundreds of emails at once" },
          { icon: "🔒", title: "Always Confirmed", desc: "Review every rule before anything is changed" },
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

// ── Results Screen ──────────────────────────────────────────────────────────

function ResultsScreen({ result, rules, onReview }: { result: IntelligenceResult; rules: IntelligenceRule[]; onReview: () => void }) {
  const activeRules = rules.filter(r => r.enabled);
  const emailsAffected = activeRules.reduce((s, r) => s + r.emailCount, 0);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 24px" }}>
      <p style={{ color: B.teal, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 12 }} className="uppercase">Analysis Complete</p>
      <h2 style={{ color: B.navy, fontWeight: 900, fontSize: "clamp(1.8rem,3vw,2.5rem)", lineHeight: 1.1, marginBottom: 8 }}>
        {result.categories.length} categories found
      </h2>
      <p style={{ color: B.muted, fontSize: 15, fontWeight: 300, marginBottom: 36 }}>
        {activeRules.length} rules suggested • {emailsAffected.toLocaleString()} emails affected
      </p>

      {/* Category cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 40 }}>
        {result.categories.map(cat => (
          <CategoryCard key={cat.category} cat={cat} />
        ))}
      </div>

      {/* Suggested folders */}
      {result.suggestedFolders.length > 0 && (
        <div style={{ backgroundColor: B.bgMid, padding: "20px 24px", marginBottom: 32 }}>
          <p style={{ color: B.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", marginBottom: 12 }} className="uppercase">
            Folders that will be created
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {result.suggestedFolders.map(f => (
              <span key={f} style={{ backgroundColor: B.white, border: `1px solid ${B.border}`, color: B.navy, fontSize: 12, fontWeight: 600, padding: "4px 12px" }}>
                📁 {f}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onReview}
        style={{ backgroundColor: B.teal, color: B.white, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", padding: "16px 32px" }}
        className="uppercase hover:opacity-90 transition-opacity"
      >
        Review & Apply Rules →
      </button>
    </div>
  );
}

function CategoryCard({ cat }: { cat: CategoryGroup }) {
  const actionColor = ACTION_COLORS[cat.suggestedAction];
  return (
    <div style={{ backgroundColor: B.white, border: `1px solid ${B.border}`, padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>{CATEGORY_ICONS[cat.category]}</span>
          <div>
            <p style={{ color: B.navy, fontWeight: 700, fontSize: 14 }}>{cat.category}</p>
            <p style={{ color: B.muted, fontSize: 11 }}>{cat.count.toLocaleString()} emails</p>
          </div>
        </div>
        <span style={{ ...actionColor, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", padding: "3px 8px" }} className="uppercase">
          {ACTION_LABELS[cat.suggestedAction]}
        </span>
      </div>

      {/* Top senders */}
      <div style={{ marginBottom: 12 }}>
        {cat.topSenders.slice(0, 2).map(s => (
          <p key={s} style={{ color: B.muted, fontSize: 11, fontWeight: 300 }} className="truncate">• {s}</p>
        ))}
        {cat.topSenders.length > 2 && (
          <p style={{ color: B.muted, fontSize: 11, fontWeight: 300 }}>+ {cat.topSenders.length - 2} more</p>
        )}
      </div>

      {/* Confidence bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ color: B.muted, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em" }} className="uppercase">Confidence</span>
          <span style={{ color: B.muted, fontSize: 9, fontWeight: 700 }}>{cat.confidence}%</span>
        </div>
        <div style={{ height: 2, backgroundColor: B.border }}>
          <div style={{ height: "100%", width: `${cat.confidence}%`, backgroundColor: B.teal }} />
        </div>
      </div>
    </div>
  );
}

// ── Review Screen ───────────────────────────────────────────────────────────

function ReviewScreen({
  rules, onToggle, onSetAction, onApply, onBack, error
}: {
  rules: IntelligenceRule[];
  onToggle: (id: string) => void;
  onSetAction: (id: string, action: RuleAction) => void;
  onApply: () => void;
  onBack: () => void;
  error: string | null;
}) {
  const enabled = rules.filter(r => r.enabled);
  const affected = enabled.reduce((s, r) => s + r.emailCount, 0);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
      <button
        onClick={onBack}
        style={{ color: B.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 32 }}
        className="uppercase hover:opacity-70 transition-opacity"
      >
        ← Back
      </button>

      <p style={{ color: B.teal, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 12 }} className="uppercase">Review Rules</p>
      <h2 style={{ color: B.navy, fontWeight: 900, fontSize: "clamp(1.8rem,3vw,2.5rem)", lineHeight: 1.1, marginBottom: 8 }}>
        Confirm before applying
      </h2>
      <p style={{ color: B.muted, fontSize: 15, fontWeight: 300, marginBottom: 32 }}>
        {enabled.length} rules enabled • {affected.toLocaleString()} emails will be affected. Toggle rules off to skip them.
      </p>

      {error && (
        <div style={{ backgroundColor: B.plum + "12", border: `1px solid ${B.plum}30`, color: B.plum, padding: "12px 16px", fontSize: 14, marginBottom: 24 }}>
          {error}
        </div>
      )}

      {/* Warning */}
      <div style={{ backgroundColor: "#FFF8E6", border: "1px solid #E8C84020", padding: "12px 16px", marginBottom: 24, display: "flex", gap: 12 }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <p style={{ color: "#7A5C00", fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>
          Actions cannot be undone. Deleted emails go to Trash. Moved emails go to the named folder. Unsubscribed emails are removed and unsubscribed.
        </p>
      </div>

      {/* Rules list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32 }}>
        {rules.map(rule => (
          <RuleRow key={rule.id} rule={rule} onToggle={onToggle} onSetAction={onSetAction} />
        ))}
      </div>

      {enabled.length > 0 ? (
        <button
          onClick={onApply}
          style={{ backgroundColor: B.navy, color: B.white, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", padding: "16px 32px" }}
          className="uppercase hover:opacity-90 transition-opacity"
        >
          Apply {enabled.length} Rule{enabled.length !== 1 ? "s" : ""} →
        </button>
      ) : (
        <p style={{ color: B.muted, fontSize: 14 }}>Enable at least one rule to apply.</p>
      )}
    </div>
  );
}

function RuleRow({ rule, onToggle, onSetAction }: {
  rule: IntelligenceRule;
  onToggle: (id: string) => void;
  onSetAction: (id: string, action: RuleAction) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const actionColor = ACTION_COLORS[rule.action];
  const subjects = rule.sampleSubjects ?? [];

  return (
    <div style={{
      backgroundColor: rule.enabled ? B.white : B.bgMid,
      border: `1px solid ${rule.enabled ? B.border : B.bgMid}`,
      opacity: rule.enabled ? 1 : 0.5,
      transition: "all 0.2s",
    }}>
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        {/* Toggle */}
        <button
          onClick={() => onToggle(rule.id)}
          style={{
            width: 36, height: 20, borderRadius: 10, flexShrink: 0,
            backgroundColor: rule.enabled ? B.teal : B.border,
            position: "relative", transition: "background-color 0.2s", border: "none",
          }}
        >
          <span style={{
            position: "absolute", top: 2, left: rule.enabled ? 18 : 2,
            width: 16, height: 16, borderRadius: "50%", backgroundColor: B.white,
            transition: "left 0.2s",
          }} />
        </button>

        {/* Icon + category */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>{CATEGORY_ICONS[rule.category]}</span>
          <div style={{ minWidth: 0 }}>
            <p style={{ color: B.navy, fontWeight: 700, fontSize: 14 }}>{rule.category}</p>
            <p style={{ color: B.muted, fontSize: 11 }}>{rule.emailCount.toLocaleString()} emails</p>
          </div>
        </div>

        {/* Action selector */}
        <select
          value={rule.action}
          onChange={e => onSetAction(rule.id, e.target.value as RuleAction)}
          disabled={!rule.enabled}
          style={{
            ...actionColor,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
            padding: "4px 8px", border: "none", cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <option value="move">Move to folder</option>
          <option value="delete">Move to bin</option>
          <option value="delete-duplicates">Bin duplicates only</option>
          <option value="unsubscribe">Unsubscribe + Bin</option>
          <option value="keep">Keep in inbox</option>
        </select>

        {/* Folder label */}
        {rule.action === "move" && rule.folder && (
          <span style={{ color: B.teal, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
            → {rule.folder}
          </span>
        )}

        {/* Confidence */}
        <span style={{ color: B.muted, fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
          {rule.confidence}%
        </span>

        {/* Expand button */}
        {subjects.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{ color: B.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", flexShrink: 0, border: `1px solid ${B.border}`, padding: "3px 8px" }}
            className="uppercase hover:opacity-70 transition-opacity"
          >
            {expanded ? "▲ Hide" : "▼ Preview"}
          </button>
        )}
      </div>

      {/* Subject preview panel */}
      {expanded && subjects.length > 0 && (
        <div style={{ borderTop: `1px solid ${B.border}`, padding: "12px 20px 16px", backgroundColor: B.bgMid }}>
          <p style={{ color: B.muted, fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 8 }} className="uppercase">
            Sample subjects ({subjects.length} shown)
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {subjects.map((s, i) => (
              <p key={i} style={{ color: B.navy, fontSize: 12, fontWeight: 300, lineHeight: 1.4 }} className="truncate">
                · {s}
              </p>
            ))}
          </div>
          {rule.emailCount > subjects.length && (
            <p style={{ color: B.muted, fontSize: 11, marginTop: 8 }}>
              + {(rule.emailCount - subjects.length).toLocaleString()} more emails not shown
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Done Screen ─────────────────────────────────────────────────────────────

function DoneScreen({ result, onReset, onRescan }: { result: ApplyDoneResult; onReset: () => void; onRescan: () => void }) {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
      <div style={{ width: 48, height: 2, backgroundColor: B.teal, margin: "0 auto 32px" }} />
      <p style={{ color: B.teal, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 16 }} className="uppercase">Complete</p>
      <h2 style={{ color: B.navy, fontWeight: 900, fontSize: "clamp(2rem,4vw,3rem)", lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 16 }}>
        Rules applied.
      </h2>
      <p style={{ color: B.muted, fontSize: 16, fontWeight: 300, marginBottom: 40 }}>
        Your inbox has been reorganised.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, backgroundColor: B.border, marginBottom: 40 }}>
        <Metric label="Moved" value={result.totalMoved} color={B.teal} />
        <Metric label="Deleted" value={result.totalDeleted} color={B.plum} />
        <Metric label="Failed" value={result.totalFailed} color={B.muted} />
      </div>

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          onClick={onRescan}
          style={{ backgroundColor: B.navy, color: B.white, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", padding: "14px 28px" }}
          className="uppercase hover:opacity-90 transition-opacity"
        >
          Rescan Inbox →
        </button>
        <button
          onClick={onReset}
          style={{ backgroundColor: B.bgMid, color: B.muted, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", padding: "14px 28px", border: `1px solid ${B.border}` }}
          className="uppercase hover:opacity-90 transition-opacity"
        >
          Run Again
        </button>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ backgroundColor: B.white, padding: "28px 16px", textAlign: "center" }}>
      <p style={{ color, fontWeight: 900, fontSize: 36, lineHeight: 1, marginBottom: 6 }}>{value.toLocaleString()}</p>
      <p style={{ color: B.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em" }} className="uppercase">{label}</p>
    </div>
  );
}
