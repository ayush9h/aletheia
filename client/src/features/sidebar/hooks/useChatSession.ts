// Hook responsible for handling chat session level mutations

import { Dispatch, useCallback } from "react";
import { ChatAction } from "@/features/chat/types/chat-action";
import { deleteUserSession } from "@/lib/api/user-data";

export function useChatSession(
  authuserId: string | undefined,
  dispatch: Dispatch<ChatAction>,
  selectedSessionId: number | null
) {
  // Deletes a chat session and updates reducer state accordingly
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
