import type { Metadata } from "next";

import LegalPage from "@/features/legal/components/legal-page";
import { TERMS_OF_SERVICE } from "@/features/legal/constants/terms-of-service";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of Aletheia.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalPage document={TERMS_OF_SERVICE} />;
}
