"use client";

import type { SenderGroup, SenderDecision } from "@/types";
import { SenderAvatar } from "./DashboardScreen";

const B = { navy: "#1C213E", teal: "#3B8590", tealLight: "#7BC7CC", plum: "#4B2C42", muted: "#6B7299", border: "#DDE1ED", bg: "#F7F8FC", bgMid: "#ECEEF5", white: "#FFFFFF" };

interface Props {
  sendersToRemove: SenderGroup[];
  emailCount: number;
  decisions?: SenderDecision;
  onConfirm: () => void;
  onBack: () => void;
}

export function ConfirmationScreen({ sendersToRemove, emailCount, decisions, onConfirm, onBack }: Props) {
  const unsubscribers = decisions
    ? sendersToRemove.filter((s) => decisions[s.email] === "unsubscribe")
    : [];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: B.bg, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 24px" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <button onClick={onBack}
          style={{ color: B.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 32, display: "flex", alignItems: "center", gap: 6 }}
          className="uppercase hover:opacity-70 transition-opacity">
          ← Back to review
        </button>

        {/* Warning */}
        <div style={{ borderLeft: `4px solid ${B.plum}`, paddingLeft: 20, marginBottom: 32 }}>
          <p style={{ color: B.plum, fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", marginBottom: 8 }} className="uppercase">Permanent Action</p>
          <h1 style={{ color: B.navy, fontWeight: 900, fontSize: 36, lineHeight: 1.1, marginBottom: 12 }}>Confirm deletion.</h1>
          <p style={{ color: B.muted, fontWeight: 300, fontSize: 16, lineHeight: 1.7 }}>
            You are about to permanently delete{" "}
            <strong style={{ color: B.navy, fontWeight: 700 }}>{emailCount.toLocaleString()} email{emailCount !== 1 ? "s" : ""}</strong>{" "}
            from{" "}
            <strong style={{ color: B.navy, fontWeight: 700 }}>{sendersToRemove.length} sender{sendersToRemove.length !== 1 ? "s" : ""}</strong>.
            {" "}This cannot be undone.
          </p>
        </div>

        {/* Unsubscribe notice */}
        {unsubscribers.length > 0 && (
          <div style={{ backgroundColor: B.teal + "10", border: `1px solid ${B.teal}30`, padding: "12px 16px", marginBottom: 16 }}>
            <p style={{ color: B.teal, fontSize: 13, fontWeight: 600 }}>
              {unsubscribers.length} sender{unsubscribers.length !== 1 ? "s" : ""} were unsubscribed via their mailing list link before deletion.
            </p>
          </div>
        )}

        {/* Sender list */}
        <div style={{ backgroundColor: B.white, border: `1px solid ${B.border}`, marginBottom: 32 }}>
          <div style={{ padding: "14px 24px", borderBottom: `1px solid ${B.border}` }}>
            <p style={{ color: B.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em" }} className="uppercase">Senders being removed</p>
          </div>
          <ul style={{ maxHeight: 280, overflowY: "auto" }}>
            {sendersToRemove.map((s, i) => (
              <li key={s.email} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 24px", borderTop: i > 0 ? `1px solid ${B.border}` : "none" }}>
                <SenderAvatar name={s.name} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: B.navy, fontWeight: 600, fontSize: 14 }} className="truncate">{s.name}</p>
                  <p style={{ color: B.muted, fontSize: 12 }} className="truncate">{s.email}</p>
                </div>
                {decisions?.[s.email] === "unsubscribe" && (
                  <span style={{ color: B.teal, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", flexShrink: 0, marginRight: 8 }} className="uppercase">Unsubscribed</span>
                )}
                <span style={{ color: B.plum, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{s.count.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={onConfirm}
            style={{ backgroundColor: B.plum, color: B.white, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", padding: "16px 32px", width: "100%" }}
            className="uppercase hover:opacity-90 transition-opacity">
            Delete {emailCount.toLocaleString()} emails permanently
          </button>
          <button onClick={onBack}
            style={{ backgroundColor: B.white, color: B.muted, fontWeight: 700, fontSize: 11, letterSpacing: "0.15em", padding: "14px 24px", border: `1px solid ${B.border}` }}
            className="uppercase hover:opacity-70 transition-opacity">
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}
