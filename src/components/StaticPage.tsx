import Link from "next/link";
import { FacilitateLogo } from "./LandingPage";

interface Section {
  heading: string;
  body: string;
}

interface Props {
  label: string;
  title: string;
  intro: string;
  sections: Section[];
  updatedAt: string;
}

export function StaticPage({ label, title, intro, sections, updatedAt }: Props) {
  return (
    <div className="min-h-screen bg-warm-white">
      <header className="bg-white border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/">
            <FacilitateLogo />
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold tracking-widest uppercase text-muted hover:text-navy transition-colors"
          >
            ← Home
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-turquoise text-xs font-bold tracking-[0.2em] uppercase mb-4">
          {label}
        </p>
        <h1 className="text-navy font-black text-5xl leading-tight mb-6">
          {title}
        </h1>
        <p className="text-muted font-light text-lg leading-relaxed mb-12 max-w-xl">
          {intro}
        </p>

        <div className="border-t border-border pt-12 space-y-12">
          {sections.map((s) => (
            <div key={s.heading}>
              <h2 className="text-navy font-bold text-xl mb-3">{s.heading}</h2>
              <p className="text-muted font-light leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <p className="text-navy-100 text-xs mt-16 pt-8 border-t border-border">
          Last updated {updatedAt}
        </p>
      </main>
    </div>
  );
}
