/**
 * ChatPage is the orchestration root for the chat application.
 *
 * Responsibilities:
 * - Initialize reducer-driven chat state
 * - Coordinate session hydration and preference loading
 * - Bridge domain hooks to layout components
 * - Manage sidebar layout state */
"use client";

import { useReducer, useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "./components/sidebar";
import ChatWindow from "./components/chat-window";
import { ChatReducer } from "../reducers/chat-reducer";
import { InitialState } from "../types/chats/chat-state";

import { useInitLoad } from "../hooks/useInitLoad";
import { useSendMessage } from "../hooks/useSendMessage";
import { useUserPreferences } from "../hooks/useUserPref";
import { userChats } from "../lib/api/userData";
import Navbar from "@/app/components/navbar";


export default function ChatPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  /**
   * Global chat state container.
   */
  const [state, dispatch] = useReducer(ChatReducer, InitialState);

  /**
   * Sidebar layout state.
   */
  const [sidebarOpen, setSidebarOpen] = useState(true);
  /**
   * Initial data hydration.
   */
  useInitLoad(userId as string, dispatch);

  /**
   * User personalization hydration.
   */
  useUserPreferences(userId, dispatch);

  /**
   * Message send.
   */
  const handleSend = useSendMessage({
    input: state.input,
    selectedModel: state.selectedModel,
    userPref: state.userPref,
    selectedSessionId: state.selectedSessionId,
    sessions: state.sessions,
    tools: state.selectedTools,
    userId,
    dispatch,
  });

  /**
   * Session selection flow with message hydration.
   */
  const handleSessionSelect = async (sessionId: number) => {
    dispatch({ type: "SET_SELECTED_SESSION", payload: sessionId });
    try {
      const res = await userChats(sessionId);
      dispatch({ type: "SET_MESSAGES", payload: res.data });
    } catch {
      dispatch({ type: "SET_MESSAGES", payload: [] });
    }
  };

  return (
    <div
      className={`grid h-dvh overflow-hidden transition-all duration-300 ${
        sidebarOpen
          ? "grid-cols-[15rem_minmax(0,1fr)]"
          : "grid-cols-[4rem_minmax(0,1fr)]"
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

      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <div className="shrink-0">
          <Navbar
            dispatch={dispatch}
            userPref={state.userPref}
            setUserPref={(value) =>
              dispatch({
                type: "SET_USER_PREF",
                payload: value,
              })
            }
          />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <ChatWindow
            messages={state.messages}
            input={state.input}
            userPref={state.userPref}
            selectedModel={state.selectedModel}
            dispatch={dispatch}
            onSend={handleSend}
            userName={session?.user?.name ?? ""}
            tools={state.selectedTools}
          />
        </div>
      </div>
    </div>
  );
}
