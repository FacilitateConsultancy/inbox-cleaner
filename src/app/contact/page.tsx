import { StaticPage } from "@/components/StaticPage";

export const metadata = { title: "Contact — Facilitate Inbox Cleaner" };

export default function ContactPage() {
  return (
    <StaticPage
      label="Contact"
      title="Get in touch."
      intro="We're a small team. We read every message and respond within one working day."
      updatedAt="June 2025"
      sections={[
        {
          heading: "General enquiries",
          body: "Email us at hello@facilitate.co for any questions about the product, features, or your account.",
        },
        {
          heading: "Privacy & data requests",
          body: "For data deletion requests, access requests, or privacy concerns, contact privacy@facilitate.co. We respond to all privacy requests within 72 hours.",
        },
        {
          heading: "Bug reports",
          body: "Found something broken? Email support@facilitate.co with a description of the issue and we'll investigate promptly.",
        },
        {
          heading: "Business enquiries",
          body: "Interested in white-labelling, partnerships, or enterprise access? Contact us at business@facilitate.co.",
        },
      ]}
    />
  );
}
