"use client";

import { motion } from "motion/react";
import { ChartColumn, Github, Globe, Slack } from "lucide-react";

type StarterPrompt = {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
};

// Each prompt shows off one agent, so the first message teaches what Aletheia can reach
const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: "web",
    label: "What's new this week",
    icon: Globe,
    prompt: "Search the web and summarize the most important tech news from this week, with sources.",
  },
  {
    id: "chart",
    label: "Chart some data",
    icon: ChartColumn,
    prompt: "Make a bar chart of the five most populous countries and their populations.",
  },
  {
    id: "github",
    label: "My open pull requests",
    icon: Github,
    prompt: "List my open GitHub pull requests and what each one is waiting on.",
  },
  {
    id: "slack",
    label: "Catch me up on Slack",
    icon: Slack,
    prompt: "Summarize what I missed in my Slack channels today.",
  },
];

type StarterPromptsProps = {
  show: boolean;
  onPromptSelect: (prompt: string) => void;
};

export default function StarterPrompts({
  show,
  onPromptSelect,
}: StarterPromptsProps) {
  if (!show) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="mt-5 w-full"
    >
      <ul
        aria-label="Suggested prompts"
        className="divide-y divide-stone-200/70 px-1 dark:divide-stone-800"
      >
        {STARTER_PROMPTS.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.18,
                delay: index * 0.035,
              }}
              className="py-1"
            >
              <button
                type="button"
                onClick={() => onPromptSelect(item.prompt)}
                className="group flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-150 hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:hover:bg-stone-800/60"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-stone-400 transition-colors duration-150 group-hover:text-brand-500 dark:text-stone-500 dark:group-hover:text-brand-400" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-stone-800 dark:text-stone-200">
                    {item.label}
                  </span>
                  <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
                    {item.prompt}
                  </span>
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}
