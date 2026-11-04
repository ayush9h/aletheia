import { motion } from "motion/react";

import MessageList from "@/features/chat/components/message-list";
import GreetingWindow from "@/features/chat/components/greeting-window";
import ChatInput from "@/features/chat/components/chat-input";

import { useAutoScroll } from "@/features/chat/hooks/useAutoScroll";
import type { ChatWindowProps } from "@/features/chat/types/chats.types";

export default function ChatWindow(props: ChatWindowProps) {
  const { bottomRef } = useAutoScroll(props.messages.length);

  const isLoading = props.sessionStatus === "loading";
  const loadFailed = props.sessionStatus === "failed";
  const isEmpty = props.messages.length === 0 && !isLoading && !loadFailed;

  // Announce answers sent in this visit only; loaded history has no prompt
  const last = props.messages.at(-1);
  const announcement =
    last?.role === "assistant" && last.prompt
      ? last.isStreaming
        ? "Aletheia is answering"
        : last.error || "Answer ready"
      : "";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-stone-100/40 dark:bg-stone-800/60">
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>

      <div className={`flex min-h-0 flex-1 flex-col items-center overflow-hidden ${isEmpty ? "justify-center" : ""}`}>
        {props.messages.length > 0 && (
          // Fade messages out above the input instead of a hard clip line
          <div className="min-h-0 w-full flex-1 overflow-hidden overscroll-contain [mask-image:linear-gradient(to_bottom,black_calc(100%-2.5rem),transparent)]">
            <MessageList
              messages={props.messages}
              bottomRef={bottomRef}
              onRetry={props.isStreaming ? undefined : props.onSend}
            />
          </div>
        )}

        {isLoading && (
          <div aria-busy="true" aria-label="Loading chat" className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 pt-6">
            {["ml-auto w-2/5", "w-4/5", "w-3/5", "ml-auto w-1/3", "w-3/4"].map((width) => (
              <div
                key={width}
                className={`h-5 animate-pulse rounded-md bg-stone-200 motion-reduce:animate-none dark:bg-stone-700/60 ${width}`}
              />
            ))}
          </div>
        )}

        {loadFailed && (
          <div role="alert" className="font-paragraph flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center text-sm text-stone-600 dark:text-stone-300">
            <p>Couldn&apos;t load this chat. Check your connection and try again.</p>
            <button
              type="button"
              onClick={props.onRetryLoad}
              className="min-h-11 cursor-pointer rounded-md border border-stone-300 px-4 text-stone-800 transition-colors hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:border-stone-600 dark:text-stone-100 dark:hover:bg-stone-800"
            >
              Retry
            </button>
          </div>
        )}

        {isEmpty && (
          <div className="mb-6 shrink-0 text-center">
            <GreetingWindow userName={props.userName} />
          </div>
        )}

        <motion.div layout="position" transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className={`flex w-full shrink-0 justify-center px-4 ${isEmpty ? "" : "pb-3"}`}>
          <div className="w-full max-w-4xl transition-[max-width] duration-300 ease-in-out">
            <ChatInput
              value={props.input}
              onChange={(value) => props.dispatch({ type: "SET_INPUT", payload: value })}
              dispatch={props.dispatch}
              agents={props.agents}
              tools={props.tools}
              onSend={() => props.onSend()}
              isStreaming={props.isStreaming}
              setSelectedModel={(model) => props.dispatch({ type: "SET_MODEL", payload: model })}
              selectedModel={props.selectedModel}
              showStarterPrompts={isEmpty}
              usage={props.usage}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
