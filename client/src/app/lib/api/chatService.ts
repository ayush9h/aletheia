import { UserPrefProps } from "@/app/types/user-pref";

type StreamHandlers = {
  onPlan?: (plan: unknown) => void;
  onToken?: (token: string) => void;
  onFinal?: (payload: {
    service_output: {
      reasoning_content: string;
      response_content: string;
      duration: number;
      tokens_consumed: number;
    };
    session: { session_id: number; session_title: string; is_pinned: boolean };
  }) => void;
  onError?: (message: string) => void;
};

export async function streamChatMessage(
  selectedModel: string,
  question: string,
  userPref: UserPrefProps,
  selectedSessionId: number | null,
  userId: string,
  tools: string[],
  handlers: StreamHandlers,
  signal?: AbortSignal
) {
  const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "";

  const response = await fetch(`${baseURL}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: selectedModel,
      query: question,
      userPref: userPref,
      selectedSessionId: selectedSessionId,
      userId: userId,
      tools: tools,
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Stream request failed: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      if (!block.trim()) continue;

      const lines = block.split("\n");
      let eventType = "message";
      let dataLine = "";

      for (const line of lines) {
        if (line.startsWith("event:")) {
          eventType = line.slice("event:".length).trim();
        } else if (line.startsWith("data:")) {
          dataLine += line.slice("data:".length).trim();
        }
      }

      if (!dataLine) continue;

      let parsed: unknown;
      try {
        parsed = JSON.parse(dataLine);
      } catch {
        continue;
      }

      switch (eventType) {
        case "plan":
          handlers.onPlan?.((parsed as { plan: unknown }).plan);
          break;
        case "token":
          handlers.onToken?.((parsed as { token: string }).token);
          break;
        case "final":
          handlers.onFinal?.(
            parsed as Parameters<NonNullable<StreamHandlers["onFinal"]>>[0]
          );
          break;
        case "error":
          handlers.onError?.((parsed as { message: string }).message);
          break;
      }
    }
  }
}
