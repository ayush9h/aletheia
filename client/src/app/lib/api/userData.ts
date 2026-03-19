import { UserPrefProps } from "@/app/types/user-pref";
import { api } from "./axiosRoute";

/** Fetch messages for a specific chat session */
export async function userChats(sessionId: number) {
  return api.get("/chats", {
    params: {
      session_id: sessionId,
    },
  });
}

/** Fetch all chat sessions for a given user */
export async function userSessions(userId: string) {
  return api.get("/sessions", {
    params: {
      user_id: userId,
    },
  });
}

/** Toggle pin state for a session */
export async function pinSession(sessionId: number, userId: string) {
  return api.post(`/sessions/${sessionId}/toggle-pin-session`, null, {
    params: { user_id: userId },
  });
}

/** Explicitly unpin a session */
export async function unpinSession(sessionId: number, userId: string) {
  return api.post(`/sessions/${sessionId}/unpin`, null, {
    params: { user_id: userId },
  });
}

/** Persist user AI personalization preferences */
export async function saveUserPref(userPref: UserPrefProps) {
  return api.post("/users/preferences", userPref);
}

/** Retrieve stored user AI personalization preferences */
export async function getUserPref(userId: string) {
  return api.get("/users/preferences", { params: { user_id: userId } });
}

/** Delete a specific chat session for a user */
export async function deleteUserSession(sessionId: number, userId: string) {
  return api.delete(`/sessions/${sessionId}`, {
    params: {
      user_id: userId,
    },
  });
}

/** Delete all chats across sessions for a user */
export async function deleteUserChatsAll(userId: string) {
  return api.delete(`/sessions/all-chats/${userId}`);
}
