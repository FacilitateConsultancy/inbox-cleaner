import { auth } from "@/auth";
import { LandingPage } from "@/components/LandingPage";
import { InboxCleaner } from "@/components/InboxCleaner";
import { SessionExpiredBanner } from "@/components/SessionExpiredBanner";

export default async function Home() {
  const session = await auth();

  if (!session) return <LandingPage />;

  // Token refresh failed — show re-login prompt rather than a blank redirect
  if (session.error === "RefreshTokenExpired" || session.error === "RefreshTokenMissing") {
    return <SessionExpiredBanner provider={session.provider} />;
  }

  return <InboxCleaner userEmail={session.user?.email ?? ""} />;
}
