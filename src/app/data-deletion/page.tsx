import { StaticPage } from "@/components/StaticPage";

export const metadata = { title: "Data Deletion — Facilitate Inbox Cleaner" };

export default function DataDeletionPage() {
  return (
    <StaticPage
      label="Data Deletion"
      title="Remove your data."
      intro="You have the right to request deletion of any data we hold. Here's exactly what we hold and how to remove it."
      updatedAt="June 2025"
      sections={[
        {
          heading: "What we hold",
          body: "We hold only your encrypted session token (stored in an HTTP-only cookie) and a reference to your Microsoft account identifier for authentication purposes. We hold no email content or personal data beyond this.",
        },
        {
          heading: "Immediate access revocation",
          body: "To immediately revoke Facilitate Inbox Cleaner's access to your Microsoft account, visit account.microsoft.com, navigate to Privacy → Apps and services, find 'Inbox Cleaner', and select Remove. This terminates all API access instantly.",
        },
        {
          heading: "Session data deletion",
          body: "Your session cookie is cleared when you sign out. You may also clear it by deleting cookies for this domain in your browser settings.",
        },
        {
          heading: "Formal deletion request",
          body: "To submit a formal data deletion request under GDPR or applicable privacy law, email privacy@facilitate.co with the subject line 'Data Deletion Request'. We will confirm deletion within 30 days.",
        },
        {
          heading: "After deletion",
          body: "Once access is revoked and your session is cleared, we retain no information linked to your identity. There is nothing further to delete.",
        },
      ]}
    />
  );
}
