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
    <div className="font-paragraph mb-2 select-none text-xs">
      {/* Minimalist Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          inline-flex cursor-pointer items-center gap-1.5 rounded-md py-1
          px-1.5 text-[12px] font-normal
          text-stone-500 transition-colors
          hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-stone-800/50 dark:hover:text-stone-200
        "
      >
        <span>
          Planned {totalSteps} step{totalSteps > 1 ? "s" : ""}
        </span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 text-stone-400 transition-transform duration-200 ease-out ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Clean Step List */}
      {isOpen && (
        <div className="mt-1 ml-1.5 space-y-2 border-l border-stone-200 py-1 pl-2.5 dark:border-stone-800">
          {plan.steps.map((step) => (
            <div
              key={step.step_id}
              className="text-[12px] leading-relaxed text-stone-600 dark:text-stone-400"
            >
              <p>{step.plan}</p>

              {/* Tool Pill */}
              {step.evidence?.tool_name && (
                <span className="mt-1 inline-block rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] text-stone-500 dark:bg-stone-800/80">
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
