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
  ComponentInstanceIcon,
  FileIcon,
  GlobeIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import { Check } from "lucide-react";
import type { ComponentType } from "react";
import type { AgentResponse } from "@/lib/api/user-data";
import { MENU_CONTENT, MENU_ITEM, MENU_LABEL, MENU_SEPARATOR } from "@/lib/menu";

const AGENT_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  web_search_agent: GlobeIcon,
  visualize_agent: BarChartIcon,
};

type InputOptionsProps = {
  agents: AgentResponse[];
  tools: string[];
  setTools: (tools: string[]) => void;
  onAddFileClick?: () => void;
};

export default function InputOptions({
  agents,
  tools,
  setTools,
  onAddFileClick,
}: InputOptionsProps) {
  const toggleTool = (agentName: string) => {
    if (tools.includes(agentName)) {
      setTools(tools.filter((item) => item !== agentName));
      return;
    }

    setTools([...tools, agentName]);
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
        <DropdownMenuLabel className={MENU_LABEL}>Attachments</DropdownMenuLabel>

        <DropdownMenuItem disabled onSelect={onAddFileClick} className={MENU_ITEM}>
          <FileIcon className="h-4 w-4 shrink-0 text-stone-500 dark:text-stone-400" />

          <span className="flex-1">Add file</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className={MENU_SEPARATOR} />

        <DropdownMenuLabel className={MENU_LABEL}>Tools</DropdownMenuLabel>

        {agents.map((agent) => {
          const Icon = AGENT_ICONS[agent.name] ?? ComponentInstanceIcon;
          const isSelected = tools.includes(agent.name);

          return (
            <DropdownMenuItem
              key={agent.name}
              onSelect={() => toggleTool(agent.name)}
              className={MENU_ITEM}
            >
              <Icon className="h-4 w-4 shrink-0 text-stone-500 dark:text-stone-400" />

              <span className="flex-1">{agent.label}</span>

              {isSelected && (
                <Check
                  aria-hidden="true"
                  className="size-4 text-brand-600 dark:text-brand-400"
                />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
