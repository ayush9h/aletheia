/**
 * ChatPage is the orchestration root for the chat application.
 *
 * Responsibilities:
 * - Initialize reducer-driven chat state
 * - Coordinate session hydration and preference loading
 * - Bridge domain hooks to layout components
 * - Manage sidebar layout state
 */

"use client";

import { useEffect, useReducer, useState } from "react";
import { useSession } from "next-auth/react";

import Sidebar from "./components/Sidebar/sidebar";
import ChatWindow from "./components/chat-window";

import { ChatReducer } from "../reducers/chat-reducer";
import { InitialState } from "../types/chats/chat-state";

import { useInitLoad } from "../hooks/useInitLoad";
import { useSendMessage } from "../hooks/useSendMessage";
import { useUserPreferences } from "../hooks/useUserPref";

import { userChats } from "../lib/api/userData";

import Navbar from "../components/navigation/navbar";
import { toast } from "sonner";

export default function ChatPage() {
  const { data: session } = useSession();

  const userId = session?.user?.id;

  /**
   * Global chat state container.
   */
  const [state, dispatch] = useReducer(
    ChatReducer,
    InitialState,
  );

  /**
   * Sidebar layout state.
   */
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /**
   * Connector events.
   */
  useEffect(() => {
    const handleConnectorMessage = (
      event: MessageEvent,
    ) => {
      // Only accept messages from our own application.
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type !== "connector") {
        return;
      }

      const { connector, status } = event.data;

      if (!connector || !status) {
        return;
      }

      const connectorName =
        connector.charAt(0).toUpperCase() +
        connector.slice(1);

      if (status === "connected") {
        toast.success(
          `${connectorName} connected successfully`,
          {
            className:
              "!border-green-200 !bg-green-50 !text-green-800",
          },
        );
      }

      if (status === "error") {
        toast.error(
          `Unable to connect ${connectorName}`,
        );
      }
    };

    window.addEventListener(
      "message",
      handleConnectorMessage,
    );

    return () => {
      window.removeEventListener(
        "message",
        handleConnectorMessage,
      );
    };
  }, []);

  /**
   * Initial data hydration.
   *
   * This loads the user's sessions and other initial
   * chat data.
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
  const handleSessionSelect = async (
    sessionId: number,
  ) => {
    dispatch({
      type: "SET_SELECTED_SESSION",
      payload: sessionId,
    });

    try {
      const res = await userChats(sessionId);

      dispatch({
        type: "SET_MESSAGES",
        payload: res.data,
      });
    } catch {
      dispatch({
        type: "SET_MESSAGES",
        payload: [],
      });
    }
  };

  return (
    <div
      className={`relative grid h-dvh w-full overflow-hidden transition-[grid-template-columns] duration-300 ${
        sidebarOpen
          ? "grid-cols-[16rem_minmax(0,1fr)]"
          : "grid-cols-[4rem_minmax(0,1fr)]"
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
            setUserPref={(value) =>
              dispatch({
                type: "SET_USER_PREF",
                payload: value,
              })
            }
            onOpenSidebar={() => setSidebarOpen(true)}
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
          />
        </main>
      </div>
    </div>
  );
}
