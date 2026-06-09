export type SenderBucket = "important" | "bills" | "transactional" | "newsletter" | "promotion" | "spam";

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
  "aol.com","btinternet.com","ntlworld.com",
]);

/**
 * These local parts (the bit before @) are NEVER a real person.
 * Any of these → skip "important" classification entirely.
 */
const NON_PERSON_LOCALS = new Set([
  // Automated
  "noreply","no-reply","donotreply","do-not-reply","do_not_reply",
  "automated","system","mailer","mailer-daemon","bounce","bounces",
  "postmaster","daemon","robot","bot","blackhole",
  // Role / functional
  "info","information","hello","hey","hi","team","staff","admin","webmaster",
  "contact","sales","hr","finance","accounts","reception","enquiries","enquiry",
  "query","feedback","care","office","general","help","support","helpdesk",
  "service","customer","customerservice","customercare","cs","billing","payment",
  "payments","orders","order","shipping","delivery","dispatch","tracking",
  "newsletter","news","updates","update","alerts","alert","notification",
  "notifications","marketing","promo","promotions","offers","deals","deals",
  "mail","email","web","online","digital","social","media","press","pr",
  "comms","communications","editorial","broadcast","campaigns","campaign",
  "security","verify","verification","password","account","accounts",
  "privacy","legal","compliance","gdpr","dpo","policy",
  // Brand/product names that look like words but aren't people
  "uber","lyft","prime","fortnite","spotify","netflix","amazon","google",
  "apple","microsoft","paypal","ebay","etsy","skype","pinterest","snapchat",
  "instagram","facebook","twitter","tiktok","discord","twitch","youtube",
  "wordpress","shopify","stripe","klarna","revolut","monzo","starling",
  "activity","awards","product","new","welcome","confirm","ohno","location",
  "registration","applicantsupport","mixr","hey","swagbucks","mixr",
]);

function localPart(email: string): string { return email.split("@")[0] ?? ""; }
function domainOf(email: string): string  { return email.split("@")[1] ?? ""; }

function has(str: string, list: string[]): boolean {
  return list.some(p => str.includes(p));
}

/**
 * Only considers firstname.lastname or firstname_lastname patterns as person addresses.
 * Single-word locals (info, help, service, uber, prime…) are NOT people.
 */
function looksLikePersonAddress(local: string): boolean {
  if (NON_PERSON_LOCALS.has(local)) return false;
  // Require a separator: john.smith, sarah_jones, j.bloggs
  return /^[a-z]{2,}[._-][a-z]{2,}\d{0,4}$/.test(local);
}

/** "John Smith", "Sarah Jones" — two capitalised words */
function looksLikePersonName(name: string): boolean {
  return /^[A-Z][a-zÀ-ÿ'-]{1,20}( [A-Z][a-zÀ-ÿ'-]{1,20}){1,2}$/.test(name);
}

// ── Domain lists ──────────────────────────────────────────────────────────────

const GOVT_SUFFIXES = [
  ".gov.uk",".gov",".edu",".ac.uk",".sch.uk",".nhs.uk",".nhs.net",
  ".mil",".police.uk",".mod.uk",".parliament.uk",
];

const BANK_SNIPPETS = [
  "barclays.","hsbc.","lloyds.","natwest.","santander.","nationwide.",
  "monzo.","starling.","revolut.","americanexpress.","amex.","firstdirect.",
  "metrobank.","tsb.","halifax.","ulsterbank.","bankofscotland.","rbs.",
  "clydesdale.","yorkshirebank.","cooperativebank.","co-operativebank.",
  "chase.co.uk","virginmoney.","postoffice.","aldermore.","shawbrook.",
  "marcus.","atombank.","pensionbee.","nutmeg.","vanguard.","fidelity.",
  "hl.co.uk","ajbell.","abrdn.","interactiveinvestor.",
];

const UTILITY_SNIPPETS = [
  "bt.com","virginmedia.","sky.","ee.co.uk","ee-email","email-ee",
  "vodafone.","o2.co.uk","three.co.uk","giffgaff.","smarty.","iD.mobile",
  "britishgas.","centrica.","eon.","sse.","octopusenergy.","ovoenergy.",
  "edfenergy.","npower.","scottishpower.","utilita.","so.energy",
  "thameswater.","unitedutilities.","severn-trent.","severntr.",
  "anglianwater.","yorkshirewater.","openreach.","talktalk.","plusnet.",
  "hyperoptic.","council.",
];

const HEALTHCARE_SNIPPETS = [
  "nhs.","hospital.","clinic.","dental.","pharmacy.","gp.","surgery.",
];

const RECRUITER_SNIPPETS = [
  "linkedin.","indeed.","reed.co","cvlibrary.","totaljobs.","jobsite.",
  "monster.","glassdoor.","ziprecruiter.","workable.","greenhouse.io",
  "lever.co","smartrecruiters.","myworkdayjobs.","jobs2web.",
];

const TRANSACTIONAL_SNIPPETS = [
  // Retail
  "amazon.","ebay.","etsy.","asos.","next.co","johnlewis.","argos.",
  "currys.","ao.com","boots.","superdrug.","sainsburys.","tesco.","asda.",
  "morrisons.","waitrose.","marksandspencer.","aldi.","lidl.","iceland.",
  "costco.","primark.","ikea.","dunelm.","homebase.","diy.com","screwfix.",
  "toolstation.","halfords.","decathlon.","sportsdirect.","jdsports.",
  "footlocker.","schuh.","clarks.","nike.","adidas.","zara.","h&m.",
  "mango.","uniqlo.","gap.","thewhitecompany.","riverisland.","newlook.",
  "topshop.","prettylittlething.","boohoo.","shein.","sheinmail.","romwe.","edm.romwe","fashionnova.",
  "misguided.","missguided.","bonmarche.","lego.","smythstoys.","hamleys.",
  "cultbeauty.","lookfantastic.","feelunique.","spacenk.",
  // Tech / subscriptions
  "apple.","applemusic.","appletv.","icloud.","itunes.",
  "google.","microsoft.","adobe.","dropbox.","spotify.","spotifymail.",
  "netflix.","disneyplus.","amazon prime","nowtv.","paramount.",
  "epicgames.","steam.","playstation.","xbox.","nintendo.",
  "studentbeans.","unidays.",
  // Payments
  "paypal.","stripe.","klarna.","clearpay.","laybuy.","gocardless.",
  "sumup.","square.",
  // Food delivery
  "deliveroo.","justeat.","ubereats.","hungryhouse.",
  // Ride / delivery apps
  "uber.","lyft.","deliveryapp.",
  // Couriers
  "royalmail.","evri.","dpd.","dhl.","fedex.","ups.",
  "parcelforce.","yodel.","whistl.","inpost.","dpdlocal.",
  // Travel
  "booking.com","airbnb.","hotels.com","expedia.","skyscanner.",
  "kayak.","lastminute.","trivago.","tripadvisor.",
  "trainline.","nationalrail.","avanti.","gwr.","lner.",
  "eurostar.","tfl.gov","ryanair.","easyjet.","britishairways.",
  "ba.com","virginatlantic.","jet2.","tui.",
  // Events / tickets
  "eventbrite.","ticketmaster.","seetickets.","axs.com","gigsandtours.",
  // Survey / rewards
  "usertesting.","toluna.","surveymonkey.","swagbucks.","prolific.",
  "respondent.","userinterviews.","rebatekey.","swagbucksemail.",
  // Misc services
  "snapfish.","moonpig.","funkypigeon.","photobox.",
  "zoho.","zohocorp.","salesforce.","hubspot.",
  "popworld.","aloyoga.","mixr.",
  "skype.","emails.skype","email.skype",
];

const NEWSLETTER_SNIPPETS = [
  "substack.","beehiiv.","convertkit.","mailchimp.",
  "buttondown.","ghost.io","campaign-monitor.","constantcontact.",
  "sendgrid.","klaviyo.","brevo.","sendinblue.",
];

const SOCIAL_SNIPPETS = [
  "pinterest.","notifications.pinterest","facebook.","instagram.",
  "twitter.","tiktok.","snapchat.","linkedin.","tumblr.",
  "reddit.","discord.","twitch.",
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
  const dom   = domainOf(e);
  const isPersonalDomain = PERSONAL_DOMAINS.has(dom);
  const isNonPerson = NON_PERSON_LOCALS.has(local);

  // ── 1. Government / NHS / Education TLD ──────────────────────────────────
  if (GOVT_SUFFIXES.some(s => dom.endsWith(s))) {
    // HMRC, DWP, councils etc. → Bills & Finance; NHS/schools → Important
    if (has(dom, ["hmrc.","dwp.","tax.","council.","gov.uk"]) || has(nLow, ["hmrc","tax credit","council tax","dwp","universal credit"])) {
      return { bucket: "bills", confidence: 96 };
    }
    return { bucket: "important", confidence: 96 };
  }

  // ── 2. Banks & financial → Bills & Finance ───────────────────────────────
  if (has(dom, BANK_SNIPPETS) || has(nLow, ["hmrc","payroll","your pension","dvla","companies house","tax credit","council tax"])) {
    return { bucket: "bills", confidence: 94 };
  }

  // ── 3. Utilities & telecoms → Bills & Finance ────────────────────────────
  if (has(dom, UTILITY_SNIPPETS)) {
    return { bucket: "bills", confidence: 92 };
  }

  // ── 4. Healthcare ─────────────────────────────────────────────────────────
  if (has(dom, HEALTHCARE_SNIPPETS) || has(nLow, ["nhs ","hospital","dental surgery","health centre","gp surgery","optician"])) {
    return { bucket: "important", confidence: 90 };
  }

  // ── 5. Recruiters / job boards ────────────────────────────────────────────
  if (has(dom, RECRUITER_SNIPPETS) || has(nLow, ["job alert","new job","career opportunity","job application","talent acquisition"])) {
    return { bucket: "important", confidence: 86 };
  }

  // ── 6. Real person on personal domain (gmail, hotmail, etc.) ────────────
  // Must run BEFORE transactional check — a person's gmail is always important
  if (isPersonalDomain && !isNonPerson) {
    if (count <= 10) return { bucket: "important",  confidence: 85 };
    if (count <= 25) return { bucket: "newsletter",  confidence: 70 };
    return { bucket: "promotion", confidence: 65 };
  }

  // ── 7. Real person on custom domain ──────────────────────────────────────
  // Must run BEFORE transactional check — victoria.jones@anycompany.com is a person
  if (!isPersonalDomain && !isNonPerson && count <= 12) {
    if (looksLikePersonAddress(local) || looksLikePersonName(n)) {
      return { bucket: "important", confidence: 80 };
    }
  }

  // ── 8. Known transactional domain ────────────────────────────────────────
  if (has(dom, TRANSACTIONAL_SNIPPETS)) {
    if (count >= 20) {
      return { bucket: "promotion", confidence: 82 };
    }
    return { bucket: "transactional", confidence: 88 };
  }

  // ── 9. Social media notifications ────────────────────────────────────────
  if (has(dom, SOCIAL_SNIPPETS)) {
    return count >= 5
      ? { bucket: "newsletter", confidence: 78 }
      : { bucket: "transactional", confidence: 75 };
  }

  // ── 10. Newsletter platforms ──────────────────────────────────────────────
  if (has(dom, NEWSLETTER_SNIPPETS)) {
    return { bucket: "newsletter", confidence: 91 };
  }

  // ── 11. Newsletter local part or display name ─────────────────────────────
  if (["newsletter","digest","weekly","daily","monthly","roundup","bulletin","briefing","editorial"].includes(local) ||
      has(nLow, ["newsletter","digest","weekly briefing","daily briefing","roundup","bulletin","this week","the latest"])) {
    return { bucket: "newsletter", confidence: 84 };
  }

  // ── 12. Promotional local part or display name ────────────────────────────
  if (["marketing","promo","promotions","offers","deals","sale","sales","discounts","voucher","coupons"].includes(local)) {
    return { bucket: "promotion", confidence: 86 };
  }
  if (has(nLow, ["% off","sale","voucher","discount","coupon","promo","deal","savings","clearance","flash sale","exclusive offer"])) {
    return { bucket: "promotion", confidence: 83 };
  }

  // ── 13. Automated address fallback ────────────────────────────────────────
  if (isNonPerson) {
    if (count >= 25) return { bucket: "spam",        confidence: 72 };
    if (count >= 8)  return { bucket: "promotion",   confidence: 65 };
    return { bucket: "transactional", confidence: 60 };
  }

  // ── 14. Volume-based fallback ─────────────────────────────────────────────
  if (count <= 3)  return { bucket: "important",  confidence: 55 };
  if (count <= 12) return { bucket: "newsletter",  confidence: 55 };
  return { bucket: "promotion", confidence: 58 };
}
