"use client";

import { useEffect, useState } from "react";
import { ChevronDownIcon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import { Plan } from "@/app/types/user-message";

type PlanPanelProps = {
  plan: Plan;
};

export default function PlanPanel({ plan }: PlanPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (plan?.steps?.some((step) => step.status === "running")) {
      setIsOpen(false);
    }
  }, [plan]);

  if (!plan?.steps?.length) return null;

  const totalSteps = plan.steps.length;

  return (
    <div className="mb-3 select-none font-paragraph text-xs">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1.5 transition-all"
      >
        <span>
          Planned {totalSteps} step{totalSteps > 1 ? "s" : ""}
        </span>

        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="mt-2.5 ml-1 border-l border-border/70 pl-3.5">
          {plan.steps.map((step, index) => (
            <div
              key={step.step_id}
              className={`relative flex gap-2.5 ${
                index !== plan.steps.length - 1 ? "pb-3" : ""
              }`}
            >
              <div className="flex w-3.5 shrink-0 justify-center pt-1">
                {step.status === "running" && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-foreground" />
                )}

                {step.status === "success" && (
                  <CheckIcon className="h-3.5 w-3.5 text-muted-foreground" />
                )}

                {step.status === "failed" && (
                  <Cross2Icon className="h-3.5 w-3.5 text-destructive" />
                )}

                {(step.status === "pending" ||
                  step.status === "pending_human_approval") && (
                  <span className="h-2 w-2 rounded-full border border-muted-foreground/60" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="leading-5 text-foreground">
                  {step.plan}
                </p>

                {step.agent_name && (
                  <div className="mt-1.5">
                    <span className="inline-flex rounded-md bg-muted/70 px-2 py-0.5 font-mono text-[10px] leading-4 text-muted-foreground">
                      {step.agent_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
