import { useEffect } from "react";
import { getUserPref } from "../lib/api/userData";
import { ChatAction } from "../types/userChat";

export function useUserPreferences(
  userId: string | undefined,
  dispatch: React.Dispatch<ChatAction>
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
            userPronouns: "",
            userHobbies: "",
          },
        });
      });
  }, [userId, dispatch]);
}