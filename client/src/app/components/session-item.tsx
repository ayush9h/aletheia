import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/app/components/ui/dropdown-menu";
import {
  DotsHorizontalIcon,
  TrashIcon,
  DrawingPinIcon,
} from "@radix-ui/react-icons";
import { SessionItemProps } from "../types/user-session";

export function SessionItem(SessionItemProps: SessionItemProps) {
  return (
    <li
      onClick={() =>
        SessionItemProps.onSelectSession(SessionItemProps.s.session_id)
      }
      className={`group cursor-pointer rounded-md ${
        SessionItemProps.open
          ? SessionItemProps.selectedSessionId === SessionItemProps.s.session_id
            ? "bg-stone-200/50"
            : "hover:bg-stone-200/50"
          : "opacity-0"
      }`}
    >
      <div className="flex w-full items-center gap-2 p-2">
        <span
          title={SessionItemProps.s.session_title}
          className={`truncate whitespace-nowrap ${
            SessionItemProps.open
              ? "max-w-[10rem] opacity-100"
              : "max-w-0 opacity-0"
          }`}
        >
          {SessionItemProps.s.session_title || "New Chat"}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`ml-auto flex h-6 w-6 items-center justify-center rounded
              text-stone-600 transition hover:bg-stone-200 hover:text-stone-800
              ${
                SessionItemProps.open
                  ? "opacity-0 group-hover:opacity-100"
                  : "opacity-0"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <DotsHorizontalIcon />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="font-paragraph"
            side="right"
            align="start"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2"
              onSelect={(e) => {
                e.preventDefault();
                SessionItemProps.handlePinSession(
                  SessionItemProps.s.session_id
                );
              }}
            >
              <DrawingPinIcon className="h-4 w-4" />
              {SessionItemProps.s.is_pinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex cursor-pointer items-center gap-2 text-red-500"
              onSelect={(e) => {
                e.preventDefault();
                SessionItemProps.handleDeleteSession(
                  SessionItemProps.s.session_id
                );
              }}
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
