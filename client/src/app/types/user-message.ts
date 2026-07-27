/**
 * Represents a single conversational message unit.
 */

export type PlanStep = {
  step_id: number;
  plan: string;
  evidence: {
    id: string;
    content: string | null;
    tool_name: string | null;
    tool_input: Record<string, unknown>;
  };
  status: string;
};

export type Plan = {
  steps: PlanStep[];
};
export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  plan?: Plan;
  duration: number;
  tokens_consumed: number;
  isStreaming?:boolean
};

/**
 * Represents a persisted chat session container.
 */
export type Session = {
  session_id: number;
  session_title: string;
  is_pinned: boolean;
};
