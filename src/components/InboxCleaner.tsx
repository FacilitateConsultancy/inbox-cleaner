"use client";

import { useState, useCallback } from "react";
import { AppNav } from "./AppNav";
import { ScanScreen } from "./ScanScreen";
import { DashboardScreen } from "./DashboardScreen";
import { ReviewScreen } from "./ReviewScreen";
import { ConfirmationScreen } from "./ConfirmationScreen";
import { SuccessScreen } from "./SuccessScreen";
import { IntelligenceScreen } from "./IntelligenceScreen";
import type { SenderGroup, SenderDecision } from "@/types";

type Stage = "scanning" | "dashboard" | "review" | "confirming" | "deleting" | "done" | "intelligence";

interface DoneResult { deleted: number; failed: number }

export function InboxCleaner({ userEmail }: { userEmail: string }) {
  const [stage, setStage] = useState<Stage>("scanning");
  const [senders, setSenders] = useState<SenderGroup[]>([]);
  const [totalEmails, setTotalEmails] = useState(0);
  const [decisions, setDecisions] = useState<SenderDecision>({});
  const [history, setHistory] = useState<string[]>([]); // email undo stack
  const [result, setResult] = useState<DoneResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScanComplete = useCallback(
    (data: { senders: SenderGroup[]; total: number }) => {
      setSenders(data.senders);
      setTotalEmails(data.total);
      setDecisions({});
      setHistory([]);
      setStage("dashboard");
    },
    []
  );

  const handleScanError = useCallback((msg: string) => {
    setError(msg);
    setStage("dashboard");
  }, []);

  const decide = useCallback((email: string, action: import("@/types").SenderAction) => {
    setDecisions((prev) => ({ ...prev, [email]: action }));
    setHistory((h) => [...h, email]);
  }, []);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setDecisions((prev) => {
      const next = { ...prev };
      delete next[last];
      return next;
    });
  }, [history]);

  const toRemove = senders.filter((s) => decisions[s.email] === "remove" || decisions[s.email] === "unsubscribe");
  const idsToDelete = toRemove.flatMap((s) => s.messageIds);

  const confirmDelete = async () => {
    setStage("deleting");
    setError(null);
    try {
      const res = await fetch("/api/emails/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageIds: idsToDelete }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      setResult(data);
      setStage("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setStage("confirming");
    }
  };

  const reset = () => {
    setSenders([]);
    setDecisions({});
    setHistory([]);
    setResult(null);
    setError(null);
    setStage("scanning");
  };

  const decided = senders.filter(
    (s) => decisions[s.email] && decisions[s.email] !== "undecided"
  );

  // Nav props per stage
  const navStage: Record<Stage, string> = {
    scanning: "Scanning",
    dashboard: "Analysis",
    review: "Review",
    confirming: "Confirm",
    deleting: "Deleting",
    done: "Complete",
    intelligence: "Intelligence",
  };

  // Full-screen stages (no nav)
  const fullScreen = stage === "scanning" || stage === "done";


  return (
    <>
      {!fullScreen && (
        <AppNav
          userEmail={userEmail}
          stage={navStage[stage]}
          onHome={() => setStage("dashboard")}
          progress={
            stage === "review"
              ? { current: decided.length, total: senders.length }
              : undefined
          }
        />
      )}

      {error && (
        <div className="max-w-2xl mx-auto px-6 pt-6">
          <div style={{ backgroundColor: "#F2EBF0", border: "1px solid #4B2C4240", color: "#4B2C42", padding: "12px 16px", fontSize: 14, fontWeight: 500 }}>
            {error}
          </div>
        </div>
      )}

      {stage === "scanning" && (
        <ScanScreen onComplete={handleScanComplete} onError={handleScanError} />
      )}

      {stage === "dashboard" && (
        <DashboardScreen
          senders={senders}
          total={totalEmails}
          onStartReview={() => setStage("review")}
          onRescan={reset}
          onIntelligence={() => setStage("intelligence")}
        />
      )}

      {stage === "intelligence" && (
        <IntelligenceScreen senders={senders} onRescan={reset} />
      )}

      {stage === "review" && (
        <ReviewScreen
          senders={senders}
          decisions={decisions}
          onDecide={decide}
          onUndo={undo}
          onFinish={() => toRemove.length > 0 ? setStage("confirming") : setStage("dashboard")}
        />
      )}

      {stage === "confirming" && (
        <ConfirmationScreen
          sendersToRemove={toRemove}
          emailCount={idsToDelete.length}
          decisions={decisions}
          onConfirm={confirmDelete}
          onBack={() => setStage("review")}
        />
      )}

      {stage === "deleting" && (
        <DeletingScreen count={idsToDelete.length} />
      )}

      {stage === "done" && result && (
        <SuccessScreen
          deleted={result.deleted}
          failed={result.failed}
          sendersRemoved={toRemove.length}
          onReset={reset}
        />
      )}
    </>
  );
}

function DeletingScreen({ count }: { count: number }) {
  return (
    <div style={{ minHeight: "calc(100vh - 56px)", backgroundColor: "#F7F8FC", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <div style={{ width: 32, height: 2, backgroundColor: "#3B8590", animation: "pulse 1.5s ease infinite" }} />
      <p style={{ color: "#1C213E", fontWeight: 900, fontSize: 24 }}>
        Deleting {count.toLocaleString()} emails…
      </p>
      <p style={{ color: "#6B7299", fontWeight: 300, fontSize: 14 }}>This may take a moment.</p>
    </div>
  );
}
