import type { Session } from "@/app/types/user-message";

export type SortOrder = "asc" | "desc";

export type SectionId = "pinned" | "recent";

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

function getSessionTimestamp(session: Session): number {
  const timestamp = new Date(session.created_at).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function buildSidebarRows(
  sessions: Session[],
  sortOrder: SortOrder,
  expandedSections: string[]
): SidebarRow[] {
  const direction = sortOrder === "asc" ? 1 : -1;

  const sortedSessions = [...sessions].sort(
    (a, b) =>
      (getSessionTimestamp(a) - getSessionTimestamp(b)) * direction
  );

  const pinned = sortedSessions.filter((session) => session.is_pinned);
  const recent = sortedSessions.filter((session) => !session.is_pinned);

  const rows: SidebarRow[] = [];

  if (pinned.length > 0) {
    rows.push({
      type: "section",
      id: "pinned",
      label: "Pinned Chats",
    });

    if (expandedSections.includes("pinned")) {
      rows.push(
        ...pinned.map((session) => ({
          type: "session" as const,
          id: `session-${session.session_id}`,
          session,
        }))
      );
    }
  }

  rows.push({
    type: "section",
    id: "recent",
    label: "Recent Chats",
  });

  if (expandedSections.includes("recent")) {
    if (recent.length > 0) {
      rows.push(
        ...recent.map((session) => ({
          type: "session" as const,
          id: `session-${session.session_id}`,
          session,
        }))
      );
    } else {
      rows.push({
        type: "empty",
        id: "recent-empty",
      });
    }
  }

  return rows;
}
