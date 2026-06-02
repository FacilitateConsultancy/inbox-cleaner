"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { SenderGroup, SenderAction } from "@/types";
import { getRecommendation } from "@/lib/recommendations";
import { SenderAvatar } from "./DashboardScreen";

const B = { navy: "#1C213E", teal: "#3B8590", tealLight: "#7BC7CC", plum: "#4B2C42", muted: "#6B7299", border: "#DDE1ED", bg: "#F7F8FC", bgMid: "#ECEEF5", white: "#FFFFFF" };

type ExitDir = "right" | "left" | null;

interface Props {
  sender: SenderGroup;
  stackIndex: number;
  onDecide: (decision: SenderAction) => void;
}

const THRESHOLD = 90;

type UnsubStatus = "idle" | "loading" | "done-auto" | "done-link" | "done-mailto" | "not-found";

export function SwipeCard({ sender, stackIndex, onDecide }: Props) {
  const [offset, setOffset]         = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging]  = useState(false);
  const [exitDir, setExitDir]        = useState<ExitDir>(null);
  const [unsubStatus, setUnsubStatus] = useState<UnsubStatus>("idle");
  const startRef = useRef({ x: 0, y: 0 });
  const rec = getRecommendation(sender);

  const triggerExit = useCallback((dir: ExitDir) => {
    setExitDir(dir);
    setTimeout(() => onDecide(dir === "right" ? "keep" : "remove"), 420);
  }, [onDecide]);

  const handleUnsubscribe = useCallback(async () => {
    setUnsubStatus("loading");
    try {
      const res = await fetch("/api/emails/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: sender.messageIds[0] }),
      });
      const data = await res.json();

      if (data.method === "one-click") {
        // Server sent the POST — done automatically
        setUnsubStatus("done-auto");
      } else if (data.method === "link" && data.url) {
        // Open link in new tab for manual confirmation
        window.open(data.url, "_blank", "noopener");
        setUnsubStatus("done-link");
      } else if (data.method === "mailto" && data.url) {
        window.open(data.url, "_blank", "noopener");
        setUnsubStatus("done-mailto");
      } else {
        setUnsubStatus("not-found");
      }
    } catch {
      setUnsubStatus("not-found");
    }
    // Short pause so the user sees the status before card exits
    setTimeout(() => onDecide("unsubscribe"), 900);
  }, [sender.messageIds, onDecide]);

  useEffect(() => {
    if (stackIndex !== 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") triggerExit("right");
      if (e.key === "ArrowLeft")  triggerExit("left");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stackIndex, triggerExit]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (stackIndex !== 0) return;
    setIsDragging(true);
    startRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - startRef.current.x, y: e.clientY - startRef.current.y });
  };
  const onPointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (offset.x > THRESHOLD) triggerExit("right");
    else if (offset.x < -THRESHOLD) triggerExit("left");
    else setOffset({ x: 0, y: 0 });
  };

  const rotation     = isDragging ? offset.x * 0.06 : 0;
  const keepOpacity  = Math.max(0, Math.min(1, offset.x / THRESHOLD));
  const removeOpacity = Math.max(0, Math.min(1, -offset.x / THRESHOLD));

  const stackScale = 1 - stackIndex * 0.03;
  const stackY     = stackIndex * 10;

  if (stackIndex > 2) return null;

  const latestDate = new Date(sender.latestDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div
      className={`absolute inset-x-0 mx-auto w-full max-w-md
        ${stackIndex === 0 ? (exitDir === "right" ? "fly-right" : exitDir === "left" ? "fly-left" : "") : "pointer-events-none"}
        ${stackIndex === 0 ? "cursor-grab active:cursor-grabbing" : ""}
      `}
      style={{
        transform: exitDir ? undefined : `translateY(${stackY}px) scale(${stackScale}) translateX(${isDragging ? offset.x : 0}px) rotate(${rotation}deg)`,
        transition: isDragging || exitDir ? "none" : "transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)",
        zIndex: 10 - stackIndex,
        opacity: stackIndex === 2 ? 0.5 : 1,
        userSelect: "none",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div style={{ backgroundColor: B.white, border: `1px solid ${B.border}`, position: "relative", overflow: "hidden" }}>

        {/* Swipe overlays */}
        {stackIndex === 0 && (
          <>
            <div style={{ position: "absolute", inset: 0, backgroundColor: B.teal + "15", border: `2px solid ${B.teal}`, opacity: keepOpacity, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>
              <span style={{ color: B.teal, fontWeight: 900, fontSize: 22, letterSpacing: "0.2em", transform: "rotate(-12deg)" }}>KEEP</span>
            </div>
            <div style={{ position: "absolute", inset: 0, backgroundColor: B.plum + "15", border: `2px solid ${B.plum}`, opacity: removeOpacity, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>
              <span style={{ color: B.plum, fontWeight: 900, fontSize: 22, letterSpacing: "0.2em", transform: "rotate(12deg)" }}>REMOVE</span>
            </div>
          </>
        )}

        {/* Header */}
        <div style={{ backgroundColor: B.bgMid, padding: "32px 24px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <SenderAvatar name={sender.name} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: B.navy, fontWeight: 700, fontSize: 18, lineHeight: 1.2 }} className="truncate">{sender.name}</p>
              <p style={{ color: B.muted, fontSize: 13 }} className="truncate">{sender.email}</p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ color: B.navy, fontWeight: 900, fontSize: 32, lineHeight: 1 }}>{sender.count}</p>
              <p style={{ color: B.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.15em" }} className="uppercase">emails</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Latest activity */}
          <div>
            <p style={{ color: B.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", marginBottom: 4 }} className="uppercase">Latest activity</p>
            <p style={{ color: B.navy, fontSize: 14, fontWeight: 600 }}>{latestDate}</p>
          </div>

          {/* Recommendation */}
          <div style={{ borderLeft: `2px solid ${B.teal}`, paddingLeft: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", padding: "2px 8px",
                backgroundColor: rec.suggestedAction === "remove" ? B.plum + "18" : B.teal + "18",
                color: rec.suggestedAction === "remove" ? B.plum : B.teal,
              }} className="uppercase">{rec.label}</span>
              <span style={{ color: B.muted, fontSize: 10, fontWeight: 600 }}>{rec.confidence}% confidence</span>
            </div>
            <p style={{ color: B.muted, fontSize: 13, fontWeight: 300, lineHeight: 1.6 }}>{rec.detail}</p>
            <div style={{ marginTop: 8, height: 2, backgroundColor: B.border, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${rec.confidence}%`, backgroundColor: rec.suggestedAction === "remove" ? B.plum : B.teal }} />
            </div>
          </div>

          {/* Tags */}
          {rec.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {rec.tags.map((t) => (
                <span key={t} style={{ backgroundColor: B.bgMid, color: B.muted, fontSize: 10, fontWeight: 700, padding: "2px 8px", letterSpacing: "0.1em" }} className="uppercase">{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {stackIndex === 0 && (
          <div style={{ padding: "0 24px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              onClick={() => triggerExit("left")}
              style={{ padding: "14px 0", backgroundColor: B.plum + "12", color: B.plum, fontWeight: 700, fontSize: 12, letterSpacing: "0.15em", border: `1px solid ${B.plum}30` }}
              className="uppercase hover:opacity-80 transition-opacity"
            >
              ← Remove
            </button>
            <button
              onClick={() => triggerExit("right")}
              style={{ padding: "14px 0", backgroundColor: B.teal + "12", color: B.teal, fontWeight: 700, fontSize: 12, letterSpacing: "0.15em", border: `1px solid ${B.teal}30` }}
              className="uppercase hover:opacity-80 transition-opacity"
            >
              Keep →
            </button>
            <button
              onClick={handleUnsubscribe}
              disabled={unsubStatus === "loading" || unsubStatus === "done-auto" || unsubStatus === "done-link" || unsubStatus === "done-mailto"}
              style={{
                gridColumn: "span 2", padding: "12px 0", fontWeight: 700, fontSize: 11, letterSpacing: "0.15em",
                backgroundColor: unsubStatus === "done-auto" || unsubStatus === "done-link" || unsubStatus === "done-mailto" ? B.teal + "18" : B.bgMid,
                color: unsubStatus === "done-auto" || unsubStatus === "done-link" || unsubStatus === "done-mailto" ? B.teal : unsubStatus === "not-found" ? B.plum : B.muted,
                border: `1px solid ${unsubStatus === "done-auto" || unsubStatus === "done-link" || unsubStatus === "done-mailto" ? B.teal + "40" : B.border}`,
              }}
              className="uppercase hover:opacity-80 transition-opacity disabled:opacity-60"
            >
              {unsubStatus === "idle"       && "✕ Unsubscribe + Remove"}
              {unsubStatus === "loading"    && "Checking unsubscribe link…"}
              {unsubStatus === "done-auto"  && "✓ Unsubscribed automatically"}
              {unsubStatus === "done-link"  && "✓ Check new tab to confirm"}
              {unsubStatus === "done-mailto"&& "✓ Check new tab (mailto)"}
              {unsubStatus === "not-found"  && "No unsubscribe link found"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
