"use client";

import { useEffect, useState } from "react";
import type { SenderGroup } from "@/types";

const B = { navy: "#1C213E", teal: "#3B8590", tealLight: "#7BC7CC", navyLight: "#2E3662", white: "#FFFFFF" };

interface Props {
  onComplete: (data: { senders: SenderGroup[]; total: number }) => void;
  onError: (msg: string) => void;
}

const STAGES = [
  "Connecting to inbox",
  "Analysing messages",
  "Identifying subscriptions",
  "Grouping senders",
  "Generating recommendations",
  "Preparing review session",
];

const NODES: { x: number; y: number; r: number }[] = [
  { x: 0.5,  y: 0.5,  r: 4 },
  { x: 0.18, y: 0.22, r: 2.5 },
  { x: 0.78, y: 0.18, r: 3 },
  { x: 0.82, y: 0.72, r: 2.5 },
  { x: 0.22, y: 0.78, r: 3 },
  { x: 0.12, y: 0.5,  r: 2 },
  { x: 0.88, y: 0.45, r: 2 },
  { x: 0.5,  y: 0.12, r: 2.5 },
  { x: 0.5,  y: 0.88, r: 2 },
  { x: 0.32, y: 0.38, r: 1.5 },
  { x: 0.68, y: 0.36, r: 1.5 },
  { x: 0.65, y: 0.65, r: 1.5 },
  { x: 0.35, y: 0.64, r: 1.5 },
];

const EDGES: [number, number][] = [
  [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],
  [1,5],[1,9],[2,7],[2,10],[3,6],[3,11],[4,8],[4,12],
  [9,10],[10,11],[11,12],[12,9],
];

export function ScanScreen({ onComplete, onError }: Props) {
  const [stageIdx, setStageIdx]   = useState(0);
  const [displayCount, setDisplayCount] = useState(0);
  const [activeEdge, setActiveEdge] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setStageIdx((s) => Math.min(s + 1, STAGES.length - 1)), 900);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setActiveEdge((e) => (e + 1) % EDGES.length), 180);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/emails")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to load emails");
        if (!cancelled) {
          // Animate counter up to real value
          let n = 0;
          const target: number = data.total;
          const step = Math.max(1, Math.round(target / 60));
          const iv = setInterval(() => {
            n = Math.min(n + step, target);
            setDisplayCount(n);
            if (n >= target) clearInterval(iv);
          }, 24);
          setTimeout(() => { if (!cancelled) onComplete(data); }, 700);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        const raw: string = e?.message ?? "";
        // Replace cryptic technical errors with something human-readable
        const friendly = raw.startsWith("Failed to fetch") || raw.startsWith("NetworkError")
          ? "Could not reach the server. Check your connection and try again."
          : raw.length > 0 && raw.length < 120 && !/pattern|token|unexpected|syntaxerror/i.test(raw)
            ? raw
            : "Something went wrong loading your inbox. Please sign out and sign back in.";
        onError(friendly);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const W = 520, H = 300;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: B.navy, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>

      {/* Network */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ opacity: 0.75, maxWidth: "100%" }} aria-hidden="true">
        {EDGES.map(([a, b], i) => {
          const active = i === activeEdge || i === (activeEdge + 1) % EDGES.length;
          return (
            <line key={i}
              x1={NODES[a].x * W} y1={NODES[a].y * H}
              x2={NODES[b].x * W} y2={NODES[b].y * H}
              stroke={active ? B.tealLight : B.navyLight}
              strokeWidth={active ? 1 : 0.5}
              style={{ transition: "stroke 0.18s ease" }}
            />
          );
        })}
        {NODES.map((n, i) => (
          <g key={i}>
            <circle cx={n.x * W} cy={n.y * H} r={n.r * 4} fill={B.teal} opacity={0.06} />
            <circle cx={n.x * W} cy={n.y * H} r={n.r} fill={i === 0 ? B.tealLight : B.teal} />
          </g>
        ))}
      </svg>

      {/* Counter */}
      <div style={{ textAlign: "center", marginBottom: 32, marginTop: 32 }}>
        <p style={{ color: B.white, fontWeight: 900, fontSize: 64, letterSpacing: "-0.02em", lineHeight: 1 }}>
          {displayCount.toLocaleString()}
        </p>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", marginTop: 6 }} className="uppercase">
          Emails analysed
        </p>
      </div>

      {/* Stage */}
      <p key={stageIdx} style={{ color: B.tealLight, fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 24 }}
        className="fade-in uppercase">
        {STAGES[stageIdx]}…
      </p>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 6 }}>
        {STAGES.map((_, i) => (
          <div key={i} style={{
            height: 2,
            width: i <= stageIdx ? 24 : 8,
            backgroundColor: i <= stageIdx ? B.teal : B.navyLight,
            transition: "all 0.5s ease",
          }} />
        ))}
      </div>
    </div>
  );
}
