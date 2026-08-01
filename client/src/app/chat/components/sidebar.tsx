"use client";

import type { Dispatch, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Virtuoso } from "react-virtuoso";

import { PanelLeftIcon } from "lucide-react";
import {
  CaretSortIcon,
  FileIcon,
  MagnifyingGlassIcon,
  Pencil2Icon,
} from "@radix-ui/react-icons";

import { ChevronDownIcon } from "lucide-react";
import AppTooltip from "@/app/components/ui/app-tooltip";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import { SessionSearchDialog } from "@/app/components/ui/cmd-panel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
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

type SortOrder = "asc" | "desc";
type SectionId = "pinned" | "recent";

type SidebarRow =
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
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
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

  return open ? (
    button
  ) : (
    <AppTooltip label={disabled ? disabledLabel ?? label : label}>
      {button}
    </AppTooltip>
  );
}

function getSessionTimestamp(session: Session): number {
  const timestamp = new Date(session.created_at).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
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
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "pinned",
    "recent",
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "k" ||
        (!event.metaKey && !event.ctrlKey)
      ) {
        return;
      }

      event.preventDefault();
      setSearchOpen((current) => !current);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleDeleteSession = useChatSession(
    auth?.user?.id,
    dispatch,
    selectedSessionId
  );

  const handlePinSession = useCallback(
    async (sessionId: number) => {
      const userId = auth?.user?.id;
      if (!userId) return;

      try {
        const { data } = await pinSession(sessionId, userId);
        dispatch({ type: "SET_SESSIONS", payload: data });
      } catch (error) {
        console.error("Unable to update session pin state", {
          sessionId,
          error,
        });
      }
    },
    [auth?.user?.id, dispatch]
  );

  const sessionRows = useMemo<SidebarRow[]>(() => {
    const direction = sortOrder === "asc" ? 1 : -1;
    const pinned: Session[] = [];
    const recent: Session[] = [];

    for (const session of [...sessions].sort(
      (a, b) => (getSessionTimestamp(a) - getSessionTimestamp(b)) * direction
    )) {
      (session.is_pinned ? pinned : recent).push(session);
    }

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
        rows.push({ type: "empty", id: "recent-empty" });
      }
    }

    return rows;
  }, [expandedSections, sessions, sortOrder]);

  const handleNewChat = () => {
    dispatch({ type: "SET_SELECTED_SESSION", payload: null });
    dispatch({ type: "SET_MESSAGES", payload: [] });
  };

  return (
    <>
      <aside
        aria-label="Chat sidebar"
        className={`
          font-paragraph flex h-full shrink-0 flex-col overflow-hidden
          border-r bg-stone-100/50 p-4 text-sm
          transition-[width] duration-300 ease-in-out
          ${open ? "w-64" : "w-16 cursor-col-resize"}
        `}
        onClick={() => !open && onToggle(true)}
      >
        <header className="flex h-8 shrink-0 items-center justify-between">
          <button
            type="button"
            aria-label={open ? "Application home" : "Open sidebar"}
            className="flex shrink-0 cursor-pointer items-center justify-center"
            onClick={(event) => {
              event.stopPropagation();
              if (!open) onToggle(true);
            }}
          >
            <Image src="/logo.png" alt="" width={32} height={32} priority />
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

        <nav aria-label="Chat actions" className="mt-4 shrink-0 space-y-1">
          <SidebarAction
            open={open}
            label="New Chat"
            icon={<Pencil2Icon className="h-4 w-4" />}
            onClick={handleNewChat}
          />

          <button
            type="button"
            aria-label="Search chats"
            className="flex w-full cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-stone-200/50"
            onClick={(event) => {
              event.stopPropagation();
              setSearchOpen(true);
            }}
          >
            <MagnifyingGlassIcon className="h-4 w-4 shrink-0" />
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

        {open && (
          <div className="font-paragraph mt-5 flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between px-2 pb-1">
              <span className="text-xs">Chats</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="cursor-pointer">
                  <button className="flex h-6 items-center gap-1 px-2 text-xs  text-stone-600">
                    <CaretSortIcon className="h-3 w-3" />
                    {sortOrder === "desc" ? "Newest" : "Oldest"}
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="font-paragraph">
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={() => setSortOrder("desc")}
                  >
                    Newest first
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer"
                    onSelect={() => setSortOrder("asc")}
                  >
                    Oldest first
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Accordion
              type="multiple"
              value={expandedSections}
              onValueChange={setExpandedSections}
              className="min-h-0 flex-1 overflow-hidden"
            >
              <Virtuoso
                className="h-full [scrollbar-gutter:stable]"
                data={sessionRows}
                computeItemKey={(_, row) => row.id}
                increaseViewportBy={{ top: 80, bottom: 120 }}
                itemContent={(_, row) => {
                  if (row.type === "section") {
                    return (
                      <AccordionItem value={row.id} className="border-none">
                        <AccordionTrigger
                          className="
                            [&>svg:last-child]:hidden group w-fit flex-none justify-start gap-1.5 px-2
                            py-2 text-xs leading-none text-stone-600
                            hover:no-underline
                          "
                        >
                          <span>{row.label}</span>

                          <ChevronDownIcon
                            className="
                              group-data-[state=open]:rotate-90 h-3.5 w-3.5
                              shrink-0 cursor-pointer
                              transition-transform duration-200
                            "
                          />
                        </AccordionTrigger>
                      </AccordionItem>
                    );
                  }

                  if (row.type === "empty") {
                    return (
                      <p className="px-2 py-2 text-xs text-stone-500">
                        Your recent chats will appear here.
                      </p>
                    );
                  }

                  return (
                    <div className="pb-1">
                      <SessionItem
                        s={row.session}
                        open={open}
                        selectedSessionId={selectedSessionId}
                        onSelectSession={onSelectSession}
                        handlePinSession={handlePinSession}
                        handleDeleteSession={handleDeleteSession}
                      />
                    </div>
                  );
                }}
                components={{
                  Footer: () => <div className="h-2" aria-hidden="true" />,
                }}
              />
            </Accordion>
          </div>
        )}
      </aside>

      <SessionSearchDialog
        open={searchOpen}
        sessions={sessions}
        onOpenChange={setSearchOpen}
        onSelectSession={onSelectSession}
      />
    </>
  );
}
