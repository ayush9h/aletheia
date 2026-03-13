"use client";

import { useReducer, useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { ChatReducer } from "../reducers/reducerChat";
import { InitialState } from "../types/userChat";

import { useInitLoad } from "../hooks/useInitLoad";
import { useSendMessage } from "../hooks/useSendMessage";
import { useUserPreferences } from "../hooks/userUserPref";
import { userChats } from "../lib/api/userData";

export default function ChatPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [state, dispatch] = useReducer(ChatReducer, InitialState);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  
  useInitLoad(userId as string, dispatch);
  useUserPreferences(userId, dispatch);

  const handleSend = useSendMessage({
    input: state.input,
    selectedModel: state.selectedModel,
    userPref: state.userPref,
    selectedSessionId: state.selectedSessionId,
    sessions: state.sessions,
    userId,
    dispatch,
  });

  const handleSessionSelect = async (sessionId: number) => {
    dispatch({ type: "SET_SELECTED_SESSION", payload: sessionId });
    dispatch({ type: "SET_MESSAGES", payload: [] });

    try {
      const res = await userChats(sessionId);
      dispatch({ type: "SET_MESSAGES", payload: res.data });
    } catch {
      dispatch({ type: "SET_MESSAGES", payload: [] });
    }
  };

  return (
    <div
      className={`grid min-h-screen transition-all duration-300 ${
        sidebarOpen ? "grid-cols-[15rem_1fr]" : "grid-cols-[4rem_1fr]"
      }`}
    >
      <Sidebar
        open={sidebarOpen}
        onToggle={setSidebarOpen}
        sessions={state.sessions}
        selectedSessionId={state.selectedSessionId}
        onSelectSession={handleSessionSelect}
        dispatch={dispatch}
      />

      <ChatWindow
        messages={state.messages}
        input={state.input}
        userPref={state.userPref}
        selectedModel={state.selectedModel}
        dispatch={dispatch}
        onSend={handleSend}
      />
    </div>
  );
}