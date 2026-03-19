/**
 * Represents a single conversational message unit.
 */
export type Message = {
  role: "user" | "assistant";
  text: string;
  reasoning: string;
  duration: number;
  tokens_consumed: number;
};

/**
 * Represents a persisted chat session container.
 */
export type Session = {
  session_id: number;
  session_title: string;
  is_pinned: boolean;
};
