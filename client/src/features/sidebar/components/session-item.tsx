import { useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DotsVerticalIcon,
  DrawingPinIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import { Pen } from "lucide-react";
import type { SessionItemProps } from "@/features/sidebar/types/session-item.types";

const itemClass =
  "flex cursor-pointer items-center gap-2 dark:text-stone-200 dark:focus:bg-stone-800 dark:focus:text-stone-100";
const dangerClass =
  "flex cursor-pointer items-center gap-2 text-red-500 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/40 dark:focus:text-red-300";

// Portaled menu events bubble through React's tree; only react to events from the row's own DOM.
const fromRow = (e: React.SyntheticEvent) =>
  e.currentTarget.contains(e.target as Node);

export function SessionItem({
  s,
  open,
  selectedSessionId,
  onSelectSession,
  handlePinSession,
  handleDeleteSession,
  handleRenameSession,
}: SessionItemProps) {
  const label = s.session_title || "New Chat";
  const isSelected = selectedSessionId === s.session_id;

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(label);
  const inputRef = useRef<HTMLInputElement>(null);
  const finished = useRef(false);

  useEffect(() => {
    if (!isEditing) setTitle(label);
  }, [label, isEditing]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    finished.current = false;
    setTitle(label);
    setIsEditing(true);
  };

  const finishEditing = async (save: boolean) => {
    if (finished.current) return;
    finished.current = true;
    setIsEditing(false);

    const next = title.trim();
    if (!save || !next || next === label) return setTitle(label);

    try {
      await handleRenameSession(s.session_id, next);
    } catch {
      setTitle(label);
    }
  };

  return (
    <div
      role="button"
      tabIndex={open ? 0 : -1}
      aria-current={isSelected ? "page" : undefined}
      onClick={(e) => fromRow(e) && !isEditing && onSelectSession(s.session_id)}
      onDoubleClick={(e) => fromRow(e) && open && startEditing()}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget || isEditing) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectSession(s.session_id);
        }
      }}
      className={`group rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-stone-400 dark:focus-visible:ring-stone-600 ${
        open
          ? `cursor-pointer hover:bg-stone-200/30 dark:hover:bg-stone-800/50 ${
              isSelected ? "bg-stone-200/30 dark:bg-stone-800/50" : ""
            }`
          : "pointer-events-none opacity-0"
      }`}
    >
      <div className="flex w-full items-center gap-2 p-2">
        {isEditing ? (
          <input
            ref={inputRef}
            value={title}
            maxLength={100}
            aria-label="Rename chat"
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void finishEditing(true);
              } else if (e.key === "Escape") {
                e.preventDefault();
                void finishEditing(false);
              }
            }}
            onBlur={() => void finishEditing(true)}
            className="min-w-0 flex-1 rounded border border-stone-300 bg-white px-1.5 py-0.5 text-sm text-stone-800 outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-300 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 dark:focus:border-stone-500 dark:focus:ring-stone-600"
          />
        ) : (
          <span
            title={label}
            className={`min-w-0 truncate whitespace-nowrap transition-all duration-300 ${
              open ? "max-w-[11rem] opacity-100" : "max-w-0 opacity-0"
            }`}
          >
            {label}
          </span>
        )}

        {!isEditing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Options for ${label}`}
                className={`data-[state=open]:bg-stone-200 data-[state=open]:opacity-100 dark:data-[state=open]:bg-stone-800 dark:data-[state=open]:text-stone-200 ml-auto flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-stone-600 opacity-0 transition hover:bg-stone-200 hover:text-stone-800 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200 dark:focus-visible:ring-stone-600 ${
                  open ? "group-hover:opacity-100" : "pointer-events-none"
                }`}
              >
                <DotsVerticalIcon className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="right"
              align="start"
              className="font-paragraph min-w-36 dark:border-stone-700 dark:bg-stone-900"
            >
              <DropdownMenuItem className={itemClass} onSelect={startEditing}>
                <Pen className="h-4 w-4" />
                Rename
              </DropdownMenuItem>

              <DropdownMenuItem
                className={itemClass}
                onSelect={() => void handlePinSession(s.session_id)}
              >
                <DrawingPinIcon className="h-4 w-4" />
                {s.is_pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>

              <DropdownMenuItem
                className={dangerClass}
                onSelect={() => void handleDeleteSession(s.session_id)}
              >
                <TrashIcon className="h-4 w-4 text-current" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
