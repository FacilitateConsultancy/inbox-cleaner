import { auth } from "@/auth";
import { LandingPage } from "@/components/LandingPage";
import { InboxCleaner } from "@/components/InboxCleaner";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return <LandingPage />;
  }

  return <InboxCleaner userEmail={session.user?.email ?? ""} />;
}
