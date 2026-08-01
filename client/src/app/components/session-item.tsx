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
      className={`
        group rounded-md outline-none transition-colors
        focus-visible:ring-2 focus-visible:ring-stone-400
        ${
          open
            ? isSelected
              ? "bg-stone-200/45 cursor-pointer"
              : "hover:bg-stone-200/45 cursor-pointer"
            : "pointer-events-none opacity-0"
        }
      `}
    >
      <div className="flex w-full items-center gap-2 p-2">
        <span
          title={s.session_title || "New Chat"}
          className={`
            min-w-0 truncate whitespace-nowrap transition-all duration-300
            ${open ? "max-w-[11rem] opacity-100" : "max-w-0 opacity-0"}
          `}
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
              className={`
                data-[state=open]:bg-stone-200 data-[state=open]:opacity-100 ml-auto flex h-6 w-6
                shrink-0 cursor-pointer items-center justify-center
                rounded text-stone-600
                opacity-0 transition
                hover:bg-stone-200
                hover:text-stone-800
                focus-visible:opacity-100 focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-stone-400
                ${open ? "group-hover:opacity-100" : "pointer-events-none"}
              `}
            >
              <DotsVerticalIcon className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="font-paragraph"
            side="right"
            align="start"
            onClick={(event) => {
              event.stopPropagation();
            }}
          >
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2"
              onSelect={(event) => {
                event.preventDefault();
                void handlePinSession(s.session_id);
              }}
            >
              <DrawingPinIcon className="h-4 w-4" />
              {s.is_pinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>

            <DropdownMenuItem
              className="
                data-[highlighted]:bg-red-100 data-[highlighted]:text-red-700 flex cursor-pointer items-center
                gap-2
                text-red-500
                focus:bg-red-100 focus:text-red-700
              "
              onSelect={(event) => {
                event.preventDefault();
                void handleDeleteSession(s.session_id);
              }}
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
