import type { Metadata } from "next";

import LegalPage from "@/features/legal/components/legal-page";
import { PRIVACY_POLICY } from "@/features/legal/constants/privacy-policy";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Aletheia collects, uses and protects your information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalPage document={PRIVACY_POLICY} />;
}
