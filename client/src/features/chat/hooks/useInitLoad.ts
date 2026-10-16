// Hook responsible for initial chat state hydration
import { useEffect } from "react";
import { userSessions } from "@/lib/api/user-data";
import { ChatAction } from "@/features/chat/types/chat-action";

export function useInitLoad(
  userId: string,
  dispatch: React.Dispatch<ChatAction>
) {
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      try {
        const sessionsRes = await userSessions(userId);
        const sessions = sessionsRes.data;

        if (cancelled) return;

        dispatch({ type: "SET_SESSIONS", payload: sessions });
      } catch {}
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, dispatch]);
}
