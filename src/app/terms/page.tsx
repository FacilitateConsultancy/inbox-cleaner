import { StaticPage } from "@/components/StaticPage";

export const metadata = { title: "Terms of Service — Facilitate Inbox Cleaner" };

export default function TermsPage() {
  return (
    <StaticPage
      label="Terms of Service"
      title="Simple terms."
      intro="By using Facilitate Inbox Cleaner you agree to these terms. We've written them plainly."
      updatedAt="June 2025"
      sections={[
        {
          heading: "Use of the service",
          body: "Facilitate Inbox Cleaner is provided for personal inbox management. You must have lawful access to any Microsoft account you connect. The service is provided as-is without guarantees of availability.",
        },
        {
          heading: "Irreversibility of deletions",
          body: "Email deletions are permanent. We provide a confirmation screen before any deletion occurs. Once confirmed and executed, deleted emails cannot be recovered through this service. Please review carefully.",
        },
        {
          heading: "Limitation of liability",
          body: "Facilitate is not liable for any loss of email data arising from use of this service. You are responsible for confirming what is deleted. We strongly recommend reviewing the confirmation screen before proceeding.",
        },
        {
          heading: "Acceptable use",
          body: "You may not use this service to access accounts you do not own or have explicit permission to manage. Automated or bulk use beyond normal personal inbox cleaning is not permitted.",
        },
        {
          heading: "Changes to terms",
          body: "We may update these terms periodically. Continued use of the service after changes constitutes acceptance of the updated terms.",
        },
      ]}
    />
  );
}
