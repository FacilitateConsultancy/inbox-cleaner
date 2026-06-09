export type SenderBucket = "important" | "transactional" | "newsletter" | "promotion" | "spam";

export interface ClassifyResult {
  bucket: SenderBucket;
  confidence: number;
}

const PERSONAL_DOMAINS = [
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "hotmail.com",
  "hotmail.co.uk", "outlook.com", "live.com", "live.co.uk", "icloud.com",
  "me.com", "mac.com", "msn.com", "protonmail.com",
];

function has(str: string, patterns: string[]): boolean {
  return patterns.some(p => str.includes(p));
}

function hasWord(str: string, words: string[]): boolean {
  return words.some(w => new RegExp(`\\b${w}\\b`, "i").test(str));
}

export function classifySender(
  email: string,
  name: string,
  count: number
): ClassifyResult {
  const e = email.toLowerCase();
  const n = name.toLowerCase();
  const domain = e.split("@")[1] ?? "";
  const combined = e + " " + n;

  // ── IMPORTANT ─────────────────────────────────────────────────────────────

  // Government / education
  if (
    domain.endsWith(".gov.uk") || domain.endsWith(".gov") ||
    domain.endsWith(".edu") || domain.endsWith(".ac.uk") ||
    domain.includes(".sch.uk") || domain.includes(".nhs.uk")
  ) {
    return { bucket: "important", confidence: 95 };
  }

  // Healthcare
  if (has(combined, ["nhs", "hospital", "clinic", "surgery", "dental", "gp.", ".gp", "doctor", "pharmacy", "prescri", "optician"])) {
    return { bucket: "important", confidence: 90 };
  }

  // Banks & financial institutions
  const bankDomains = ["barclays", "hsbc", "lloyds", "natwest", "santander", "nationwide",
    "monzo", "starling", "revolut", "amex", "americanexpress", "firstdirect",
    "metrobank", "tsb.", "halifax", "ulsterbank", "bankofscotland", "rbs.",
    "chase.co", "cooperativebank", "co-operativebank", "clydesdale", "yorkshirebank"];
  if (has(e, bankDomains) || hasWord(n, ["bank", "building society", "payroll", "pension", "hmrc", "dvla"])) {
    return { bucket: "important", confidence: 92 };
  }

  // Utilities & telecoms
  const utilityDomains = ["bt.com", "virginmedia", "sky.com", "ee.co.uk", "vodafone",
    "o2.co.uk", "three.co.uk", "britishgas", "centrica", ".eon.", "sse.com",
    "octopusenergy", "bulbenergy", "thameswater", "unitedutilities",
    "severntr", "anglianwater", "yorkshirewater", "openreach", "talktalk", "plusnet"];
  if (has(e, utilityDomains)) {
    return { bucket: "important", confidence: 90 };
  }

  // Recruiters / job boards
  const recruiterDomains = ["linkedin.com", "indeed.", "reed.co", "cvlibrary", "totaljobs",
    "jobsite", "monster.", "glassdoor", "ziprecruiter", "workable", "greenhouse.io", "lever.co"];
  if (has(e, recruiterDomains) || hasWord(n, ["recruiter", "hiring", "talent", "career opportunity", "job alert"])) {
    return { bucket: "important", confidence: 85 };
  }

  // Personal email with low count (likely a real person)
  if (PERSONAL_DOMAINS.includes(domain) && count <= 5) {
    return { bucket: "important", confidence: 80 };
  }

  // Custom domain, very low volume, not automated
  const isAutomated = has(e, ["noreply", "no-reply", "donotreply", "notification", "alert", "automated"]);
  if (!PERSONAL_DOMAINS.includes(domain) && count <= 2 && !isAutomated) {
    return { bucket: "important", confidence: 75 };
  }

  // ── TRANSACTIONAL ─────────────────────────────────────────────────────────

  const transactionalDomains = [
    "amazon.", "ebay.", "etsy.", "paypal.", "stripe.", "klarna.", "clearpay.", "laybuy.",
    "apple.com", "google.com", "google.co.uk", "microsoft.", "office365.",
    "deliveroo.", "justeat.", "ubereats.", "royalmail.", "evri.", "dpd.",
    "dhl.", "fedex.", "ups.", "parcelforce.", "yodel.", "hermes.",
    "booking.com", "airbnb.", "hotels.com", "expedia.", "skyscanner.", "kayak.",
    "trainline.", "nationalrail.", "tfl.gov",
    "eventbrite.", "ticketmaster.", "seetickets.",
    "netflix.", "spotify.", "disneyplus.", "amazon prime",
    "asos.", "next.co", "johnlewis.", "argos.", "currys.", "ao.com",
    "boots.", "sainsburys.", "tesco.", "marksandspencer.", "waitrose.",
    "asda.", "morrisons.", "primark.", "ikea.",
  ];
  if (has(e, transactionalDomains)) {
    return { bucket: "transactional", confidence: 90 };
  }
  if (hasWord(n, ["order", "receipt", "invoice", "delivery", "dispatch", "booking", "ticket", "reservation", "your shipment"])) {
    return { bucket: "transactional", confidence: 84 };
  }

  // ── NEWSLETTER ────────────────────────────────────────────────────────────

  const newsletterDomains = ["substack.", "beehiiv.", "convertkit.", "mailchimp.", "buttondown.", "revue."];
  if (has(e, newsletterDomains) || has(combined, ["newsletter", "digest", "weekly", "briefing", "roundup", "bulletin", "edition"])) {
    return { bucket: "newsletter", confidence: 88 };
  }
  // High-volume personal domain = likely subscribed newsletter
  if (PERSONAL_DOMAINS.includes(domain) && count >= 10) {
    return { bucket: "newsletter", confidence: 72 };
  }

  // ── PROMOTION ─────────────────────────────────────────────────────────────

  const promoAddresses = ["marketing@", "promo@", "offers@", "deals@", "promotions@",
    "sale@", "news@", "updates@", "hello@", "info@", "noreply@", "no-reply@", "donotreply@"];
  if (has(e, promoAddresses) && count >= 5) {
    return { bucket: "promotion", confidence: 78 };
  }
  if (hasWord(n, ["sale", "offer", "deal", "discount", "voucher", "coupon", "promo", "savings", "clearance", "flash sale"]) && count >= 3) {
    return { bucket: "promotion", confidence: 82 };
  }
  // High-volume commercial sender
  if (count >= 15) {
    return { bucket: "promotion", confidence: 62 };
  }

  // ── SPAM ──────────────────────────────────────────────────────────────────

  if (count >= 30 && has(e, ["noreply", "no-reply", "donotreply", "bulk", "mass"])) {
    return { bucket: "spam", confidence: 70 };
  }

  // ── DEFAULT ───────────────────────────────────────────────────────────────

  // Low volume unknown → treat as important (safe default)
  if (count <= 5) {
    return { bucket: "important", confidence: 60 };
  }
  // Medium/high volume unknown → probably promotional
  return { bucket: "promotion", confidence: 55 };
}
