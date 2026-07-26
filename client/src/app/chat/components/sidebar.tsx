/**
 * Sidebar responsible for session navigation and chat lifecycle actions.
 */
'use client'
import type { Dispatch, ReactNode } from "react";
import { useState, useEffect } from "react";
import { SessionSearchDialog } from "@/app/components/ui/cmd-panel";

import { useSession } from "next-auth/react";
import Image from "next/image";

import { PanelLeftIcon } from "lucide-react";
import {
  FileIcon,
  MagnifyingGlassIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";

import AppTooltip from "@/app/components/ui/app-tooltip";
import { SessionItem } from "@/app/components/session-item";
import { useChatSession } from "@/app/hooks/useChatSession";
import { pinSession } from "@/app/lib/api/userData";
import type { ChatAction } from "@/app/types/chats/chat-action";
import type { Session } from "@/app/types/user-message";

interface SidebarProps {
  open: boolean;
  onToggle: (open: boolean) => void;
  sessions: Session[];
  selectedSessionId: number | null;
  onSelectSession: (id: number) => void;
  dispatch: Dispatch<ChatAction>;
  onOpenDocuments?: () => void;
}

interface SidebarActionProps {
  open: boolean;
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  disabledLabel?: string;
}

function SidebarAction({
  open,
  label,
  icon,
  onClick,
  disabled = false,
  disabledLabel,
}: SidebarActionProps) {
  const button = (
    <button
      type="button"
      aria-label={label}
      aria-disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();

        if (disabled) {
          return;
        }

        onClick?.();
      }}
      className={`
        flex w-full items-center gap-2 rounded-md p-2
        transition-colors duration-150
        ${
          disabled
            ? "cursor-not-allowed text-stone-400"
            : "cursor-pointer text-stone-800 hover:bg-stone-200/70"
        }
      `}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center">
        {icon}
      </span>

      <span
        className={`
          overflow-hidden whitespace-nowrap transition-all duration-300
          ${open ? "max-w-[10rem] opacity-100" : "max-w-0 opacity-0"}
        `}
      >
        {label}
      </span>

      {open && disabled && (
        <span className="ml-auto rounded bg-stone-300/70 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
          Soon
        </span>
      )}
    </button>
  );

  if (open) {
    return button;
  }

  return (
    <AppTooltip label={disabled ? disabledLabel ?? label : label}>
      {button}
    </AppTooltip>
  );
}

export default function Sidebar({
  open,
  onToggle,
  sessions,
  onSelectSession,
  selectedSessionId,
  dispatch,
  onOpenDocuments,
}: SidebarProps) {
  const { data: auth } = useSession();

  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        setSearchOpen((current) => !current);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDeleteSession = useChatSession(
    auth?.user?.id,
    dispatch,
    selectedSessionId
  );

  const handlePinSession = async (sessionId: number) => {
    const userId = auth?.user?.id;

    if (!userId) {
      return;
    }

    try {
      const response = await pinSession(sessionId, userId);

      dispatch({
        type: "SET_SESSIONS",
        payload: response.data,
      });
    } catch (error) {
      console.error("Unable to update session pin state", {
        sessionId,
        error,
      });
    }
  };

  const pinnedSessions = sessions.filter((session) => session.is_pinned);
  const recentSessions = sessions.filter((session) => !session.is_pinned);

  const handleNewChat = () => {
    dispatch({
      type: "SET_SELECTED_SESSION",
      payload: null,
    });

    dispatch({
      type: "SET_MESSAGES",
      payload: [],
    });
  };

  return (
    <>
    <aside
      aria-label="Chat sidebar"
      className={`
        font-paragraph flex h-full shrink-0 flex-col overflow-hidden
        border-r bg-stone-200/50 p-4 text-sm
        transition-[width] duration-300 ease-in-out
        ${open ? "w-64" : "w-16 cursor-col-resize"}
      `}
      onClick={() => {
        if (!open) {
          onToggle(true);
        }
      }}
    >
      {/* Header */}
      <header className="flex h-8 shrink-0 items-center justify-between">
        <button
          type="button"
          aria-label={open ? "Application home" : "Open sidebar"}
          className="flex shrink-0 cursor-pointer items-center justify-center"
          onClick={(event) => {
            event.stopPropagation();

            if (!open) {
              onToggle(true);
            }
          }}
        >
          <Image
            src="/logo.png"
            alt=""
            width={32}
            height={32}
            priority
          />
        </button>

        {open && (
          <AppTooltip label="Collapse sidebar">
            <button
              type="button"
              aria-label="Collapse sidebar"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md hover:bg-stone-200/70"
              onClick={(event) => {
                event.stopPropagation();
                onToggle(false);
              }}
            >
              <PanelLeftIcon className="h-4 w-4" />
            </button>
          </AppTooltip>
        )}
      </header>

      {/* Sidebar actions */}
      <nav aria-label="Chat actions" className="mt-4 shrink-0 space-y-1">
        <SidebarAction
          open={open}
          label="New Chat"
          icon={<Pencil2Icon className="h-4 w-4" />}
          onClick={handleNewChat}
        />

        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-stone-200/50"
          onClick={(event) => {
            event.stopPropagation();
            setSearchOpen(true);
          }}
        >
          <MagnifyingGlassIcon className="shrink-0" />

          <span
            className={`
              overflow-hidden whitespace-nowrap transition-all duration-300
              ${open ? "max-w-[8rem] opacity-100" : "max-w-0 opacity-0"}
            `}
          >
            Search Chats
          </span>

        </button>

        <SidebarAction
          open={open}
          label="Your Documents"
          icon={<FileIcon className="h-4 w-4" />}
          onClick={onOpenDocuments}
          disabled={!onOpenDocuments}
          disabledLabel="Your Documents is coming soon"
        />
      </nav>

      {/* Sessions */}
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
        {pinnedSessions.length > 0 && (
          <section aria-labelledby="pinned-chats-heading">
            <p
              id="pinned-chats-heading"
              className={`
                mt-5 overflow-hidden whitespace-nowrap text-xs text-stone-600
                transition-opacity duration-200
                ${open ? "opacity-100" : "pointer-events-none opacity-0"}
              `}
            >
              Pinned Chats
            </p>

            <ul className="mt-2 space-y-1">
              {pinnedSessions.map((session) => (
                <SessionItem
                  key={session.session_id}
                  s={session}
                  open={open}
                  selectedSessionId={selectedSessionId}
                  onSelectSession={onSelectSession}
                  handlePinSession={handlePinSession}
                  handleDeleteSession={handleDeleteSession}
                />
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="recent-chats-heading">
          <p
            id="recent-chats-heading"
            className={`
              mt-5 overflow-hidden whitespace-nowrap text-xs text-stone-600
              transition-opacity duration-200
              ${open ? "opacity-100" : "pointer-events-none opacity-0"}
            `}
          >
            Recent Chats
          </p>

          <ul className="mt-2 space-y-1">
            {recentSessions.map((session) => (
              <SessionItem
                key={session.session_id}
                s={session}
                open={open}
                selectedSessionId={selectedSessionId}
                onSelectSession={onSelectSession}
                handlePinSession={handlePinSession}
                handleDeleteSession={handleDeleteSession}
              />
            ))}
          </ul>

          {open && recentSessions.length === 0 && (
            <p className="mt-3 px-2 text-xs text-stone-500">
              Your recent chats will appear here.
            </p>
          )}
        </section>
      </div>
    </aside>

    {/*Render CMD-K Panel*/}
    <SessionSearchDialog
      open={searchOpen}
      sessions={sessions}
      onOpenChange={setSearchOpen}
      onSelectSession={onSelectSession}
    />
  </>
  );
}
