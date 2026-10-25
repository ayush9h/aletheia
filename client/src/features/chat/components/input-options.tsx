"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChartIcon,
  FileIcon,
  GitHubLogoIcon,
  GlobeIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { Check } from "lucide-react";
import { Fragment } from "react";
import { MENU_CONTENT, MENU_ITEM, MENU_LABEL, MENU_SEPARATOR } from "@/lib/menu";

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
  {
    key: "visualize",
    toolLabel: "Visualize data",
    toolIcon: BarChartIcon,
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
        sideOffset={8}
        className={`${MENU_CONTENT} w-56`}
      >
        {sections.map((section, index) => (
          <Fragment key={section.id}>
            {index > 0 && (
              <DropdownMenuSeparator className={MENU_SEPARATOR} />
            )}

            <DropdownMenuLabel className={MENU_LABEL}>
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
                    className={MENU_ITEM}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-stone-500 dark:text-stone-400" />

                    <span className="flex-1">{option.toolLabel}</span>

                    {isSelected && (
                      <Check
                        aria-hidden="true"
                        className="size-4 text-brand-600 dark:text-brand-400"
                      />
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
