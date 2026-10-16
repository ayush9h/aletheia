import type { Session } from "@/types/user-message";

// Sorting Type
export type SortOrder = "asc" | "desc";

// Section Types
export type SectionId = "pinned" | "recent";

// Sidebar Rows
export type SidebarRow =
  | {
      type: "section";
      id: SectionId;
      label: string;
    }
  | {
      type: "session";
      id: string;
      session: Session;
    }
  | {
      type: "empty";
      id: "recent-empty";
    };
