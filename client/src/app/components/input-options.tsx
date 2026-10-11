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
import { Fragment } from "react";

// Exported so ChatInput can render the selected-tool chips.
export const options = [
  {
    key: "add_file",
    toolLabel: "Add file",
    toolIcon: FileIcon,
    section: "attachments",
    disabled: true,
  },
  {
    key: "web_search",
    toolLabel: "Web search",
    toolIcon: GlobeIcon,
    section: "tools",
    disabled: false,
  },
  {
    key: "github",
    toolLabel: "GitHub",
    toolIcon: GitHubLogoIcon,
    section: "tools",
    disabled: false,
  },
] as const;

const sections = [
  { id: "attachments", label: "Attachments" },
  { id: "tools", label: "Tools" },
] as const;

type InputOptionsProps = {
  tools: string[];
  setTools: (tools: string[]) => void;
  onAddFileClick?: () => void;
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

  const handleSelect = (option: (typeof options)[number]) => {
    if (option.section === "attachments") {
      onAddFileClick?.();
      return;
    }

    toggleTool(option.key);
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
        {sections.map((section, index) => (
          <Fragment key={section.id}>
            {index > 0 && (
              <DropdownMenuSeparator className="dark:bg-stone-700" />
            )}

            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-stone-500 dark:text-stone-400">
              {section.label}
            </DropdownMenuLabel>

            {options
              .filter((option) => option.section === section.id)
              .map((option) => {
                const Icon = option.toolIcon;
                const isSelected = tools.includes(option.key);

                return (
                  <DropdownMenuItem
                    key={option.key}
                    disabled={option.disabled}
                    onSelect={() => handleSelect(option)}
                    className="data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 flex cursor-pointer items-center gap-2 dark:text-stone-200 dark:focus:bg-stone-800"
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
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
