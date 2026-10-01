import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  DotsVerticalIcon,
  DrawingPinIcon,
  TrashIcon,
} from "@radix-ui/react-icons";

import type { SessionItemProps } from "../types/user-session";

export function SessionItem({
  s,
  open,
  selectedSessionId,
  onSelectSession,
  handlePinSession,
  handleDeleteSession,
}: SessionItemProps) {
  const isSelected = selectedSessionId === s.session_id;

  const handleSelect = () => {
    onSelectSession(s.session_id);
  };

  return (
    <div
      role="button"
      tabIndex={open ? 0 : -1}
      aria-current={isSelected ? "page" : undefined}
      onClick={handleSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleSelect();
        }
      }}
      className={`group rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-stone-400 dark:focus-visible:ring-stone-600 ${open ? isSelected ? "cursor-pointer bg-stone-200/30 dark:bg-stone-800/50" : "cursor-pointer hover:bg-stone-200/30 dark:hover:bg-stone-800/50" : "pointer-events-none opacity-0"}`}
    >
      <div className="flex w-full items-center gap-2 p-2">
        <span
          title={s.session_title || "New Chat"}
          className={`min-w-0 truncate whitespace-nowrap transition-all duration-300 ${open ? "max-w-[11rem] opacity-100" : "max-w-0 opacity-0"}`}
        >
          {s.session_title || "New Chat"}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Options for ${s.session_title || "New Chat"}`}
              onClick={(event) => {
                event.stopPropagation();
              }}
              className={`ml-auto flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded text-stone-600 opacity-0 transition data-[state=open]:bg-stone-200 data-[state=open]:opacity-100 hover:bg-stone-200 hover:text-stone-800 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:text-stone-400 dark:data-[state=open]:bg-stone-800 dark:data-[state=open]:text-stone-200 dark:hover:bg-stone-800 dark:hover:text-stone-200 dark:focus-visible:ring-stone-600 ${open ? "group-hover:opacity-100" : "pointer-events-none"}`}
            >
              <DotsVerticalIcon className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="font-paragraph dark:border-stone-700 dark:bg-stone-900"
            side="right"
            align="start"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 dark:text-stone-200 dark:focus:bg-stone-800 dark:focus:text-stone-100"
              onSelect={(event) => {
                event.preventDefault();
                void handlePinSession(s.session_id);
              }}
            >
              <DrawingPinIcon className="h-4 w-4" />
              {s.is_pinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 text-red-500 focus:bg-red-100 focus:text-red-700 data-[highlighted]:bg-red-100 data-[highlighted]:text-red-700 dark:text-red-400 dark:focus:bg-red-950/40 dark:focus:text-red-400 dark:data-[highlighted]:bg-red-950/40 dark:data-[highlighted]:text-red-400"
              onSelect={(event) => {
                event.preventDefault();
                void handleDeleteSession(s.session_id);
              }}
            >
              <TrashIcon className="h-4 w-4 text-red-500 dark:text-red-400" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
