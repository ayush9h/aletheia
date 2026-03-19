/**

 * Sidebar responsible for session navigation and chat lifecycle actions.
 *
 * Responsibilities:
 * - Toggleable collapsible navigation rail
 * - Session grouping (pinned vs recent)
 */
import { useSession } from "next-auth/react";
import Image from "next/image";

import { PanelLeftIcon } from "lucide-react";
import { ChatAction } from "@/app/types/chats/chat-action";
import { Session } from "@/app/types/userMessage";
import { useChatSession } from "@/app/hooks/useChatSession";
import { pinSession } from "@/app/lib/api/userData";
import { SessionItem } from "@/app/components/session-item";
import { Pencil2Icon } from "@radix-ui/react-icons";

interface SidebarProps {
  open: boolean;
  onToggle: (open: boolean) => void;
  sessions: Session[];
  selectedSessionId: number | null;
  onSelectSession: (id: number) => void;
  dispatch: React.Dispatch<ChatAction>;
}

export default function Sidebar({
  open,
  onToggle,
  sessions,
  onSelectSession,
  selectedSessionId,
  dispatch,
}: SidebarProps) {
  const { data: auth } = useSession();

  /**
   * Session deletion mutation handler.
   */
  const handleDeleteSession = useChatSession(
    auth?.user?.id,
    dispatch,
    selectedSessionId
  );

  /**
   * Toggle session pin state and reconcile reducer sessions.
   */
  const handlePinSession = async (sessionId: number) => {
    if (!auth?.user?.id) return;

    try {
      const res = await pinSession(sessionId, auth.user.id);
      dispatch({ type: "SET_SESSIONS", payload: res.data });
    } catch (err) {
      console.error("Pin failed", err);
    }
  };

  /**
   * Derived session groupings.
   */
  const pinnedSessions = sessions.filter((s) => s.is_pinned);
  const normalSessions = sessions.filter((s) => !s.is_pinned);

  /**
   * Bootstrap fresh chat thread state.
   */
  const handleNewChat = () => {
    dispatch({ type: "SET_SELECTED_SESSION", payload: null });
    dispatch({ type: "SET_MESSAGES", payload: [] });
    dispatch({ type: "CLEAR_INPUT" });
  };

  return (
    <aside
      className={`font-paragraph border-r bg-stone-200/50 p-4 text-sm ${
        open ? "cursor-pointer" : "cursor-col-resize"
      }`}
      onClick={() => !open && onToggle(true)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Image
          src="/logo.png"
          className="shrink-0 cursor-pointer"
          alt="Logo"
          width={32}
          height={32}
        />

        <PanelLeftIcon
          className={`
            h-4 w-4 cursor-pointer transition-opacity duration-200
            ${open ? "opacity-100" : "pointer-events-none opacity-0"}
          `}
          onClick={() => onToggle(false)}
        />
      </div>

      {/* New thread */}
      <button
        className="mt-4 flex w-full items-center gap-2 rounded-md p-2 hover:bg-stone-200/50"
        onClick={handleNewChat}
      >
        <Pencil2Icon className="shrink-0" />
        <span
          className={`
            overflow-hidden whitespace-nowrap transition-all duration-300
            ${open ? "max-w-[8rem] opacity-100" : "max-w-0 opacity-0"}
          `}
        >
          New Thread
        </span>
      </button>

      {/* Sessions */}
      <div className="mt-2 space-y-4">
        {/* Pinned */}
        {pinnedSessions.length > 0 && (
          <div>
            <p
              className={`mt-5 text-xs text-stone-600 ${
                open ? "opacity-100" : "opacity-0"
              }`}
            >
              Pinned Chats
            </p>

            <ul className="mt-2 space-y-1">
              {pinnedSessions.map((s) => (
                <SessionItem
                  key={s.session_id}
                  s={s}
                  open={open}
                  selectedSessionId={selectedSessionId}
                  onSelectSession={onSelectSession}
                  handlePinSession={handlePinSession}
                  handleDeleteSession={handleDeleteSession}
                />
              ))}
            </ul>
          </div>
        )}

        {/* Recent */}
        <div>
          <p
            className={`mt-5 text-xs text-stone-600 ${
              open ? "opacity-100" : "opacity-0"
            }`}
          >
            Recent Chats
          </p>

          <ul className="mt-2 space-y-1">
            {normalSessions.map((s) => (
              <SessionItem
                key={s.session_id}
                s={s}
                open={open}
                selectedSessionId={selectedSessionId}
                onSelectSession={onSelectSession}
                handlePinSession={handlePinSession}
                handleDeleteSession={handleDeleteSession}
              />
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
