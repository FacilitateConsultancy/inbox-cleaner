"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FacilitateLogo } from "./LandingPage";

const B = { navy: "#1C213E", navyLight: "#2E3662", teal: "#3B8590", tealLight: "#7BC7CC", muted: "#6B7299", white: "#FFFFFF" };

interface Props {
  deleted: number;
  failed: number;
  sendersRemoved: number;
  onReset: () => void;
}

export function SuccessScreen({ deleted, failed, sendersRemoved, onReset }: Props) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: B.navy, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <div style={{ maxWidth: 560, width: "100%", textAlign: "center" }}>
        <div style={{ marginBottom: 48 }}><FacilitateLogo light /></div>

        <div style={{ width: 48, height: 2, backgroundColor: B.teal, margin: "0 auto 32px" }} />

        <p style={{ color: B.tealLight, fontSize: 11, fontWeight: 700, letterSpacing: "0.2em", marginBottom: 16 }} className="uppercase">Complete</p>

        <h1 style={{ color: B.white, fontWeight: 900, lineHeight: 0.92, letterSpacing: "-0.02em", fontSize: "clamp(2.5rem,6vw,5rem)", marginBottom: 20 }}>
          Inbox<br /><span style={{ color: B.tealLight }}>cleared.</span>
        </h1>

        <p style={{ color: "rgba(255,255,255,0.5)", fontWeight: 300, fontSize: 18, marginBottom: 56 }}>
          Your inbox is now leaner. Review again periodically to maintain it.
        </p>

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, backgroundColor: "rgba(255,255,255,0.08)", marginBottom: 48 }}>
          <Metric target={deleted}        label="Emails deleted"   delay={0} />
          <Metric target={sendersRemoved} label="Senders removed"  delay={150} />
          <Metric target={failed}         label="Failed"           delay={300} dim={failed === 0} />
        </div>

        {failed > 0 && (
          <p style={{ color: B.teal, fontSize: 14, marginBottom: 32 }}>
            {failed} email{failed !== 1 ? "s" : ""} could not be deleted (likely already removed).
          </p>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
          <button onClick={onReset}
            style={{ backgroundColor: B.teal, color: B.white, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", padding: "16px 32px" }}
            className="uppercase hover:opacity-90 transition-opacity">
            Clean again
          </button>
          <Link href="/"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "16px 32px", border: `1px solid rgba(255,255,255,0.15)`, color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 11, letterSpacing: "0.15em" }}
            className="uppercase hover:opacity-80 transition-opacity">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

function Metric({ target, label, delay, dim }: { target: number; label: string; delay: number; dim?: boolean }) {
  const [val, setVal] = useState(0);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const t = setTimeout(() => {
      if (target === 0) return;
      let n = 0;
      const step = Math.max(1, Math.round(target / 40));
      const iv = setInterval(() => {
        n = Math.min(n + step, target);
        setVal(n);
        if (n >= target) clearInterval(iv);
      }, 30);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);

  return (
    <div style={{ backgroundColor: B.navyLight, padding: "32px 16px" }}>
      <p style={{ color: dim ? "rgba(255,255,255,0.2)" : B.white, fontWeight: 900, fontSize: 36, lineHeight: 1, marginBottom: 8 }}>
        {val.toLocaleString()}
      </p>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em" }} className="uppercase">{label}</p>
    </div>
  );
}
