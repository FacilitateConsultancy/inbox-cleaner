"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";

/* ── Brand tokens (inline so they always render) ─────────── */
const B = {
  navy:       "#1C213E",
  teal:       "#3B8590",
  tealLight:  "#7BC7CC",
  plum:       "#4B2C42",
  bg:         "#F7F8FC",
  bgMid:      "#ECEEF5",
  border:     "#DDE1ED",
  muted:      "#6B7299",
  white:      "#FFFFFF",
};

export function LandingPage() {
  return (
    <div style={{ backgroundColor: B.bg, color: B.navy, fontFamily: "var(--font-lato, sans-serif)" }}>
      <LandingNav />
      <Hero />
      <Problem />
      <HowItWorks />
      <PrivacySection />
      <Results />
      <BottomCta />
      <Footer />
    </div>
  );
}

function LandingNav() {
  return (
    <nav style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}
      className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto w-full">
      <FacilitateLogo light />
      <div className="flex items-center gap-3">
        <button
          onClick={() => signIn("microsoft-entra-id", {}, { prompt: "select_account" })}
          style={{ color: B.white, borderColor: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 700, letterSpacing: "0.12em" }}
          className="border px-5 py-2.5 hover:bg-white/10 transition-colors uppercase"
        >
          Outlook
        </button>
        <button
          onClick={() => signIn("google", {}, { prompt: "consent select_account" })}
          style={{ color: B.white, borderColor: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 700, letterSpacing: "0.12em" }}
          className="border px-5 py-2.5 hover:bg-white/10 transition-colors uppercase"
        >
          Gmail
        </button>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{ backgroundColor: B.navy, minHeight: "90vh", position: "relative", overflow: "hidden" }}
      className="flex flex-col justify-center">
      {/* Grid texture */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: `linear-gradient(${B.tealLight} 1px, transparent 1px), linear-gradient(90deg, ${B.tealLight} 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />

      <div className="relative max-w-6xl mx-auto px-8 pt-32 pb-24">
        <div className="max-w-3xl">
          <p style={{ color: B.tealLight, fontSize: 12, fontWeight: 700, letterSpacing: "0.2em" }}
            className="uppercase mb-8">
            Facilitate — Inbox Cleaner
          </p>

          <h1 style={{ color: B.white, lineHeight: 0.93, letterSpacing: "-0.02em", fontWeight: 900 }}
            className="text-[clamp(3rem,7vw,6.5rem)] mb-8">
            Take control
            <br />
            <span style={{ color: B.tealLight }}>of your inbox.</span>
          </h1>

          <p style={{ color: "rgba(255,255,255,0.65)", fontWeight: 300, fontSize: 20, lineHeight: 1.65 }}
            className="max-w-xl mb-12">
            Review subscriptions, remove clutter and reclaim your attention in minutes.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => signIn("microsoft-entra-id", {}, { prompt: "select_account" })}
              style={{ backgroundColor: B.teal, color: B.white, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em" }}
              className="inline-flex items-center gap-3 px-8 py-4 uppercase hover:opacity-90 transition-opacity"
            >
              <MicrosoftLogo />
              Connect Outlook
            </button>
            <button
              onClick={() => signIn("google", {}, { prompt: "consent select_account" })}
              style={{ backgroundColor: "rgba(255,255,255,0.1)", color: B.white, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", border: "1px solid rgba(255,255,255,0.25)" }}
              className="inline-flex items-center gap-3 px-8 py-4 uppercase hover:opacity-90 transition-opacity"
            >
              <GoogleLogo />
              Connect Gmail
            </button>
            <a href="#how-it-works"
              style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 700, letterSpacing: "0.15em", borderBottom: "1px solid rgba(255,255,255,0.25)" }}
              className="uppercase hover:text-white transition-colors pb-0.5">
              How it works
            </a>
          </div>
        </div>

        <div style={{ position: "absolute", right: 32, top: "50%", transform: "translateY(-50%)", opacity: 0.15 }}
          className="hidden xl:block">
          <InboxIllustration />
        </div>
      </div>
    </section>
  );
}

function Problem() {
  return (
    <section style={{ backgroundColor: B.bgMid, padding: "7rem 0" }}>
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p style={{ color: B.teal, fontSize: 12, fontWeight: 700, letterSpacing: "0.2em" }} className="uppercase mb-4">
              The Problem
            </p>
            <h2 style={{ color: B.navy, fontWeight: 900, lineHeight: 1.1 }} className="text-5xl mb-6">
              Your inbox is not a filing system.
            </h2>
            <p style={{ color: B.muted, fontWeight: 300, fontSize: 18, lineHeight: 1.7 }} className="mb-4">
              Every subscription you ever signed up for, every promotional offer, every automated notification — they accumulate silently for years.
            </p>
            <p style={{ color: B.muted, fontWeight: 300, fontSize: 18, lineHeight: 1.7 }}>
              The result is a bloated inbox that obscures what actually matters.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { stat: "2,847", label: "Average inbox size" },
              { stat: "68%",   label: "Emails never opened" },
              { stat: "94",    label: "Unique senders" },
              { stat: "3 hrs", label: "Saved per month" },
            ].map(({ stat, label }) => (
              <div key={label} style={{ backgroundColor: B.white, border: `1px solid ${B.border}`, padding: 24 }}>
                <p style={{ color: B.navy, fontWeight: 900, fontSize: 36, letterSpacing: "-0.02em" }} className="mb-1">{stat}</p>
                <p style={{ color: B.muted, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em" }} className="uppercase">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Connect",  body: "Authorise your Outlook account securely via Microsoft's own login. We request only the permissions we need." },
    { n: "02", title: "Review",   body: "Work through each sender one at a time. Keep what matters. Mark the rest for removal or unsubscribe." },
    { n: "03", title: "Clean",    body: "Confirm your decisions and we delete everything in one batch. Your inbox — exactly as you want it." },
  ];

  return (
    <section id="how-it-works" style={{ backgroundColor: B.bg, padding: "7rem 0" }}>
      <div className="max-w-6xl mx-auto px-8">
        <div className="mb-16">
          <p style={{ color: B.teal, fontSize: 12, fontWeight: 700, letterSpacing: "0.2em" }} className="uppercase mb-4">
            How it works
          </p>
          <h2 style={{ color: B.navy, fontWeight: 900, lineHeight: 1.1 }} className="text-5xl max-w-lg">
            Three steps to a clear inbox.
          </h2>
        </div>

        <div style={{ borderTop: `1px solid ${B.border}` }} className="grid md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.n}
              style={{ borderRight: i < 2 ? `1px solid ${B.border}` : "none", paddingTop: 40, paddingBottom: 48, paddingRight: 48, paddingLeft: i > 0 ? 48 : 0 }}>
              <p style={{ color: B.border, fontWeight: 900, fontSize: 64, lineHeight: 1 }} className="mb-6 select-none">{s.n}</p>
              <h3 style={{ color: B.navy, fontWeight: 700, fontSize: 22 }} className="mb-3">{s.title}</h3>
              <p style={{ color: B.muted, fontWeight: 300, fontSize: 16, lineHeight: 1.7 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrivacySection() {
  const items = [
    { title: "Read-only by default",   body: "We read your inbox to analyse it. We write nothing until you explicitly confirm a deletion." },
    { title: "No data stored",         body: "Email content never touches our servers. Analysis happens in your browser session only." },
    { title: "You confirm everything", body: "Nothing is deleted without a full review screen showing exactly what will be removed." },
    { title: "Revoke anytime",         body: "Permissions can be revoked from your Microsoft account settings at any time." },
  ];

  return (
    <section style={{ backgroundColor: B.navy, padding: "7rem 0" }}>
      <div className="max-w-6xl mx-auto px-8">
        <div className="mb-16">
          <p style={{ color: B.tealLight, fontSize: 12, fontWeight: 700, letterSpacing: "0.2em" }} className="uppercase mb-4">
            Privacy &amp; Trust
          </p>
          <h2 style={{ color: B.white, fontWeight: 900, lineHeight: 1.1 }} className="text-5xl max-w-lg">
            Your data stays yours.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontWeight: 300, fontSize: 18 }} className="mt-4 max-w-md">
            We read. We don't store. You control every action.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, backgroundColor: "rgba(255,255,255,0.08)" }}
          className="sm:grid-cols-2 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.title} style={{ backgroundColor: B.navy, padding: 32 }}>
              <div style={{ width: 4, height: 24, backgroundColor: B.teal, marginBottom: 24 }} />
              <h3 style={{ color: B.white, fontWeight: 700, fontSize: 15 }} className="mb-3">{item.title}</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontWeight: 300, fontSize: 14, lineHeight: 1.7 }}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Results() {
  const metrics = [
    { value: "< 2 min", label: "Average scan time" },
    { value: "71%",     label: "Emails removed on average" },
    { value: "Zero",    label: "Data stored on our servers" },
  ];

  return (
    <section style={{ backgroundColor: B.bg, borderTop: `1px solid ${B.border}`, padding: "7rem 0" }}>
      <div className="max-w-6xl mx-auto px-8">
        <div className="grid md:grid-cols-3 divide-x" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
          {metrics.map(({ value, label }, i) => (
            <div key={label} style={{ paddingLeft: i > 0 ? 48 : 0, paddingRight: i < 2 ? 48 : 0, borderRight: i < 2 ? `1px solid ${B.border}` : "none" }}>
              <p style={{ color: B.navy, fontWeight: 900, fontSize: 60, lineHeight: 1, letterSpacing: "-0.02em" }} className="mb-3">{value}</p>
              <p style={{ color: B.muted, fontSize: 12, fontWeight: 700, letterSpacing: "0.15em" }} className="uppercase">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BottomCta() {
  return (
    <section style={{ backgroundColor: B.tealLight + "22", borderTop: `1px solid ${B.border}`, padding: "7rem 0" }}>
      <div className="max-w-6xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <h2 style={{ color: B.navy, fontWeight: 900, fontSize: 40, lineHeight: 1.1 }} className="mb-3">Ready to start?</h2>
          <p style={{ color: B.muted, fontWeight: 300, fontSize: 18 }}>Connect your inbox. It takes under 30 seconds.</p>
        </div>
        <div className="flex flex-wrap gap-3 flex-shrink-0">
          <button
            onClick={() => signIn("microsoft-entra-id", {}, { prompt: "select_account" })}
            style={{ backgroundColor: B.navy, color: B.white, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em" }}
            className="inline-flex items-center gap-3 px-8 py-4 uppercase hover:opacity-90 transition-opacity"
          >
            <MicrosoftLogo />
            Outlook
          </button>
          <button
            onClick={() => signIn("google", {}, { prompt: "consent select_account" })}
            style={{ backgroundColor: B.teal, color: B.white, fontWeight: 700, fontSize: 13, letterSpacing: "0.15em" }}
            className="inline-flex items-center gap-3 px-8 py-4 uppercase hover:opacity-90 transition-opacity"
          >
            <GoogleLogo />
            Gmail
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const links = [
    { href: "/privacy",       label: "Privacy" },
    { href: "/terms",         label: "Terms" },
    { href: "/contact",       label: "Contact" },
    { href: "/data-deletion", label: "Data Deletion" },
  ];

  return (
    <footer style={{ backgroundColor: B.navy, borderTop: "1px solid rgba(255,255,255,0.08)", padding: "2.5rem 0" }}>
      <div className="max-w-6xl mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <FacilitateLogo light />
        <nav className="flex items-center gap-6">
          {links.map(({ href, label }) => (
            <Link key={href} href={href}
              style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em" }}
              className="uppercase hover:text-white transition-colors">
              {label}
            </Link>
          ))}
        </nav>
        <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>© {new Date().getFullYear()} Facilitate</p>
      </div>
    </footer>
  );
}

/* ── Shared atoms ──────────────────────────────────────────── */

export function FacilitateLogo({ light, small }: { light?: boolean; small?: boolean }) {
  const textCol = light ? "#FFFFFF" : B.navy;
  const scale = small ? 0.85 : 1;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, transform: `scale(${scale})`, transformOrigin: "left center" }}>
      {/* Double-bar mark matching brand logo */}
      <div style={{ display: "flex", gap: 3, alignItems: "stretch", height: 22 }}>
        <div style={{ width: 4, backgroundColor: B.teal, height: "100%" }} />
        <div style={{ width: 4, backgroundColor: B.tealLight, height: "100%" }} />
      </div>
      <div>
        <p style={{ color: textCol, fontWeight: 900, fontSize: 14, letterSpacing: "0.18em", lineHeight: 1, textTransform: "uppercase" }}>
          Facilitate
        </p>
        <p style={{ color: light ? "rgba(255,255,255,0.45)" : B.muted, fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", lineHeight: 1, marginTop: 3 }}>
          Consult · Coach · Transform
        </p>
      </div>
    </div>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1"  y="1"  width="9" height="9" fill="#f25022" />
      <rect x="11" y="1"  width="9" height="9" fill="#7fba00" />
      <rect x="1"  y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function InboxIllustration() {
  return (
    <svg width="460" height="360" viewBox="0 0 460 360" fill="none">
      {[0,1,2,3,4,5].map((i) => (
        <rect key={i} x={20} y={40+i*52} width={420} height={40} rx={2} fill="white" opacity={0.06+i*0.01} />
      ))}
      {[0,1,2,3,4,5].map((i) => (
        <rect key={i} x={60} y={54+i*52} width={180+(i%3)*60} height={6} rx={3} fill="white" opacity={0.2} />
      ))}
      <rect x={20} y={40} width={420} height={40} rx={2} fill="white" opacity={0.12} />
      <rect x={60} y={54} width={260} height={6} rx={3} fill="white" opacity={0.5} />
    </svg>
  );
}
