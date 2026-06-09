export type SenderBucket = "important" | "transactional" | "newsletter" | "promotion" | "spam";

export interface ClassifyResult {
  bucket: SenderBucket;
  confidence: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PERSONAL_DOMAINS = new Set([
  "gmail.com","googlemail.com","yahoo.com","yahoo.co.uk","yahoo.fr","yahoo.de",
  "hotmail.com","hotmail.co.uk","hotmail.fr","outlook.com","outlook.co.uk",
  "live.com","live.co.uk","live.fr","icloud.com","me.com","mac.com","msn.com",
  "protonmail.com","proton.me","pm.me","tutanota.com","fastmail.com",
  "aol.com","btinternet.com","virginmedia.com","sky.com","ntlworld.com",
]);

/** Email address prefixes that are NEVER a real person */
const AUTOMATED_PREFIXES = new Set([
  "noreply","no-reply","donotreply","do-not-reply","do_not_reply",
  "automated","system","mailer","mailer-daemon","bounce","bounces",
  "postmaster","daemon","robot","bot",
]);

/** Prefixes that strongly suggest newsletters */
const NEWSLETTER_PREFIXES = new Set([
  "newsletter","newsletters","digest","weekly","daily","monthly",
  "roundup","bulletin","edition","briefing","dispatch","updates",
  "editorial","press","media","blog","post","posts",
]);

/** Prefixes that strongly suggest promotions/marketing */
const PROMO_PREFIXES = new Set([
  "marketing","promo","promotions","offers","deals","sale","sales",
  "discount","discounts","voucher","coupon","coupons","savings",
  "campaigns","campaign","eshots","eshot","broadcast",
]);

/** Prefixes that strongly suggest transactional emails */
const TRANSACTIONAL_PREFIXES = new Set([
  "orders","order","receipts","receipt","invoice","invoices","billing",
  "payments","payment","shipping","delivery","dispatch","tracking",
  "booking","bookings","confirmation","confirmations","tickets","ticket",
  "reservation","reservations","statement","statements","account",
  "notifications","notification","alerts","alert","security","verify",
  "verification","password","support","helpdesk","service",
]);

function localPart(email: string): string {
  return email.split("@")[0] ?? "";
}

function domain(email: string): string {
  return email.split("@")[1] ?? "";
}

function has(str: string, list: string[]): boolean {
  return list.some(p => str.includes(p));
}

/** Does the local part look like a real person's name? e.g. john.smith, sarah_jones, jsmith */
function looksLikePersonAddress(local: string): boolean {
  return (
    /^[a-z]{2,}[._-][a-z]{2,}\d{0,4}$/.test(local) || // first.last or first_last
    /^[a-z]{2,15}\d{0,4}$/.test(local)                  // firstname or nickname
  ) && !AUTOMATED_PREFIXES.has(local) && !NEWSLETTER_PREFIXES.has(local) && !PROMO_PREFIXES.has(local);
}

/** Does the display name look like a real person? e.g. "John Smith", "Sarah Jones" */
function looksLikePersonName(name: string): boolean {
  return /^[A-Z][a-zÀ-ÿ'-]{1,20}( [A-Z][a-zÀ-ÿ'-]{1,20}){1,2}$/.test(name);
}

// ── Domain lists ──────────────────────────────────────────────────────────────

const GOVT_EDU_DOMAINS = [
  ".gov.uk",".gov",".edu",".ac.uk",".sch.uk",".nhs.uk",".nhs.net",
  ".mil",".police.uk",".mod.uk",".parliament.uk",
];

const BANK_DOMAINS = [
  "barclays.","hsbc.","lloyds.","natwest.","santander.","nationwide.",
  "monzo.","starling.","revolut.","americanexpress.","amex.","firstdirect.",
  "metrobank.","tsb.","halifax.","ulsterbank.","bankofscotland.","rbs.",
  "clydesdale.","yorkshirebank.","cooperativebank.","co-operativebank.",
  "chase.co.uk","virgin.money","virginmoney.","post.office","postoffice.",
  "aldermore.","shawbrook.","marcus.","aldermore.","atom.bank","atombank.",
  "pensionbee.","nutmeg.","vanguard.","fidelity.","hargreaveslansdown.",
  "hl.co.uk","ajbell.","abrdn.","interactive.investor",
];

const UTILITY_DOMAINS = [
  "bt.com","btyahoo.","virginmedia.","sky.","ee.co.uk","vodafone.","o2.co.uk",
  "three.co.uk","giffgaff.","smarty.","id.mobile","tesco.mobile",
  "britishgas.","centrica.","eon.","sse.","octopusenergy.","bulb.",
  "ovoenergy.","edfenergy.","npower.","scottishpower.","utilita.","so.energy",
  "thameswater.","unitedutilities.","severn-trent.","severntr.",
  "anglianwater.","yorkshirewater.","affinity.water","southern.water",
  "openreach.","talktalk.","plusnet.","hyperoptic.","cityfibre.",
  "council.","councillor.",
];

const RECRUITER_DOMAINS = [
  "linkedin.","indeed.","reed.co.uk","cvlibrary.","totaljobs.","jobsite.",
  "monster.","glassdoor.","ziprecruiter.","workable.","greenhouse.io",
  "lever.co","smartrecruiters.","taleo.","icims.","myworkdayjobs.",
  "jobs2web.","recruit.","hireserve.","ats.",
];

const TRANSACTIONAL_DOMAINS = [
  // Retail
  "amazon.","ebay.","etsy.","asos.","next.co","johnlewis.","argos.",
  "currys.","ao.com","boots.","superdrug.","lloydspharmacy.",
  "sainsburys.","tesco.","asda.","morrisons.","waitrose.","marksandspencer.",
  "aldi.","lidl.","iceland.","costco.","bm.","poundland.","wilko.",
  "primark.","ikea.","dunelm.","homebase.","b&q.","diy.com","screwfix.",
  "toolstation.","halfords.","decathlon.","sportsdirect.","jdsports.",
  "footlocker.","schuh.","clarks.","ugg.","nike.","adidas.",
  "zara.","h&m.","mango.","uniqlo.","gap.","banana.republic",
  "thewhitecompany.","anthropologie.","urbano.","urbanoutfitters.",
  "prettylittlething.","boohoo.","misguided.","shein.","missguided.",
  "riverisland.","newlook.","peacocks.","bonmarche.",
  "lego.","toyrus.","smythstoys.","hamleys.",
  "apple.","google.","microsoft.","adobe.","dropbox.","spotify.",
  "netflix.","disneyplus.","amazon.","paramount.","nowtv.",
  "sky.","peacocktv.",
  // Payments
  "paypal.","stripe.","klarna.","clearpay.","laybuy.","openpay.",
  "paym.","moneybox.","gocardless.","sumup.","square.",
  // Food delivery
  "deliveroo.","justeat.","ubereats.","hungryhouse.",
  // Delivery couriers
  "royalmail.","evri.","dpd.","dhl.","fedex.","ups.",
  "parcelforce.","yodel.","whistl.","hermes.","collectplus.",
  "inpost.","dpdlocal.",
  // Travel & hospitality
  "booking.com","airbnb.","hotels.com","expedia.","skyscanner.",
  "kayak.","lastminute.","trivago.","tripadvisor.",
  "trainline.","nationalrail.","avanti.","gwr.","lner.","southeastern.",
  "eurostar.","tfl.gov","heathrow.","gatwick.","stansted.",
  "ryanair.","easyjet.","britishairways.","ba.com","virginatlantic.",
  "jet2.","tui.","thomascook.",
  // Tickets / events
  "eventbrite.","ticketmaster.","seetickets.","axs.com","gigsandtours.",
  "songkick.","wegottickets.",
  // Subscriptions / media
  "times.","telegraph.","guardian.","bbc.","ft.com","economist.",
];

const NEWSLETTER_DOMAINS = [
  "substack.","substack.com","beehiiv.","convertkit.","mailchimp.",
  "buttondown.","revue.","ghost.io","campaign-monitor.","constantcontact.",
  "sendgrid.","klaviyo.","brevo.","sendinblue.",
];

// ── Main classifier ───────────────────────────────────────────────────────────

export function classifySender(
  email: string,
  name: string,
  count: number
): ClassifyResult {
  const e     = email.toLowerCase().trim();
  const n     = name.trim();
  const nLow  = n.toLowerCase();
  const local = localPart(e);
  const dom   = domain(e);
  const isPersonalDomain = PERSONAL_DOMAINS.has(dom);

  // ── Step 1: Hard-exclude automated prefixes from "important" ─────────────
  const isAutomated = AUTOMATED_PREFIXES.has(local) || local.startsWith("noreply") || local.startsWith("no-reply") || local.startsWith("donotreply");

  // ── Step 2: Government / NHS / Education ──────────────────────────────────
  if (GOVT_EDU_DOMAINS.some(d => dom.endsWith(d))) {
    return { bucket: "important", confidence: 96 };
  }

  // ── Step 3: Banks & financial ─────────────────────────────────────────────
  if (has(dom, BANK_DOMAINS) || has(nLow, ["hmrc","payroll","your pension","dvla","companies house","tax credit"])) {
    return { bucket: "important", confidence: 93 };
  }

  // ── Step 4: Utilities & telecoms ─────────────────────────────────────────
  if (has(dom, UTILITY_DOMAINS)) {
    return { bucket: "important", confidence: 91 };
  }

  // ── Step 5: Healthcare ────────────────────────────────────────────────────
  if (has(dom, ["nhs.","hospital.","clinic.","dental.","pharmacy.","prescri"]) ||
      has(nLow, ["nhs","hospital","clinic","dental","pharmacy","dr ","gp surgery","health centre","optician"])) {
    return { bucket: "important", confidence: 90 };
  }

  // ── Step 6: Recruiters / job boards ──────────────────────────────────────
  if (has(dom, RECRUITER_DOMAINS) || has(nLow, ["job alert","new job","career opportunity","recruiter","talent acquisition"])) {
    return { bucket: "important", confidence: 86 };
  }

  // ── Step 7: Real person on personal domain ────────────────────────────────
  if (!isAutomated && isPersonalDomain) {
    if (count <= 5) {
      return { bucket: "important", confidence: 85 };
    }
    if (count <= 15) {
      return { bucket: "newsletter", confidence: 70 };
    }
  }

  // ── Step 8: Real person on custom domain (low volume, name-like) ──────────
  if (!isAutomated && !isPersonalDomain && count <= 4) {
    if (looksLikePersonAddress(local) || looksLikePersonName(n)) {
      return { bucket: "important", confidence: 78 };
    }
  }

  // ── Step 9: Transactional local part prefix ───────────────────────────────
  if (TRANSACTIONAL_PREFIXES.has(local)) {
    return { bucket: "transactional", confidence: 85 };
  }

  // ── Step 10: Known transactional domain ──────────────────────────────────
  if (has(dom, TRANSACTIONAL_DOMAINS)) {
    // High-volume from a known retailer = mostly promotional
    if (count >= 20) {
      return { bucket: "promotion", confidence: 82 };
    }
    return { bucket: "transactional", confidence: 88 };
  }

  // ── Step 11: Newsletter platform or prefix ────────────────────────────────
  if (has(dom, NEWSLETTER_DOMAINS) || NEWSLETTER_PREFIXES.has(local)) {
    return { bucket: "newsletter", confidence: 90 };
  }
  if (has(nLow, ["newsletter","digest","weekly","daily briefing","roundup","bulletin","edition","the latest","this week"])) {
    return { bucket: "newsletter", confidence: 82 };
  }

  // ── Step 12: Promotional prefix or name ──────────────────────────────────
  if (PROMO_PREFIXES.has(local)) {
    return { bucket: "promotion", confidence: 85 };
  }
  if (has(nLow, ["% off","sale","voucher","discount","coupon","offer","deal","promo","savings","clearance","flash sale"])) {
    return { bucket: "promotion", confidence: 83 };
  }

  // ── Step 13: Automated + high volume = spam ───────────────────────────────
  if (isAutomated && count >= 25) {
    return { bucket: "spam", confidence: 72 };
  }

  // ── Step 14: Volume-based fallback ───────────────────────────────────────
  // Low volume, no person signals, automated address = notification/transactional
  if (isAutomated) {
    return count >= 10
      ? { bucket: "promotion", confidence: 60 }
      : { bucket: "transactional", confidence: 58 };
  }

  // Low volume non-personal = could be small business, service, or person
  if (count <= 3) {
    return { bucket: "important", confidence: 58 };
  }

  // Medium volume with no strong signal = newsletter or promotion
  if (count <= 12) {
    return { bucket: "newsletter", confidence: 55 };
  }

  // High volume with no strong signal = promotion
  return { bucket: "promotion", confidence: 58 };
}
