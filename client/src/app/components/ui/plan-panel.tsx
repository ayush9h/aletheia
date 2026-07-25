"use client";

import { useState } from "react";
import { Plan } from "@/app/types/user-message";
import { ChevronDownIcon } from "@radix-ui/react-icons";

type PlanPanelProps = {
  plan: Plan;
};

export default function PlanPanel({ plan }: PlanPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!plan?.steps?.length) return null;

  const totalSteps = plan.steps.length;

  return (
    <div className="font-paragraph mb-2 text-xs select-none">
      {/* Minimalist Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          inline-flex items-center gap-1.5 py-1 px-1.5 rounded-md
          text-stone-500 hover:text-stone-900 dark:hover:text-stone-200
          hover:bg-stone-100 dark:hover:bg-stone-800/50
          transition-colors cursor-pointer text-[12px] font-normal
        "
      >
        <span>
          Thought for {totalSteps} step{totalSteps > 1 ? "s" : ""}
        </span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 text-stone-400 transition-transform duration-200 ease-out ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Clean Step List */}
      {isOpen && (
        <div className="mt-1 pl-2.5 ml-1.5 border-l border-stone-200 dark:border-stone-800 space-y-2 py-1">
          {plan.steps.map((step) => (
            <div
              key={step.step_id}
              className="text-stone-600 dark:text-stone-400 text-[12px] leading-relaxed"
            >
              <p>{step.plan}</p>

              {/* Tool Pill */}
              {step.evidence?.tool_name && (
                <span className="mt-1 inline-block font-mono text-[10px] text-stone-500 bg-stone-100 dark:bg-stone-800/80 px-1.5 py-0.5 rounded">
                  {step.evidence.tool_name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
