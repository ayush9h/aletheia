import { useEffect, useCallback, Dispatch } from "react";
import { saveUserPref, getUserPref } from "../lib/api/userData";
import { ChatAction } from "../types/chats/chat-action";
import { UserPrefProps } from "../types/user-pref";

/** Fetch user AI preferences into chat state */
export function useUserPreferences(
  userId: string | undefined,
  dispatch: Dispatch<ChatAction>
) {
  useEffect(() => {
    if (!userId) return;

    getUserPref(userId)
      .then((res) => {
        dispatch({ type: "SET_USER_PREF", payload: res.data });
      })
      .catch(() => {
        dispatch({
          type: "SET_USER_PREF",
          payload: {
            userCustomInstruction: "",
            nickname: "",
            occupation: "",
            baseTone: "",
            userHobbies: "",
          },
        });
      });
  }, [userId, dispatch]);
}

/** Persist updated user AI preferences to backend */
export function useSaveUserPreferences() {
  const savePreferences = useCallback(
    async (userId: string, userPref: UserPrefProps) => {
      if (!userId) return;

      await saveUserPref({
        userId,
        ...userPref,
      });
    },
    []
  );

  return { savePreferences };
}
