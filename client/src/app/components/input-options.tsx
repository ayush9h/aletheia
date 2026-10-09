"use client";

import { useRef } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { PlusIcon, GlobeIcon, UploadIcon } from "@radix-ui/react-icons";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

export const options = [
  {
    key: "upload_file",
    toolLabel: "Add file",
    toolIcon: UploadIcon,
    section: "attachments",
  },
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
];

function InputOptions({
  tools,
  setTools,
  onFilesSelected,
}: {
  tools: string[];
  setTools: (tools: string[]) => void;
  onFilesSelected?: (files: File[]) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addOption = (optionKey: string) => {
    if (optionKey === "upload_file") {
      return;
    }

    if (tools.includes(optionKey)) {
      setTools(tools.filter((item) => item !== optionKey));
    } else {
      setTools([...tools, optionKey]);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length > 0) {
      onFilesSelected?.(selectedFiles);
    }

    event.target.value = "";
  };

  const attachments = options.filter(
    (option) => option.section === "attachments"
  );

  const toolOptions = options.filter((option) => option.section === "tools");

  const renderOption = (option: (typeof options)[number]) => {
    const Icon = option.toolIcon;
    const isDisabled = option.key === "upload_file";

    return (
      <DropdownMenuItem
        key={option.key}
        disabled={isDisabled}
        onClick={() => addOption(option.key)}
        className="flex items-center gap-2"
      >
        <Icon className="h-4 w-4" />
        <span>{option.toolLabel}</span>
      </DropdownMenuItem>
    );
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.xlsx"
        onChange={handleFileChange}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-stone-200 dark:hover:bg-stone-800"
            aria-label="Add attachment or tool"
          >
            <PlusIcon className="h-4 w-4 cursor-pointer" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="font-paragraph w-48">
          {attachments.length > 0 && (
            <>
              <DropdownMenuLabel className="text-xs text-stone-500">
                Attachments
              </DropdownMenuLabel>

              {attachments.map(renderOption)}
            </>
          )}

          {toolOptions.length > 0 && (
            <>
              <DropdownMenuLabel className="mt-1 text-xs text-stone-500">
                Tools
              </DropdownMenuLabel>

              {toolOptions.map(renderOption)}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export default InputOptions;
