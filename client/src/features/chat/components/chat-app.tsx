"use client";

import { useCallback, useReducer, useState } from "react";
import { useSession } from "next-auth/react";

import Navbar from "@/components/layout/navbar";
import ChatWindow from "@/features/chat/components/chat-window";
import { useInitLoad } from "@/features/chat/hooks/useInitLoad";
import { useSendMessage } from "@/features/chat/hooks/useSendMessage";
import { useTokenUsage } from "@/features/chat/hooks/useTokenUsage";
import { ChatReducer } from "@/features/chat/reducers/chat-reducer";
import { InitialState } from "@/features/chat/types/chat-state";
import { useConnectorToast } from "@/features/connectors/hooks/useConnectorToast";
import { useUserPreferences } from "@/features/settings/hooks/useUserPref";
import Sidebar from "@/features/sidebar/components/sidebar";
import { userChats } from "@/lib/api/user-data";
import type { UserPrefProps } from "@/types/user-pref";

export default function ChatApp() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [state, dispatch] = useReducer(ChatReducer, InitialState);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useConnectorToast();
  useInitLoad(userId as string, dispatch);
  useUserPreferences(userId, dispatch);

  const { usage, refresh: refreshUsage } = useTokenUsage(userId);

  const sendMessage = useSendMessage({
    input: state.input,
    selectedModel: state.selectedModel,
    userPref: state.userPref,
    selectedSessionId: state.selectedSessionId,
    sessions: state.sessions,
    tools: state.selectedTools,
    userId,
    dispatch,
  });

  const handleSend = useCallback(async () => {
    await sendMessage();
    refreshUsage();
  }, [sendMessage, refreshUsage]);

  // Selects a session and hydrates its messages
  const handleSessionSelect = useCallback(async (sessionId: number) => {
    dispatch({ type: "SET_SELECTED_SESSION", payload: sessionId });

    try {
      const res = await userChats(sessionId);
      dispatch({ type: "SET_MESSAGES", payload: res.data });
    } catch {
      dispatch({ type: "SET_MESSAGES", payload: [] });
    }
  }, []);

  const setUserPref = useCallback(
    (value: UserPrefProps) => dispatch({ type: "SET_USER_PREF", payload: value }),
    [],
  );

  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  return (
    <div
      className={`relative grid h-dvh w-full overflow-hidden transition-[grid-template-columns] duration-300 ${
        sidebarOpen ? "grid-cols-[16rem_minmax(0,1fr)]" : "grid-cols-[4rem_minmax(0,1fr)]"
      } max-md:grid-cols-1`}
    >
      <Sidebar
        open={sidebarOpen}
        onToggle={setSidebarOpen}
        sessions={state.sessions}
        selectedSessionId={state.selectedSessionId}
        onSelectSession={handleSessionSelect}
        dispatch={dispatch}
        userId={userId}
      />

      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <div className="shrink-0">
          <Navbar
            dispatch={dispatch}
            userPref={state.userPref}
            setUserPref={setUserPref}
            onOpenSidebar={openSidebar}
          />
        </div>

        <main className="min-h-0 flex-1 overflow-hidden">
          <ChatWindow
            messages={state.messages}
            input={state.input}
            userPref={state.userPref}
            selectedModel={state.selectedModel}
            dispatch={dispatch}
            onSend={handleSend}
            userName={session?.user?.name ?? ""}
            tools={state.selectedTools}
            usage={usage}
          />
        </main>
      </div>
    </div>
  );
}
