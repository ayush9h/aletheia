"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { PlusIcon, GlobeIcon } from "@radix-ui/react-icons";
// import { BookOpenTextIcon } from "lucide-react";

/** Options available to users (tools) */
export const options = [
  {
    key: "web_search",
    toolLabel: "Web Search",
    toolIcon: GlobeIcon,
  },
  // {
  //     key:"url_extractor",
  //     toolLabel:"URL Extractor",
  //     toolIcon: BookOpenTextIcon,
  // }
];

function InputOptions({
  tools,
  setTools,
}: {
  tools: string[];
  setTools: (tools: string[]) => void;
}) {
  const addOptions = (optionKey: string) => {
    //   Include the tool Key for backend parsing
    if (tools.includes(optionKey)) {
      setTools(tools.filter((i) => i !== optionKey));
    } else {
      setTools([...tools, optionKey]);
    }
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <PlusIcon className="h-4 w-4 cursor-pointer" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="font-paragraph w-48">
          <DropdownMenuLabel className="text-xs text-stone-500">
            Available Tools
          </DropdownMenuLabel>

          {/* Rendering the list of tools available from the options */}
          {options.map((option) => (
            <DropdownMenuItem
              onClick={() => addOptions(option.key)}
              key={option.key}
              className="flex cursor-pointer items-center"
            >
              <option.toolIcon className="h-4 w-4" />
              <h3 className="p-1">{option.toolLabel}</h3>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
export default InputOptions;
