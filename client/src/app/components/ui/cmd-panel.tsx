"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChatBubbleIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { Command } from "cmdk";

import type { Session } from "@/app/types/user-message";

interface SessionSearchDialogProps {
  open: boolean;
  sessions: Session[];
  onOpenChange: (open: boolean) => void;
  onSelectSession: (sessionId: number) => void;
}

const getSessionTitle = (session: Session) =>
  session.session_title?.trim() || "Untitled chat";

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
      overlayClassName="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
      contentClassName="fixed left-1/2 top-1/4 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-lg border border-stone-200 bg-stone-50 shadow-xl"
      className="font-paragraph"
    >
      <DialogPrimitive.Title className="sr-only">
        Search chats
      </DialogPrimitive.Title>

      <div className="flex items-center gap-2 border-b border-stone-200 px-3">
        <MagnifyingGlassIcon
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-stone-400"
        />

        <Command.Input
          autoFocus
          placeholder="Search chats..."
          className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
        />
      </div>

      <Command.List className="max-h-80 overflow-y-auto p-1.5">
        <Command.Empty className="p-8 text-center text-sm text-stone-500">
          No chats found.
        </Command.Empty>

        {sessions.map((session) => {
          const title = getSessionTitle(session);

          return (
            <Command.Item
              key={session.session_id}
              value={`session-${session.session_id}`}
              keywords={[title]}
              onSelect={() => handleSelect(session.session_id)}
              className="data-[selected=true]:bg-stone-200 data-[selected=true]:text-stone-950 flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm text-stone-700 outline-none"
            >
              <ChatBubbleIcon
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-stone-500"
              />

              <span className="min-w-0 flex-1 truncate">{title}</span>
            </Command.Item>
          );
        })}
      </Command.List>
    </Command.Dialog>
  );
}
