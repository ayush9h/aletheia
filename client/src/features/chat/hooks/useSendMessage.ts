import { useCallback, useRef } from "react";
import { streamChatMessage } from "@/features/chat/api/chat-service";
import { ChatAction } from "@/features/chat/types/chat-action";
import { UserPrefProps } from "@/types/user-pref";
import { EmailDraft, Plan, Session } from "@/types/user-message";

type Params = {
  input: string;
  selectedModel: string;
  userPref: UserPrefProps;
  selectedSessionId: number | null;
  sessions: Session[];
  userId?: string;
  tools: string[];
  dispatch: React.Dispatch<ChatAction>;
};

function errorText(error: unknown) {
  const status = (error as { status?: number } | null)?.status;
  if (status === 429) {
    return "Too many requests right now. Wait a moment, then retry.";
  }
  if (!navigator.onLine) {
    return "You're offline. Reconnect, then retry.";
  }
  return "The answer didn't finish.";
}

export function useSendMessage(params: Params) {
  const {
    input,
    selectedModel,
    userPref,
    selectedSessionId,
    sessions,
    userId,
    tools,
    dispatch,
  } = params;

  // Tracks the open session so a late reply doesn't pull the user back to it
  const sessionRef = useRef(selectedSessionId);
  sessionRef.current = selectedSessionId;

  // text overrides the composer, so Retry can resend the original question
  const send = useCallback(async (text?: string) => {
    const trimmed = (text ?? input).trim();

    if (!trimmed || !userId) return;

    const messageId = crypto.randomUUID();
    const assistantId = `${messageId}-assistant`;

    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: `${messageId}-user`,
        role: "user",
        text: trimmed,
        duration: 0,
        tokens_consumed: 0,
      },
    });

    if (text === undefined) {
      dispatch({ type: "CLEAR_INPUT" });
      dispatch({ type: "SET_TOOLS", payload: [] });
    }

    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: assistantId,
        role: "assistant",
        text: "",
        duration: 0,
        tokens_consumed: 0,
        isStreaming: true,
        prompt: trimmed,
      },
    });

    let streamedText = "";
    let emailDrafts: EmailDraft[] = [];
    let settled = false;

    const fail = (error: string) => {
      settled = true;
      dispatch({
        type: "UPDATE_ASSISTANT_MESSAGE",
        payload: { id: assistantId, isStreaming: false, error },
      });
    };

    try {
      await streamChatMessage(
        selectedModel,
        trimmed,
        userPref,
        selectedSessionId,
        userId,
        tools,
        {
          onPlan: (plan) => {
            dispatch({
              type: "UPDATE_ASSISTANT_MESSAGE",
              payload: { id: assistantId, plan: plan as Plan },
            });
          },

          onAgent: (agent) => {
            dispatch({
              type: "UPDATE_ASSISTANT_PLAN_STEP",
              payload: {
                id: assistantId,
                step_id: agent.step_id,
                agent_name: agent.agent_name,
                status: agent.status,
                evidence: agent.evidence,
              },
            });
          },

          onEmailDraft: (draft) => {
            emailDrafts = [...emailDrafts, draft];

            dispatch({
              type: "UPDATE_ASSISTANT_MESSAGE",
              payload: { id: assistantId, emailDrafts },
            });
          },

          onToken: (token) => {
            streamedText += token;

            dispatch({
              type: "UPDATE_ASSISTANT_MESSAGE",
              payload: { id: assistantId, text: streamedText, isStreaming: true },
            });
          },

          onFinal: (payload) => {
            settled = true;
            const newSession = payload.session;

            if (!selectedSessionId && newSession) {
              if (sessionRef.current === null) {
                dispatch({
                  type: "SET_SELECTED_SESSION",
                  payload: newSession.session_id,
                });
              }

              dispatch({
                type: "SET_SESSIONS",
                payload: [newSession, ...sessions],
              });
            }

            dispatch({
              type: "UPDATE_ASSISTANT_MESSAGE",
              payload: {
                id: assistantId,
                text: emailDrafts.length ? "" : payload.service_output.response_content,
                duration: payload.service_output.duration,
                tokens_consumed: payload.service_output.tokens_consumed,
                isStreaming: false,
              },
            });
          },

          onError: (message) => fail(message || errorText(null)),
        }
      );

      // The server can close the stream without a final or error event
      if (!settled) fail(errorText(null));
    } catch (error) {
      if (!settled) fail(errorText(error));
    }
  }, [
    input,
    selectedModel,
    userPref,
    selectedSessionId,
    sessions,
    userId,
    tools,
    dispatch,
  ]);

  return send;
}
