"use client";

import { Plan } from "@/app/types/user-message";
import {
  Accordion,
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from "@/app/components/ui/accordion";

type PlanPanelProps = {
  plan: Plan;
};

export default function PlanPanel({ plan }: PlanPanelProps) {
  if (!plan?.steps?.length) return null;

  return (
    <Accordion
      type="single"
      collapsible
      className="mb-4 flex flex-col rounded-md border border-stone-100 bg-stone-100 p-2"
    >
      <AccordionItem value="reasoning">
        <AccordionTrigger
          className="
            data-[state=open]:text-stone-700 py-1 px-0 text-xs
            text-stone-500 cursor-pointer
            hover:no-underline
          "
        >
          Show reasoning
        </AccordionTrigger>
        <AccordionContent className="px-0 pb-2 pt-1 text-xs leading-relaxed text-stone-600">
          <ol className="space-y-2">
            {plan.steps.map((step) => (
              <li key={step.step_id} className="flex items-center gap-2">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[10px] font-medium text-stone-600">
                  {step.step_id}
                </span>
                <div className="flex-1">
                  <p className="text-stone-600">{step.plan}</p>
                  {step.evidence?.tool_name && (
                    <span className="mt-1 inline-block rounded bg-stone-200 px-1.5 py-0.5 text-[10px] font-medium text-stone-700">
                      {step.evidence.tool_name}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
