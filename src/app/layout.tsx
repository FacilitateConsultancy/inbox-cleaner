import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Facilitate Inbox Cleaner — Clear the clutter. Keep what matters.",
  description:
    "Review years of email clutter in minutes. Unsubscribe intelligently. Delete confidently. Regain control.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${lato.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
