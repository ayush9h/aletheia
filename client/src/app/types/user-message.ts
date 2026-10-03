/**
 * Represents a single execution step in a generated plan.
 */
export type PlanStep = {
  step_id: number;
  plan: string;
  agent_name: string | null;
  agent_input: Record<string, unknown>;
  evidence: {
    id: string | null;
    content: string | null;
  };
  status:
    | "pending"
    | "running"
    | "success"
    | "failed"
    | "pending_human_approval";
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
  isStreaming?: boolean;
};

export type Session = {
  session_id: number;
  session_title: string;
  is_pinned: boolean;
  created_at: Date;
};
