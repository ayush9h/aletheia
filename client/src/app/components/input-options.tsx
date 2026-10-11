"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { FileIcon, GlobeIcon, PlusIcon } from "@radix-ui/react-icons";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

/** Options available to users */
export const options = [
  {
    key: "web_search",
    toolLabel: "Web Search",
    toolIcon: GlobeIcon,
    section: "tools",
  },
  {
    key: "github",
    toolLabel: "GitHub",
    toolIcon: GitHubLogoIcon,
    section: "tools",
  },
];

/** Attachment options */
const attachmentOptions = [
  {
    key: "file_attachment",
    toolLabel: "Add file",
    toolIcon: FileIcon,
  },
];

function InputOptions({
  tools,
  setTools,
}: {
  tools: string[];
  setTools: (tools: string[]) => void;
}) {
  const addOption = (optionKey: string) => {
    if (tools.includes(optionKey)) {
      setTools(tools.filter((item) => item !== optionKey));
    } else {
      setTools([...tools, optionKey]);
    }
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

        {attachmentOptions.map((option) => {
          const Icon = option.toolIcon;

          return (
            <DropdownMenuItem
              key={option.key}
              disabled
              className="flex items-center gap-2 text-stone-400 dark:text-stone-600"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-xs">{option.toolLabel}</span>
            </DropdownMenuItem>
          );
        })}

        <DropdownMenuSeparator className="dark:bg-stone-700" />

        {/* Tools */}
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
          Tools
        </DropdownMenuLabel>

        {options.map((option) => {
          const Icon = option.toolIcon;

          return (
            <DropdownMenuItem
              key={option.key}
              onSelect={() => addOption(option.key)}
              className="flex cursor-pointer items-center gap-2 dark:text-stone-200 dark:focus:bg-stone-800"
            >
              <Icon className="h-4 w-4 shrink-0 text-stone-500 dark:text-stone-400" />
              <span className="text-xs">{option.toolLabel}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default InputOptions;
