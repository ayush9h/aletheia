import { useEffect } from "react";
import { userChats, userSessions } from "../lib/api/userData";
import { ChatAction } from "../types/userChat";

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

        if (!sessions.length) return;

        const topSession = sessions[0];
        dispatch({
          type: "SET_SELECTED_SESSION",
          payload: topSession.session_id,
        });

        const chatsRes = await userChats(topSession.session_id);
        dispatch({ type: "SET_MESSAGES", payload: chatsRes.data });
      } catch {}
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, dispatch]);
}