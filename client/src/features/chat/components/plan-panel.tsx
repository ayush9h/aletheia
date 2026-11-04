"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDownIcon, CheckIcon, Cross2Icon } from "@radix-ui/react-icons";
import { useAgents } from "@/features/chat/hooks/useAgents";
import { Plan, PlanStep } from "@/types/user-message";

type PlanPanelProps = {
  plan?: Plan;
  isStreaming?: boolean;
  hasText: boolean;
};

type StepState = PlanStep["status"] | "stopped";

const STATE_TEXT: Record<StepState, string> = {
  pending: "Not started",
  running: "In progress",
  success: "Done",
  failed: "Failed",
  stopped: "Stopped",
  pending_human_approval: "Waiting for your approval",
};

// Fallback for agents the /agents endpoint doesn't list
function humanize(name: string) {
  const words = name.replace(/_agent$/, "").replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatElapsed(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function useElapsed(active: boolean) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) return;
    const startedAt = Date.now();
    const interval = setInterval(
      () => setSeconds(Math.floor((Date.now() - startedAt) / 1000)),
      1000
    );
    return () => clearInterval(interval);
  }, [active]);

  return seconds;
}

function StepGlyph({ state }: { state: StepState }) {
  if (state === "running") {
    return (
      <span className="h-2 w-2 animate-pulse rounded-full bg-foreground motion-reduce:animate-none" />
    );
  }
  if (state === "success") {
    return <CheckIcon aria-hidden className="h-3.5 w-3.5 text-foreground/70" />;
  }
  if (state === "failed" || state === "stopped") {
    return <Cross2Icon aria-hidden className="h-3.5 w-3.5 text-destructive" />;
  }
  if (state === "pending_human_approval") {
    return <span className="h-2 w-2 rounded-full border-2 border-brand-500" />;
  }
  return <span className="h-2 w-2 rounded-full border border-muted-foreground/60" />;
}

export default function PlanPanel({ plan, isStreaming = false, hasText }: PlanPanelProps) {
  const [userOpen, setUserOpen] = useState<boolean | null>(null);
  const listId = useId();
  const agents = useAgents();
  const elapsed = useElapsed(isStreaming);

  const labelOf = (name: string) =>
    agents.find((agent) => agent.name === name)?.label ?? humanize(name);

  // A step still pending or running after the stream ends never finished
  const stateOf = (step: PlanStep): StepState =>
    !isStreaming && (step.status === "running" || step.status === "pending")
      ? "stopped"
      : step.status;

  const steps = plan?.steps ?? [];
  const agentSteps = steps.filter((step) => step.agent_name);
  const running = agentSteps.filter((step) => step.status === "running");
  const finished = agentSteps.filter((step) =>
    ["success", "failed"].includes(step.status)
  ).length;
  const unfinished = agentSteps.filter((step) =>
    ["failed", "stopped"].includes(stateOf(step))
  ).length;
  const usedLabels = [
    ...new Set(agentSteps.map((step) => labelOf(step.agent_name as string))),
  ];

  // Direct answers need no status once the text is there
  if (!isStreaming && !agentSteps.length) return null;
  if (isStreaming && hasText && !agentSteps.length) return null;

  let phase: string;
  if (!isStreaming) {
    phase = `Used ${agentSteps.length} step${agentSteps.length > 1 ? "s" : ""} · ${usedLabels.join(", ")}`;
  } else if (!plan) {
    phase = "Planning";
  } else if (hasText) {
    phase = "Writing the answer";
  } else if (running.length === 1) {
    phase = labelOf(running[0].agent_name as string);
  } else if (running.length > 1) {
    phase = `${running.length} steps in parallel`;
  } else if (agentSteps.length && finished < agentSteps.length) {
    phase = "Starting";
  } else if (agentSteps.length) {
    phase = "Writing the answer";
  } else {
    phase = "Answering directly";
  }

  const details = [
    isStreaming && agentSteps.length && !hasText
      ? `${finished} of ${agentSteps.length} done`
      : null,
    unfinished ? `${unfinished} didn't finish` : null,
    isStreaming && elapsed >= 10 ? formatElapsed(elapsed) : null,
  ].filter(Boolean);

  const isOpen = userOpen ?? (isStreaming && !hasText);
  const canExpand = agentSteps.length > 0;

  const summary = (
    <>
      {isStreaming && (
        <span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-foreground/70 motion-reduce:animate-none"
        />
      )}
      <span className={isStreaming ? "text-foreground/80" : undefined}>
        {phase}
        {isStreaming && !hasText && "…"}
      </span>
      {details.map((detail) => (
        <span key={detail} className="tabular-nums">
          · {detail}
        </span>
      ))}
    </>
  );

  return (
    <div className="mb-3 font-paragraph text-xs">
      <span role="status" aria-live="polite" className="sr-only">
        {phase}
      </span>

      {canExpand ? (
        <button
          type="button"
          onClick={() => setUserOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls={listId}
          className="flex min-h-6 max-w-full cursor-pointer items-center gap-1.5 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {summary}
          <ChevronDownIcon
            aria-hidden
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      ) : (
        <div className="flex min-h-6 items-center gap-1.5 text-muted-foreground">{summary}</div>
      )}

      {canExpand && isOpen && (
        <ol id={listId} className="mt-2.5 ml-1 border-l border-border/70 pl-3.5">
          {agentSteps.map((step, index) => {
            const state = stateOf(step);
            return (
              <li
                key={step.step_id}
                className={`relative flex gap-2.5 ${index !== agentSteps.length - 1 ? "pb-3" : ""}`}
              >
                <div className="flex h-5 w-3.5 shrink-0 items-center justify-center">
                  <StepGlyph state={state} />
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className={`leading-5 ${
                      state === "pending" ? "text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {step.plan}
                  </p>

                  <p className="mt-0.5 leading-4 text-muted-foreground">
                    {labelOf(step.agent_name as string)}
                    {state !== "success" && state !== "pending" && (
                      <span
                        className={
                          state === "failed" || state === "stopped" ? "text-destructive" : undefined
                        }
                      >
                        {" "}· {STATE_TEXT[state]}
                      </span>
                    )}
                    {(state === "success" || state === "pending") && (
                      <span className="sr-only"> · {STATE_TEXT[state]}</span>
                    )}
                  </p>

                  {/* The agent's raw result, so the answer can be checked against it */}
                  {state === "success" && step.evidence?.content && (
                    <details className="group mt-1.5">
                      <summary className="w-fit cursor-pointer list-none rounded-sm leading-5 text-muted-foreground underline decoration-current/40 underline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                        <span className="group-open:hidden">Show what it found</span>
                        <span className="hidden group-open:inline">Hide what it found</span>
                      </summary>
                      <div className="mt-1.5 max-h-60 overflow-y-auto whitespace-pre-wrap break-words rounded-md bg-muted/60 px-3 py-2 leading-5 text-foreground/85">
                        {step.evidence.content}
                      </div>
                    </details>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
