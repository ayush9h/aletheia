import { UserPrefProps } from "@/app/types/userPref";
import { api } from "./axiosRoute";
export async function userChats(sessionId: number) {
  return api.get("/chats", {
    params: {
      session_id: sessionId,
    },
  });
}

export async function userSessions(userId: string) {
  return api.get("/sessions", {
    params: {
      user_id: userId,
    },
  });
}

export async function pinSession(sessionId: number, userId: string) {
  return api.post(`/sessions/${sessionId}/toggle-pin-session`, null, {
    params: { user_id: userId },
  });
}

export async function unpinSession(sessionId: number, userId: string) {
  return api.post(`/sessions/${sessionId}/unpin`, null, {
    params: { user_id: userId },
  });
}


export async function saveUserPref(userPref: UserPrefProps) {
  return api.post("/users/preferences", userPref);
}


export async function getUserPref(userId: string) {

  return api.get("/users/preferences", {params:{user_id: userId}});

}


export async function deleteUserSession(sessionId: number, userId: string) {
  return api.delete(`/sessions/${sessionId}`, {
    params: {
      user_id: userId,
    },
  });
}


export async function deleteUserChatsAll(userId: string) {
  return api.delete(`/sessions/all-chats/${userId}`,);
}
