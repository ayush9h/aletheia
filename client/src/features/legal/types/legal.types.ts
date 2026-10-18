import type { ReactNode } from "react";

export type LegalSection = {
  id: string;
  title: string;
  content: ReactNode;
};

export type LegalDocument = {
  title: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
};
