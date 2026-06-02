import { StaticPage } from "@/components/StaticPage";

export const metadata = { title: "Privacy Policy — Facilitate Inbox Cleaner" };

export default function PrivacyPage() {
  return (
    <StaticPage
      label="Privacy Policy"
      title="Your data stays yours."
      intro="We are committed to full transparency about how Facilitate Inbox Cleaner accesses and handles your data."
      updatedAt="June 2025"
      sections={[
        {
          heading: "What data we access",
          body: "We request OAuth access to your Microsoft account with Mail.Read and Mail.ReadWrite permissions. This allows us to read your inbox and delete emails on your instruction. We do not access calendar, contacts, or any other data.",
        },
        {
          heading: "What data we store",
          body: "We store no email content on our servers. Email analysis occurs entirely within your browser session. The only persistent data is your authenticated session token, stored as an encrypted HTTP-only cookie on your device.",
        },
        {
          heading: "How deletions work",
          body: "Emails are only deleted after you explicitly confirm on the confirmation screen. All deletions are batch-sent to Microsoft's Graph API. We never delete anything without your direct instruction.",
        },
        {
          heading: "Third parties",
          body: "We use Microsoft's OAuth infrastructure for authentication. No email data is shared with any analytics, advertising, or third-party services.",
        },
        {
          heading: "Your rights",
          body: "You may revoke our access at any time by visiting your Microsoft account's connected apps settings. Revoking access removes all permissions immediately.",
        },
        {
          heading: "Contact",
          body: "Questions about this policy may be sent to privacy@facilitate.co.",
        },
      ]}
    />
  );
}
