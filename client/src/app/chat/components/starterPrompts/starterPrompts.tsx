"use client";

import { motion } from "motion/react";
import {
  CalendarDays,
  Lightbulb,
  ListChecks,
  MessageCircleQuestion,
  Pen,
} from "lucide-react";

type StarterPrompt = {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
};

const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: "plan",
    label: "Plan my day",
    icon: CalendarDays,
    prompt:
      "Help me plan my day based on what I need to get done.",
  },
  {
    id: "learn",
    label: "Explain something",
    icon: MessageCircleQuestion,
    prompt:
      "Explain a concept to me in simple terms with a practical example.",
  },
  {
    id: "ideas",
    label: "Brainstorm ideas",
    icon: Lightbulb,
    prompt:
      "Help me brainstorm some useful ideas for what I can work on today.",
  },
  {
    id: "organize",
    label: "Organize my thoughts",
    icon: ListChecks,
    prompt:
      "Help me organize my thoughts and turn them into a clear plan.",
  },
  {
    id: "improve",
    label: "Improve my writing",
    icon: Pen,
    prompt:
      "Improve this text so it sounds clear, natural, and professional.",
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
      <div className="flex flex-wrap items-center justify-center gap-2 px-1">
        {STARTER_PROMPTS.map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              type="button"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.18,
                delay: index * 0.035,
              }}
              onClick={() => onPromptSelect(item.prompt)}
              className={[
                "group flex h-9 items-center gap-1.5",
                "cursor-pointer whitespace-nowrap",
                "rounded-lg border",
                "border-stone-200",
                "bg-white",
                "px-3",
                "text-[12px] font-medium text-stone-600",
                "transition-all duration-150",
                "hover:border-blue-200",
                "hover:bg-blue-50/70",
                "hover:text-blue-700",

              ].join(" ")}
            >
              <Icon
                className={[
                  "h-3.5 w-3.5",
                  "text-stone-400",
                  "transition-colors duration-150",
                  "group-hover:text-blue-500",
                ].join(" ")}
              />

              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
