import { SidebarRow, SortOrder } from "@/features/sidebar/types/sidebar.types";
import type { Session } from "@/types/user-message";

/*
  Gets the session timestamp
  * @param session: Session
  * @returns number
*/
function getSessionTimestamp(session: Session): number {
  const timestamp = new Date(session.created_at).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

/*
 * Builds the sidebar with the data ingested
 * @param sessions: List of sessions for the user
 * @param sortOrder: Sorting order for the sessions
 * @param expandedSections: list of sessions which are expanded
 */
export function buildSidebarRows(
  sessions: Session[],
  sortOrder: SortOrder,
  expandedSections: string[]
): SidebarRow[] {
  // checks for sorting order
  const direction = sortOrder === "asc" ? 1 : -1;

  const sortedSessions = [...sessions].sort(
    (a, b) => (getSessionTimestamp(a) - getSessionTimestamp(b)) * direction
  );

  // filter the sessions
  const pinned = sortedSessions.filter((session) => session.is_pinned);
  const recent = sortedSessions.filter((session) => !session.is_pinned);

  // build rows
  const rows: SidebarRow[] = [];

  if (pinned.length > 0) {
    rows.push({
      type: "section",
      id: "pinned",
      label: "Pinned Chats",
    });

    // Pinned chat history
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

  // unpinned or recent chat histories
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
