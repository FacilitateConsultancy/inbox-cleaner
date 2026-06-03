import type { EmailCategory, RuleAction, CategoryGroup, IntelligenceRule, IntelligenceResult } from "@/types";

// ── Pattern definitions ─────────────────────────────────────────────────────

const PATTERNS: Record<EmailCategory, RegExp[]> = {
  "Order Confirmation": [
    /order\s*(confirmation|confirmed|#|number|placed|received)/i,
    /thank you for (your )?(order|purchase)/i,
    /your (order|purchase) (has been )?(placed|received|confirmed)/i,
    /order\s+[A-Z0-9\-]{5,}/i,
    /purchase confirmation/i,
    /order summary/i,
  ],
  "Receipt": [
    /\breceipt\b/i,
    /\binvoice\b/i,
    /payment (received|confirmed|processed|successful)/i,
    /amount (charged|paid)/i,
    /your (bill|payment|charge)/i,
    /transaction receipt/i,
    /tax invoice/i,
  ],
  "Shipping Update": [
    /ship(ped|ping|ment)/i,
    /dispatch(ed)?/i,
    /out for delivery/i,
    /delivery (update|confirmation|notification|attempt)/i,
    /tracking (number|update|info)/i,
    /on its way/i,
    /arriving (today|tomorrow|soon)/i,
    /your package/i,
    /estimated delivery/i,
    /courier/i,
  ],
  "Return & Refund": [
    /return (confirmed|received|processed|request)/i,
    /refund (issued|processed|confirmed|approved)/i,
    /exchange (confirmed|processed)/i,
    /your return/i,
    /money back/i,
  ],
  "Newsletter": [
    /newsletter/i,
    /weekly (digest|roundup|update|edition)/i,
    /monthly (digest|roundup|update|newsletter|edition)/i,
    /your (weekly|monthly|daily) (update|digest|brief)/i,
    /edition #\d+/i,
    /this week (in|at|from)/i,
    /roundup/i,
    /digest/i,
  ],
  "Promotion": [
    /\d+\s*%\s*off/i,
    /(exclusive|special|personalised|personalized) (offer|deal|discount)/i,
    /promo(tion)? code/i,
    /\bcoupon\b/i,
    /limited (time|offer)/i,
    /flash (sale|deal)/i,
    /ends (today|tonight|soon|sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i,
    /last chance/i,
    /don't miss (out|this)/i,
    /hurry[,!]/i,
    /just for you/i,
    /members? (only|exclusive)/i,
  ],
  "Sale Alert": [
    /sale (starts|now on|event|alert|live|on now)/i,
    /\bbig sale\b/i,
    /mega sale/i,
    /black friday/i,
    /cyber monday/i,
    /(summer|winter|spring|autumn|seasonal) sale/i,
    /\bclearance\b/i,
    /up to \d+% off/i,
    /everything (is )?\d+% off/i,
    /\bsale\b.{0,20}\bstarted\b/i,
  ],
  "Travel": [
    /booking (confirmation|reference|details)/i,
    /flight (confirmation|booking|details|check.in)/i,
    /hotel (confirmation|booking|reservation)/i,
    /reservation (confirmed|details)/i,
    /\bitinerary\b/i,
    /check.in (reminder|details|open)/i,
    /boarding (pass|card)/i,
    /e.?ticket/i,
    /car hire/i,
    /holiday booking/i,
  ],
  "Finance": [
    /statement (ready|available|enclosed)/i,
    /account (statement|balance|summary|update)/i,
    /transaction (alert|notification)/i,
    /payment (due|reminder|overdue)/i,
    /your (balance|account activity)/i,
    /bank statement/i,
    /tax (return|statement|document|summary)/i,
    /pension/i,
    /investment (update|statement)/i,
    /mortgage/i,
  ],
  "Social": [
    /mentioned you/i,
    /sent you a message/i,
    /connected with you/i,
    /accepted your (connection|invitation|request)/i,
    /new (follower|connection|comment|like|message)/i,
    /commented on your/i,
    /liked your/i,
    /tagged you/i,
    /friend request/i,
  ],
  "Other": [],
};

// ── Suggested actions per category ─────────────────────────────────────────

export const DEFAULT_ACTIONS: Record<EmailCategory, RuleAction> = {
  "Order Confirmation": "move",
  "Receipt":            "move",
  "Shipping Update":    "move",
  "Return & Refund":    "move",
  "Newsletter":         "unsubscribe",
  "Promotion":          "delete",
  "Sale Alert":         "delete",
  "Travel":             "move",
  "Finance":            "move",
  "Social":             "keep",
  "Other":              "keep",
};

export const FOLDER_MAP: Partial<Record<EmailCategory, string>> = {
  "Order Confirmation": "Orders & Deliveries",
  "Receipt":            "Receipts",
  "Shipping Update":    "Orders & Deliveries",
  "Return & Refund":    "Orders & Deliveries",
  "Travel":             "Travel",
  "Finance":            "Finance",
  "Newsletter":         "Newsletters",
};

export const CATEGORY_DESCRIPTIONS: Record<EmailCategory, string> = {
  "Order Confirmation": "Move to Orders & Deliveries folder",
  "Receipt":            "Move to Receipts folder",
  "Shipping Update":    "Move to Orders & Deliveries folder",
  "Return & Refund":    "Move to Orders & Deliveries folder",
  "Newsletter":         "Unsubscribe and remove from inbox",
  "Promotion":          "Delete promotional emails",
  "Sale Alert":         "Delete sale alerts",
  "Travel":             "Move to Travel folder",
  "Finance":            "Move to Finance folder",
  "Social":             "Keep in inbox",
  "Other":              "Keep in inbox",
};

// ── Sender email pattern hints ───────────────────────────────────────────────

const SENDER_HINTS: Partial<Record<EmailCategory, RegExp[]>> = {
  "Newsletter":         [/newsletter/i, /digest/i, /weekly/i, /monthly/i, /updates?@/i, /news@/i, /editorial/i],
  "Promotion":          [/promo/i, /offers?@/i, /deals?@/i, /marketing@/i, /discount/i, /savings/i],
  "Order Confirmation": [/orders?@/i, /order-confirm/i, /purchase/i, /checkout/i],
  "Shipping Update":    [/shipping@/i, /dispatch/i, /delivery@/i, /track/i, /courier/i, /parcel/i, /postage/i],
  "Receipt":            [/receipts?@/i, /invoice/i, /billing@/i, /payment@/i, /noreply.*shop/i],
  "Finance":            [/bank/i, /finance/i, /statement/i, /account.*@/i, /invest/i, /pension/i],
  "Travel":             [/booking/i, /travel/i, /hotel/i, /flight/i, /airline/i, /reservation/i],
  "Social":             [/twitter/i, /linkedin/i, /facebook/i, /instagram/i, /notifications?@/i],
};

export function classifyEmail(subject: string, senderEmail: string, senderName: string): { category: EmailCategory; confidence: number } {
  const scores: Partial<Record<EmailCategory, number>> = {};

  // Subject pattern matching
  for (const [cat, patterns] of Object.entries(PATTERNS) as [EmailCategory, RegExp[]][]) {
    if (patterns.length === 0) continue;
    let matched = 0;
    for (const p of patterns) {
      if (p.test(subject)) matched++;
    }
    if (matched > 0) {
      scores[cat] = (scores[cat] ?? 0) + matched / patterns.length;
    }
  }

  // Sender email/name hints (lower weight)
  const senderStr = `${senderEmail} ${senderName}`;
  for (const [cat, hints] of Object.entries(SENDER_HINTS) as [EmailCategory, RegExp[]][]) {
    for (const h of hints) {
      if (h.test(senderStr)) {
        scores[cat] = (scores[cat] ?? 0) + 0.15;
        break;
      }
    }
  }

  // noreply / no-reply senders are almost always automated — boost newsletter/promo
  if (/no.?reply|donotreply/i.test(senderEmail)) {
    scores["Newsletter"] = (scores["Newsletter"] ?? 0) + 0.1;
    scores["Promotion"]  = (scores["Promotion"]  ?? 0) + 0.05;
  }

  const sorted = (Object.entries(scores) as [EmailCategory, number][])
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) return { category: "Other", confidence: 40 };

  const [topCat, topScore] = sorted[0];
  const confidence = Math.min(95, Math.round(40 + topScore * 180));
  return { category: topCat, confidence };
}

/** Backwards compat — classify by subject only */
export function classifySubject(subject: string): { category: EmailCategory; confidence: number } {
  return classifyEmail(subject, "", "");
}

// ── Analyse a batch of messages ─────────────────────────────────────────────

interface RawMessage {
  id: string;
  subject: string;
  senderEmail: string;
  senderName: string;
}

interface FullSender {
  email: string;
  name: string;
  messageIds: string[];
}

/**
 * Classify a sample of messages, then expand message IDs to the full sender
 * dataset. This means rules cover ALL emails from classified senders — not
 * just the sampled subset.
 */
export function analyseMessages(messages: RawMessage[], allSenders?: FullSender[]): IntelligenceResult {
  // Build a sender → category map from the sample
  const senderCategoryVotes = new Map<string, { votes: Map<EmailCategory, number>; confidences: number[]; name: string }>();

  for (const msg of messages) {
    const { category, confidence } = classifyEmail(msg.subject, msg.senderEmail, msg.senderName);
    if (category === "Other") continue;
    if (!senderCategoryVotes.has(msg.senderEmail)) {
      senderCategoryVotes.set(msg.senderEmail, { votes: new Map(), confidences: [], name: msg.senderName });
    }
    const entry = senderCategoryVotes.get(msg.senderEmail)!;
    entry.votes.set(category, (entry.votes.get(category) ?? 0) + 1);
    entry.confidences.push(confidence);
  }

  // For each sender, pick the winning category
  const senderCategory = new Map<string, { category: EmailCategory; confidence: number; name: string }>();
  for (const [email, { votes, confidences, name }] of senderCategoryVotes.entries()) {
    const topCat = ([...votes.entries()].sort((a, b) => b[1] - a[1])[0])?.[0];
    if (!topCat) continue;
    const avgConf = Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);
    senderCategory.set(email, { category: topCat, confidence: avgConf, name });
  }

  // Build category groups — use full sender messageIds if available
  const catMap = new Map<EmailCategory, {
    ids: string[];
    senders: Map<string, string>;
    confidences: number[];
  }>();

  const allSenderMap = new Map<string, FullSender>();
  if (allSenders) {
    for (const s of allSenders) allSenderMap.set(s.email.toLowerCase(), s);
  }

  for (const [email, { category, confidence, name }] of senderCategory.entries()) {
    if (!catMap.has(category)) {
      catMap.set(category, { ids: [], senders: new Map(), confidences: [] });
    }
    const entry = catMap.get(category)!;
    entry.senders.set(email, name);
    entry.confidences.push(confidence);

    // Use full sender's message IDs if we have them, otherwise fall back to sampled IDs
    const fullSender = allSenderMap.get(email);
    if (fullSender) {
      entry.ids.push(...fullSender.messageIds);
    } else {
      // fallback: add sampled IDs for this sender
      for (const msg of messages) {
        if (msg.senderEmail === email) entry.ids.push(msg.id);
      }
    }
  }

  const categories: CategoryGroup[] = [];
  const suggestedFoldersSet = new Set<string>();

  for (const [category, data] of catMap.entries()) {
    const avgConfidence = Math.round(
      data.confidences.reduce((a, b) => a + b, 0) / data.confidences.length
    );
    const folder = FOLDER_MAP[category];
    if (folder) suggestedFoldersSet.add(folder);

    categories.push({
      category,
      count: data.ids.length,
      topSenders: [...data.senders.values()].slice(0, 3),
      messageIds: data.ids,
      confidence: avgConfidence,
      suggestedAction: DEFAULT_ACTIONS[category],
      suggestedFolder: folder,
    });
  }

  categories.sort((a, b) => b.count - a.count);

  const suggestedRules: IntelligenceRule[] = categories
    .filter(c => c.suggestedAction !== "keep")
    .map((c, i) => ({
      id: `rule-${i}`,
      category: c.category,
      action: c.suggestedAction,
      folder: c.suggestedFolder,
      confidence: c.confidence,
      emailCount: c.count,
      enabled: true,
      description: CATEGORY_DESCRIPTIONS[c.category],
    }));

  return {
    categories,
    suggestedRules,
    suggestedFolders: [...suggestedFoldersSet],
  };
}
