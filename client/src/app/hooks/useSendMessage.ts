import { useCallback } from "react";
import { streamChatMessage } from "../lib/api/chatService";
import { ChatAction } from "../types/chats/chat-action";
import { UserPrefProps } from "../types/user-pref";
import { Plan, Session } from "../types/user-message";

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

  return useCallback(async () => {
    const trimmed = input.trim();

    if (!trimmed || !userId) return;

    const messageId = crypto.randomUUID();

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

    dispatch({ type: "CLEAR_INPUT" });
    dispatch({ type: "SET_TOOLS", payload: [] });

    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        id: `${messageId}-assistant`,
        role: "assistant",
        text: "",
        duration: 0,
        tokens_consumed: 0,
        isStreaming: true,
      },
    });

    let streamedText = "";

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
              type: "UPDATE_LAST_ASSISTANT_MESSAGE",
              payload: {
                plan: plan as Plan,
              },
            });
          },

          onAgent: (agent) => {
            dispatch({
              type: "UPDATE_LAST_ASSISTANT_PLAN_STEP",
              payload: {
                step_id: agent.step_id,
                agent_name: agent.agent_name,
                status: agent.status,
              },
            });
          },

          onToken: (token) => {
            streamedText += token;

            dispatch({
              type: "UPDATE_LAST_ASSISTANT_MESSAGE",
              payload: {
                text: streamedText,
                isStreaming: true,
              },
            });
          },

          onFinal: (payload) => {
            const newSession = payload.session;

            if (!selectedSessionId && newSession) {
              dispatch({
                type: "SET_SELECTED_SESSION",
                payload: newSession.session_id,
              });

              dispatch({
                type: "SET_SESSIONS",
                payload: [newSession, ...sessions],
              });
            }

            dispatch({
              type: "UPDATE_LAST_ASSISTANT_MESSAGE",
              payload: {
                text: payload.service_output.response_content,
                duration: payload.service_output.duration,
                tokens_consumed:
                  payload.service_output.tokens_consumed,
                isStreaming: false,
              },
            });
          },

          onError: () => {
            dispatch({
              type: "UPDATE_LAST_ASSISTANT_MESSAGE",
              payload: {
                text: "Oops something went wrong. Try Again Later.",
                isStreaming: false,
              },
            });
          },
        }
      );
    } catch {
      dispatch({
        type: "UPDATE_LAST_ASSISTANT_MESSAGE",
        payload: {
          text: "Oops something went wrong. Try Again Later.",
          isStreaming: false,
        },
      });
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
}
