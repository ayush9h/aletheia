import { api } from "./axiosRoute";
import { UserPrefProps } from "@/app/types/userPref";

/** Send a chat query with model selection, session context, and user personalization */
export async function sendChatMessage(
  selectedModel: string,
  question: string,
  userPref: UserPrefProps,
  selectedSessionId: number | null,
  userId: string
) {
  return api.post("/chat", {
    model: selectedModel,
    query: question,
    userPref: userPref,
    selectedSessionId: selectedSessionId,
    userId: userId,
  });
}
