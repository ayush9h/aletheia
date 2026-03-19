/**
 * Hook responsible for handling chat session level mutations.
 * @param authUserId - Authenticated user id required for API calls
 * @param dispatch - Chat reducer dispatch function
 * @param selectedSessionId - Currently active session id
 *
 * @returns deleteSession function
 */

import { Dispatch, useCallback } from "react";
import { ChatAction } from "../types/chats/chat-action";
import { deleteUserSession } from "../lib/api/userData";

export function useChatSession(
  authuserId: string | undefined,
  dispatch: Dispatch<ChatAction>,
  selectedSessionId: number | null
) {
  /**
   * Deletes a chat session and updates reducer state accordingly.
   *
   * @param sessionId - ID of the session to delete
   */
  return useCallback(
    async (sessionId: number) => {
      if (!authuserId) return;

      try {
        await deleteUserSession(sessionId, authuserId);

        dispatch({ type: "DELETE_SESSION", payload: sessionId });

        if (selectedSessionId === sessionId) {
          dispatch({ type: "SET_SELECTED_SESSION", payload: null });
          dispatch({ type: "SET_MESSAGES", payload: [] });
        }
      } catch (err) {
        console.error("Failed to delete session", err);
      }
    },
    [authuserId, dispatch, selectedSessionId]
  );
}
