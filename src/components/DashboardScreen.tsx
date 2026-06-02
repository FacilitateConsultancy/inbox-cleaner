"use client";

import { useMemo } from "react";
import type { SenderGroup } from "@/types";
import { calcHealthScore, healthGrade, getRecommendation } from "@/lib/recommendations";

const B = { navy: "#1C213E", teal: "#3B8590", tealLight: "#7BC7CC", plum: "#4B2C42", muted: "#6B7299", border: "#DDE1ED", bg: "#F7F8FC", bgMid: "#ECEEF5", white: "#FFFFFF" };

interface Props {
  senders: SenderGroup[];
  total: number;
  onStartReview: () => void;
  onRescan: () => void;
}

export function DashboardScreen({ senders, total, onStartReview, onRescan }: Props) {
  const score = useMemo(() => calcHealthScore(senders, total), [senders, total]);
  const { grade, label } = healthGrade(score);

  const toRemove = useMemo(
    () => senders.filter((s) => getRecommendation(s).suggestedAction === "remove"),
    [senders]
  );
  const suggestedDeletions = toRemove.flatMap((s) => s.messageIds).length;

  const gradeColour = grade === "A" ? "#4D8B78" : grade === "B" ? B.teal : grade === "C" ? B.muted : B.plum;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: B.bg, paddingBottom: 88 }}>
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <p style={{ color: B.teal, fontSize: 12, fontWeight: 700, letterSpacing: "0.2em" }} className="uppercase mb-2">
            Inbox Analysis
          </p>
          <h1 style={{ color: B.navy, fontWeight: 900, fontSize: 40 }}>Here's what we found.</h1>
        </div>

        {/* Score + metrics */}
        <div className="grid md:grid-cols-[200px_1fr] gap-6 mb-8">
          {/* Health grade */}
          <div style={{ backgroundColor: B.white, border: `1px solid ${B.border}`, padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <p style={{ color: B.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em" }} className="uppercase mb-3">Inbox Health</p>
            <div style={{ color: gradeColour, fontWeight: 900, fontSize: 80, lineHeight: 1 }}>{grade}</div>
            <div style={{ color: B.navy, fontWeight: 900, fontSize: 36, lineHeight: 1, marginTop: 4 }}>{score}</div>
            <p style={{ color: B.muted, fontSize: 13, fontWeight: 600, marginTop: 4 }}>{label}</p>
            <div style={{ marginTop: 16, width: "100%", height: 2, backgroundColor: B.border, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${score}%`, backgroundColor: gradeColour, transition: "width 0.7s ease" }} />
            </div>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: total.toLocaleString(),                label: "Emails scanned",      accent: B.navy },
              { value: senders.length.toLocaleString(),       label: "Unique senders",      accent: B.teal },
              { value: toRemove.length.toLocaleString(),      label: "Senders to review",   accent: B.plum },
              { value: suggestedDeletions.toLocaleString(),   label: "Suggested deletions", accent: B.tealLight },
            ].map(({ value, label, accent }) => (
              <div key={label} style={{ backgroundColor: B.white, border: `1px solid ${B.border}`, padding: 24, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", backgroundColor: accent }} />
                <p style={{ color: B.navy, fontWeight: 900, fontSize: 32, letterSpacing: "-0.02em", lineHeight: 1 }} className="mb-1">{value}</p>
                <p style={{ color: B.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em" }} className="uppercase">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top senders */}
        <div style={{ backgroundColor: B.white, border: `1px solid ${B.border}`, marginBottom: 32 }}>
          <div style={{ padding: "16px 24px", borderBottom: `1px solid ${B.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ color: B.navy, fontWeight: 700, fontSize: 12, letterSpacing: "0.15em" }} className="uppercase">Top Senders</p>
            <span style={{ color: B.muted, fontSize: 12 }}>{senders.length} total</span>
          </div>
          <ul>
            {senders.slice(0, 8).map((s, i) => {
              const rec = getRecommendation(s);
              return (
                <li key={s.email} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 24px", borderTop: i > 0 ? `1px solid ${B.border}` : "none" }}>
                  <SenderAvatar name={s.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: B.navy, fontWeight: 600, fontSize: 14 }} className="truncate">{s.name}</p>
                    <p style={{ color: B.muted, fontSize: 12 }} className="truncate">{s.email}</p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "2px 8px",
                    backgroundColor: rec.suggestedAction === "remove" ? B.plum + "18" : B.teal + "18",
                    color: rec.suggestedAction === "remove" ? B.plum : B.teal,
                  }} className="hidden sm:block">
                    {rec.label}
                  </span>
                  <span style={{ color: B.navy, fontWeight: 700, fontSize: 14, width: 40, textAlign: "right" }}>{s.count}</span>
                </li>
              );
            })}
          </ul>
          {senders.length > 8 && (
            <div style={{ padding: "12px 24px", borderTop: `1px solid ${B.border}` }}>
              <p style={{ color: B.muted, fontSize: 12 }}>+ {(senders.length - 8).toLocaleString()} more senders</p>
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: B.white, borderTop: `1px solid ${B.border}`, padding: "16px 24px", display: "flex", alignItems: "center", gap: 16, zIndex: 30 }}>
        <button
          onClick={onStartReview}
          style={{ backgroundColor: B.teal, color: B.white, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", padding: "12px 32px" }}
          className="uppercase hover:opacity-90 transition-opacity"
        >
          Start Review →
        </button>
        <button
          onClick={onRescan}
          style={{ color: B.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", borderBottom: `1px solid ${B.border}`, paddingBottom: 2 }}
          className="uppercase hover:opacity-70 transition-opacity"
        >
          Rescan inbox
        </button>
      </div>
    </div>
  );
}

export function SenderAvatar({ name }: { name: string }) {
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{ width: 32, height: 32, backgroundColor: `hsl(${hue},30%,38%)`, color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {initials || "?"}
    </div>
  );
}
