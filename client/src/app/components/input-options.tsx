"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  FileIcon,
  GitHubLogoIcon,
  GlobeIcon,
  PlusIcon,
} from "@radix-ui/react-icons";

// Exported so ChatInput can render the selected-tool chips.
export const options = [
  {
    key: "web_search",
    toolLabel: "Web search",
    toolIcon: GlobeIcon,
    section: "tools",
  },
  {
    key: "github",
    toolLabel: "GitHub",
    toolIcon: GitHubLogoIcon,
    section: "tools",
  },
] as const;

type InputOptionsProps = {
  tools: string[];
  setTools: (tools: string[]) => void;
  /** Opens the file picker owned by the parent (ChatInput). */
  onAddFileClick: () => void;
};

export default function InputOptions({
  tools,
  setTools,
  onAddFileClick,
}: InputOptionsProps) {
  const toggleTool = (optionKey: string) => {
    if (tools.includes(optionKey)) {
      setTools(tools.filter((item) => item !== optionKey));
      return;
    }

    setTools([...tools, optionKey]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Add tools or attachments"
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md p-0 text-stone-600 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          <PlusIcon className="h-4 w-4 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="font-paragraph w-52 dark:border-stone-700 dark:bg-stone-900"
      >
        {/* Attachments */}
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
          Attachments
        </DropdownMenuLabel>

        <DropdownMenuItem
          onSelect={onAddFileClick}
          className="flex cursor-pointer items-center gap-2 dark:text-stone-200 dark:focus:bg-stone-800"
        >
          <FileIcon className="h-4 w-4 shrink-0 text-stone-500 dark:text-stone-400" />

          <span className="text-xs">Add file</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="dark:bg-stone-700" />

        {/* Tools */}
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
          Tools
        </DropdownMenuLabel>

        {options.map((option) => {
          const Icon = option.toolIcon;
          const isSelected = tools.includes(option.key);

          return (
            <DropdownMenuItem
              key={option.key}
              onSelect={() => toggleTool(option.key)}
              className="flex cursor-pointer items-center gap-2 dark:text-stone-200 dark:focus:bg-stone-800"
            >
              <Icon className="h-4 w-4 shrink-0 text-stone-500 dark:text-stone-400" />

              <span className="flex-1 text-xs">{option.toolLabel}</span>

              {isSelected && (
                <span
                  className="text-xs text-blue-600 dark:text-blue-400"
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
