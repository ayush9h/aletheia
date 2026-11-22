"use client";

import { useCallback, useEffect, useReducer, useState } from "react";
import { useSession } from "next-auth/react";

import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Ghost } from "lucide-react";

import AppTooltip from "@/components/ui/app-tooltip";
import ChatWindow from "@/features/chat/components/chat-window";
import { GhostTitleBar } from "@/features/chat/components/ghost-mode";
import { useAgents } from "@/features/chat/hooks/useAgents";
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

const MOBILE_QUERY = "(max-width: 767px)";

export default function ChatApp() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [state, dispatch] = useReducer(ChatReducer, InitialState);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<
    "idle" | "loading" | "failed"
  >("idle");

  useConnectorToast();
  useInitLoad(userId as string, dispatch);
  useUserPreferences(userId, dispatch);

  const { usage, refresh: refreshUsage } = useTokenUsage(userId);
  const agents = useAgents();

  const send = useSendMessage({
    input: state.input,
    selectedModel: state.selectedModel,
    userPref: state.userPref,
    selectedSessionId: state.selectedSessionId,
    sessions: state.sessions,
    tools: state.selectedTools,
    ghost: state.ghost,
    userId,
    dispatch,
  });

  const isStreaming = state.messages.some((message) => message.isStreaming);

  const handleSend = useCallback(
    async (text?: string) => {
      await send(text);
      refreshUsage();
    },
    [send, refreshUsage]
  );

  // Selects a session and hydrates its messages
  const handleSessionSelect = useCallback(async (sessionId: number) => {
    dispatch({ type: "SET_SELECTED_SESSION", payload: sessionId });
    dispatch({ type: "SET_MESSAGES", payload: [] });
    setSessionStatus("loading");
    if (window.matchMedia(MOBILE_QUERY).matches) setSidebarOpen(false);

    try {
      const res = await userChats(sessionId);
      dispatch({ type: "SET_MESSAGES", payload: res.data });
      setSessionStatus("idle");
    } catch {
      setSessionStatus("failed");
    }
  }, []);

  const setUserPref = useCallback(
    (value: UserPrefProps) =>
      dispatch({ type: "SET_USER_PREF", payload: value }),
    []
  );

  const openSidebar = useCallback(() => setSidebarOpen(true), []);

  const exitGhost = useCallback(
    () => dispatch({ type: "SET_GHOST", payload: false }),
    []
  );

  // Ctrl/Cmd+Shift+G toggles ghost mode; the sidebar owns the other chat shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;
      if (!event.shiftKey || event.key.toLowerCase() !== "g") return;

      event.preventDefault();
      dispatch({ type: "SET_GHOST", payload: !state.ghost });
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [state.ghost]);

  return (
    <div
      className={`h-dvh relative grid w-full overflow-hidden ${
        state.ghost
          ? "dark:bg-stone-950 grid-cols-1 bg-stone-100"
          : sidebarOpen
          ? "grid-cols-[16rem_minmax(0,1fr)]"
          : "grid-cols-[4rem_minmax(0,1fr)]"
      } max-md:grid-cols-1`}
    >
      {/* Ghost mode takes the whole window, so the saved-chat shell goes away */}
      {!state.ghost && (
        <Sidebar
          open={sidebarOpen}
          onToggle={setSidebarOpen}
          sessions={state.sessions}
          selectedSessionId={state.selectedSessionId}
          onSelectSession={handleSessionSelect}
          dispatch={dispatch}
          userId={userId}
          userPref={state.userPref}
          setUserPref={setUserPref}
        />
      )}

      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        {state.ghost ? (
          <GhostTitleBar onExit={exitGhost} />
        ) : (
          <div className="flex shrink-0 items-center gap-2 bg-stone-100/40 px-3 py-2 dark:bg-stone-800/60">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={openSidebar}
              className="size-9 flex shrink-0 cursor-pointer items-center justify-center rounded-md text-stone-600 transition-colors hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800 md:hidden"
            >
              <HamburgerMenuIcon className="size-4" />
            </button>

            <AppTooltip label="Aoratos chat (Ctrl Shift G)">
              <button
                type="button"
                aria-label="Start a ghost chat"
                aria-pressed={false}
                onClick={() => dispatch({ type: "SET_GHOST", payload: true })}
                className="size-9 ml-auto flex shrink-0 cursor-pointer items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-200 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
              >
                <Ghost className="size-[18px]" />
              </button>
            </AppTooltip>
          </div>
        )}

        {/* Ghost chat sits in an inset dark panel, framed by the window around it */}
        <main
          className={`min-h-0 flex-1 overflow-hidden ${
            state.ghost
              ? "ghost-surface dark mx-3 mb-3 rounded-2xl bg-stone-900 ring-1 ring-stone-800/80"
              : ""
          }`}
        >
          <ChatWindow
            messages={state.messages}
            input={state.input}
            userPref={state.userPref}
            selectedModel={state.selectedModel}
            dispatch={dispatch}
            onSend={handleSend}
            isStreaming={isStreaming}
            sessionStatus={sessionStatus}
            onRetryLoad={() =>
              state.selectedSessionId &&
              handleSessionSelect(state.selectedSessionId)
            }
            userName={session?.user?.name ?? ""}
            agents={agents}
            tools={state.selectedTools}
            usage={usage}
            ghost={state.ghost}
          />
        </main>
      </div>
    </div>
  );
}
