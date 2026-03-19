/**
 * Hook responsible for sending chat messages and reconciling chat state.
 *
 * @param params - Aggregated chat execution context and reducer references
 *
 * @returns sendMessage mutation handler
 */
import { useCallback } from "react";
import { sendChatMessage } from "../lib/api/chatService";
import { ChatAction } from "../types/chats/chat-action";
import { UserPrefProps } from "../types/user-pref";
import { Session } from "../types/user-message";

type Params = {
  input: string;
  selectedModel: string;
  userPref: UserPrefProps;
  selectedSessionId: number | null;
  sessions: Session[];
  userId?: string;
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
    dispatch,
  } = params;

  /**
   * Sends user message to backend and updates reducer state.
   *
   * Ensures:
   * - Optimistic UI update for user message
   * - Session bootstrap if none exists
   * - Assistant response normalization
   * - Graceful error fallback
   */
  return useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !userId) return;

    dispatch({
      type: "ADD_MESSAGE",
      payload: {
        role: "user",
        text: trimmed,
        reasoning: "",
        duration: 0,
        tokens_consumed: 0,
      },
    });

    dispatch({ type: "CLEAR_INPUT" });

    try {
      const res = await sendChatMessage(
        selectedModel,
        trimmed,
        userPref,
        selectedSessionId,
        userId
      );

      const newSession = res.data.session;

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
        type: "ADD_MESSAGE",
        payload: {
          role: "assistant",
          text: String(res.data.service_output.response_content ?? "..."),
          reasoning: String(res.data.service_output.reasoning_content ?? "..."),
          duration: res.data.service_output.duration ?? 0,
          tokens_consumed: res.data.service_output.tokens_consumed ?? 0,
        },
      });
    } catch {
      dispatch({
        type: "ADD_MESSAGE",
        payload: {
          role: "assistant",
          text: "Error getting response from API",
          reasoning: "",
          duration: 0,
          tokens_consumed: 0,
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
    dispatch,
  ]);
}
