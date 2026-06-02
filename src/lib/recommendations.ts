import type { SenderGroup } from "@/types";

export interface Recommendation {
  label: string;
  detail: string;
  confidence: number; // 0-100
  suggestedAction: "keep" | "remove";
  tags: string[];
}

const AUTOMATED = [
  "noreply", "no-reply", "donotreply", "do-not-reply",
  "newsletter", "newsletters", "mailer", "digest",
  "notifications@", "updates@", "alerts@", "info@",
  "hello@", "team@", "support@", "news@",
];

const PROMOTIONAL = [
  "deals", "offers", "promo", "sale", "discount",
  "marketing", "shop", "store", "order", "shipping",
  "receipt", "invoice", "confirm",
];

export function getRecommendation(sender: SenderGroup): Recommendation {
  const em = sender.email.toLowerCase();
  const nm = sender.name.toLowerCase();
  const n = sender.count;

  const isAutomated = AUTOMATED.some((p) => em.includes(p));
  const isPromo = PROMOTIONAL.some((p) => em.includes(p) || nm.includes(p));

  if (isAutomated && n > 20) {
    return {
      label: "Automated Sender",
      detail: `${n} automated messages detected. No replies expected.`,
      confidence: 91,
      suggestedAction: "remove",
      tags: ["Automated", "High volume"],
    };
  }

  if (isAutomated) {
    return {
      label: "Automated Sender",
      detail: "System-generated emails from a no-reply address.",
      confidence: 82,
      suggestedAction: "remove",
      tags: ["Automated"],
    };
  }

  if (isPromo && n > 10) {
    return {
      label: "Promotional",
      detail: "Marketing and promotional content detected.",
      confidence: 84,
      suggestedAction: "remove",
      tags: ["Promotional", "Marketing"],
    };
  }

  if (n > 200) {
    return {
      label: "Very High Volume",
      detail: `${n.toLocaleString()} emails detected — extremely high for a single sender.`,
      confidence: 88,
      suggestedAction: "remove",
      tags: ["High volume", "Likely subscription"],
    };
  }

  if (n > 50) {
    return {
      label: "High Frequency",
      detail: `${n} emails suggests a subscription or mailing list.`,
      confidence: 74,
      suggestedAction: "remove",
      tags: ["Frequent sender"],
    };
  }

  if (n > 15) {
    return {
      label: "Regular Correspondence",
      detail: "Moderate volume. Could be a newsletter or active contact.",
      confidence: 55,
      suggestedAction: "keep",
      tags: ["Regular"],
    };
  }

  if (n <= 5) {
    return {
      label: "Infrequent Contact",
      detail: "Low email count. Likely a real person or important sender.",
      confidence: 78,
      suggestedAction: "keep",
      tags: ["Low volume", "Personal"],
    };
  }

  return {
    label: "Standard Sender",
    detail: "No strong signals detected. Review manually.",
    confidence: 48,
    suggestedAction: "keep",
    tags: [],
  };
}

export function calcHealthScore(senders: SenderGroup[], total: number): number {
  if (total === 0) return 100;

  const highVol = senders.filter((s) => s.count > 30).length;
  const autoCount = senders.filter((s) =>
    AUTOMATED.some((p) => s.email.toLowerCase().includes(p))
  ).length;

  const highVolPct = highVol / Math.max(senders.length, 1);
  const autoPct = autoCount / Math.max(senders.length, 1);
  const volumePenalty = Math.min(total / 2000, 1) * 25;

  const score =
    100 - highVolPct * 35 - autoPct * 25 - volumePenalty;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function healthGrade(score: number): { grade: string; label: string } {
  if (score >= 80) return { grade: "A", label: "Excellent" };
  if (score >= 65) return { grade: "B", label: "Good" };
  if (score >= 50) return { grade: "C", label: "Fair" };
  if (score >= 35) return { grade: "D", label: "Poor" };
  return { grade: "F", label: "Critical" };
}
