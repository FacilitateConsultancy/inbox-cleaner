"use client";

import { signOut } from "next-auth/react";
import { FacilitateLogo } from "./LandingPage";

const B = { navy: "#1C213E", teal: "#3B8590", border: "#DDE1ED", muted: "#6B7299", white: "#FFFFFF", bg: "#F7F8FC" };

interface Props {
  userEmail?: string;
  stage?: string;
  progress?: { current: number; total: number };
  onHome?: () => void;
}

export function AppNav({ userEmail, stage, progress, onHome }: Props) {
  return (
    <header style={{ backgroundColor: B.white, borderBottom: `1px solid ${B.border}`, position: "sticky", top: 0, zIndex: 20 }}>
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <FacilitateLogo />

        {progress && progress.total > 0 && (
          <div className="flex-1 max-w-xs hidden md:flex items-center gap-3">
            <div style={{ flex: 1, height: 2, backgroundColor: B.border, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                backgroundColor: B.teal,
                width: `${(progress.current / progress.total) * 100}%`,
                transition: "width 0.5s ease",
              }} />
            </div>
            <span style={{ color: B.muted, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
              {progress.current} / {progress.total}
            </span>
          </div>
        )}

        <div className="flex items-center gap-5 ml-auto">
          {stage && (
            <span style={{ color: B.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em" }} className="hidden sm:block uppercase">
              {stage}
            </span>
          )}
          {userEmail && (
            <span style={{ color: B.muted, fontSize: 12 }} className="hidden md:block truncate max-w-[200px]">
              {userEmail}
            </span>
          )}
          <button
            onClick={onHome}
            style={{ color: B.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em" }}
            className="uppercase hover:opacity-70 transition-opacity"
          >
            ← Home
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{ color: B.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em" }}
            className="uppercase hover:opacity-70 transition-opacity"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
