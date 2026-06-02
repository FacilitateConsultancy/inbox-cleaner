"use client";

import { useState, useCallback } from "react";
import type { SenderGroup, SenderDecision, SenderAction } from "@/types";
import { SwipeCard } from "./SwipeCard";

const B = { navy: "#1C213E", teal: "#3B8590", tealLight: "#7BC7CC", plum: "#4B2C42", muted: "#6B7299", border: "#DDE1ED", bg: "#F7F8FC", bgMid: "#ECEEF5", white: "#FFFFFF" };

interface Props {
  senders: SenderGroup[];
  decisions: SenderDecision;
  onDecide: (email: string, action: SenderAction) => void;
  onUndo: () => void;
  onFinish: () => void;
}

export function ReviewScreen({ senders, decisions, onDecide, onUndo, onFinish }: Props) {
  const undecided = senders.filter((s) => !decisions[s.email] || decisions[s.email] === "undecided");
  const decided   = senders.filter((s) => decisions[s.email] && decisions[s.email] !== "undecided");
  const toRemove  = senders.filter((s) => decisions[s.email] === "remove" || decisions[s.email] === "unsubscribe");
  const [cardKey, setCardKey] = useState(0);

  const handleDecide = useCallback((decision: SenderAction) => {
    if (!decision || undecided.length === 0) return;
    onDecide(undecided[0].email, decision);
    setCardKey((k) => k + 1);
  }, [undecided, onDecide]);

  const handleUndo = useCallback(() => { onUndo(); setCardKey((k) => k + 1); }, [onUndo]);

  const total = senders.length;
  const pct   = total > 0 ? Math.round((decided.length / total) * 100) : 0;

  if (undecided.length === 0) {
    return (
      <ReviewComplete
        total={total}
        toRemoveCount={toRemove.length}
        removeEmailCount={toRemove.flatMap((s) => s.messageIds).length}
        unsubCount={senders.filter((s) => decisions[s.email] === "unsubscribe").length}
        onFinish={onFinish}
        onUndo={handleUndo}
        canUndo={decided.length > 0}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: B.bg }}>
      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Progress */}
        <div className="mb-8">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <p style={{ color: B.teal, fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", marginBottom: 4 }} className="uppercase">Sender Review</p>
              <p style={{ color: B.navy, fontWeight: 900, fontSize: 24 }}>{undecided.length} remaining</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: B.navy, fontWeight: 900, fontSize: 24 }}>{pct}%</p>
              <p style={{ color: B.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em" }} className="uppercase">Complete</p>
            </div>
          </div>
          <div style={{ height: 2, backgroundColor: B.border, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, backgroundColor: B.teal, transition: "width 0.5s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ color: B.muted, fontSize: 10 }}>{decided.length} decided</span>
            <span style={{ color: B.muted, fontSize: 10 }}>{total} total</span>
          </div>
        </div>

        {/* Card stack */}
        <div style={{ position: "relative", height: 560, marginBottom: 32 }}>
          {undecided.slice(0, 3).map((sender, i) => (
            <SwipeCard
              key={`${sender.email}-${cardKey + i}`}
              sender={sender}
              stackIndex={i}
              onDecide={handleDecide}
            />
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={handleUndo} disabled={decided.length === 0}
            style={{ color: B.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", borderBottom: `1px solid transparent`, paddingBottom: 2 }}
            className="uppercase hover:opacity-70 disabled:opacity-25 transition-opacity">
            ↩ Undo
          </button>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: B.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }} className="uppercase">← Remove · Keep →</p>
            <p style={{ color: B.muted, fontSize: 10, opacity: 0.6, marginTop: 2 }}>Drag, click, or arrow keys</p>
          </div>
          <button onClick={onFinish} disabled={toRemove.length === 0}
            style={{ color: B.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em" }}
            className="uppercase hover:opacity-70 disabled:opacity-25 transition-opacity">
            Skip →
          </button>
        </div>

        {/* Running tally */}
        {toRemove.length > 0 && (
          <div style={{ marginTop: 24, backgroundColor: B.plum + "10", border: `1px solid ${B.plum}25`, padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ color: B.navy, fontSize: 14 }}>
              <strong>{toRemove.length}</strong> sender{toRemove.length !== 1 ? "s" : ""} marked for removal
            </p>
            <span style={{ color: B.muted, fontSize: 12 }}>
              {toRemove.flatMap((s) => s.messageIds).length.toLocaleString()} emails
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewComplete({ total, toRemoveCount, removeEmailCount, unsubCount, onFinish, onUndo, canUndo }: {
  total: number; toRemoveCount: number; removeEmailCount: number; unsubCount: number;
  onFinish: () => void; onUndo: () => void; canUndo: boolean;
}) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: B.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{ width: 48, height: 2, backgroundColor: B.teal, margin: "0 auto 32px" }} />
        <h2 style={{ color: B.navy, fontWeight: 900, fontSize: 40, lineHeight: 1.1, marginBottom: 12 }}>Review complete.</h2>
        <p style={{ color: B.muted, fontWeight: 300, fontSize: 18, marginBottom: 40 }}>You've reviewed all {total} senders.</p>

        <div style={{ display: "grid", gridTemplateColumns: unsubCount > 0 ? "1fr 1fr 1fr" : "1fr 1fr", gap: 16, marginBottom: 40 }}>
          <div style={{ backgroundColor: B.white, border: `1px solid ${B.border}`, padding: 24 }}>
            <p style={{ color: B.navy, fontWeight: 900, fontSize: 36 }}>{toRemoveCount}</p>
            <p style={{ color: B.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", marginTop: 4 }} className="uppercase">To remove</p>
          </div>
          <div style={{ backgroundColor: B.white, border: `1px solid ${B.border}`, padding: 24 }}>
            <p style={{ color: B.navy, fontWeight: 900, fontSize: 36 }}>{removeEmailCount.toLocaleString()}</p>
            <p style={{ color: B.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", marginTop: 4 }} className="uppercase">Emails</p>
          </div>
          {unsubCount > 0 && (
            <div style={{ backgroundColor: B.teal + "10", border: `1px solid ${B.teal}25`, padding: 24 }}>
              <p style={{ color: B.navy, fontWeight: 900, fontSize: 36 }}>{unsubCount}</p>
              <p style={{ color: B.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", marginTop: 4 }} className="uppercase">Unsubscribed</p>
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={onFinish} disabled={toRemoveCount === 0}
            style={{ backgroundColor: toRemoveCount > 0 ? B.teal : B.bgMid, color: toRemoveCount > 0 ? B.white : B.muted, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", padding: "16px 32px" }}
            className="uppercase hover:opacity-90 transition-opacity w-full">
            {toRemoveCount > 0 ? `Review & Delete ${removeEmailCount.toLocaleString()} emails →` : "Nothing marked for removal"}
          </button>
          {canUndo && (
            <button onClick={onUndo}
              style={{ color: B.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em" }}
              className="uppercase hover:opacity-70 transition-opacity">
              ↩ Undo last decision
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
