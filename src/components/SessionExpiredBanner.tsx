"use client";

import { signIn } from "next-auth/react";

const B = { navy: "#1C213E", teal: "#3B8590", white: "#FFFFFF", muted: "#6B7299", bg: "#F7F8FC", border: "#DDE1ED" };

export function SessionExpiredBanner({ provider }: { provider?: string }) {
  const providerId = provider === "google" ? "google" : "microsoft-entra-id";
  const label = provider === "google" ? "Gmail" : "Outlook";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: B.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ backgroundColor: B.white, border: `1px solid ${B.border}`, padding: "40px 48px", maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ width: 32, height: 2, backgroundColor: B.teal, margin: "0 auto 24px" }} />
        <p style={{ color: B.navy, fontWeight: 900, fontSize: 22, marginBottom: 12 }}>Session expired</p>
        <p style={{ color: B.muted, fontSize: 14, fontWeight: 300, lineHeight: 1.6, marginBottom: 28 }}>
          Your {label} session has timed out. Sign in again to continue — your progress is safe.
        </p>
        <button
          onClick={() => signIn(providerId, {}, { prompt: "select_account" })}
          style={{ backgroundColor: B.teal, color: B.white, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", padding: "14px 32px", width: "100%" }}
          className="uppercase hover:opacity-90 transition-opacity"
        >
          Sign back in →
        </button>
      </div>
    </div>
  );
}
