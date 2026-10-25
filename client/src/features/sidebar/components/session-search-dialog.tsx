"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { MessageSquare, Pin, SearchX } from "lucide-react";
import { Command } from "cmdk";

import type { Session } from "@/types/user-message";

interface SessionSearchDialogProps {
  open: boolean;
  sessions: Session[];
  onOpenChange: (open: boolean) => void;
  onSelectSession: (sessionId: number) => void;
}

const getSessionTitle = (session: Session) =>
  session.session_title?.trim() || "Untitled chat";

// Wrap in new Date: JSON responses deliver created_at as a string despite the Date type
const formatDate = (value: Date) =>
  new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });

const KBD =
  "rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 font-sans text-[10px] font-medium text-stone-500 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400";

export function SessionSearchDialog({
  open,
  sessions,
  onOpenChange,
  onSelectSession,
}: SessionSearchDialogProps) {
  const handleSelect = (sessionId: number) => {
    onSelectSession(sessionId);
    onOpenChange(false);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Search chats"
      loop
      overlayClassName="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      contentClassName="fixed left-1/2 top-[20%] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/10 dark:border-stone-700/60 dark:bg-stone-900 dark:shadow-black/50"
      className="font-paragraph"
    >
      <DialogPrimitive.Title className="sr-only">
        Search chats
      </DialogPrimitive.Title>

      <div className="flex items-center gap-3 border-b border-stone-200 px-4 dark:border-stone-700/60">
        <MagnifyingGlassIcon
          aria-hidden="true"
          className="size-4 shrink-0 text-stone-400 dark:text-stone-500"
        />

        <Command.Input
          autoFocus
          placeholder="Search chats..."
          className="h-14 w-full bg-transparent text-[15px] text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-500"
        />

        <kbd className={KBD}>Esc</kbd>
      </div>

      <Command.List className="max-h-[22rem] overflow-y-auto p-1.5">
        <Command.Empty className="flex flex-col items-center gap-2 px-6 py-10 text-center text-sm text-stone-500 dark:text-stone-400">
          <SearchX aria-hidden="true" className="size-5 text-stone-400 dark:text-stone-500" />
          No chats found.
        </Command.Empty>

        <Command.Group
          heading="Chats"
          className="[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-stone-500 dark:[&_[cmdk-group-heading]]:text-stone-400"
        >
          {sessions.map((session) => {
            const title = getSessionTitle(session);
            const Icon = session.is_pinned ? Pin : MessageSquare;

            return (
              <Command.Item
                key={session.session_id}
                value={`session-${session.session_id}`}
                keywords={[title]}
                onSelect={() => handleSelect(session.session_id)}
                className="group flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm text-stone-700 outline-none transition-colors data-[selected=true]:bg-stone-100 data-[selected=true]:text-stone-950 dark:text-stone-300 dark:data-[selected=true]:bg-stone-800 dark:data-[selected=true]:text-stone-100"
              >
                <Icon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-stone-400 group-data-[selected=true]:text-brand-500 dark:text-stone-500 dark:group-data-[selected=true]:text-brand-400"
                />

                <span className="min-w-0 flex-1 truncate">{title}</span>

                {session.created_at && (
                  <span className="shrink-0 text-xs text-stone-400 dark:text-stone-500">
                    {formatDate(session.created_at)}
                  </span>
                )}
              </Command.Item>
            );
          })}
        </Command.Group>
      </Command.List>

      {/* Keyboard hints */}
      <div className="flex items-center gap-4 border-t border-stone-200 bg-stone-50/60 px-4 py-2.5 text-xs text-stone-500 dark:border-stone-700/60 dark:bg-stone-950/40 dark:text-stone-400">
        <span className="flex items-center gap-1.5">
          <kbd className={KBD}>↑</kbd>
          <kbd className={KBD}>↓</kbd>
          Navigate
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className={KBD}>↵</kbd>
          Open
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <kbd className={KBD}>Ctrl K</kbd>
          Toggle
        </span>
      </div>
    </Command.Dialog>
  );
}
