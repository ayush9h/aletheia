import { motion } from "motion/react";

import MessageList from "@/features/chat/components/message-list";
import GreetingWindow from "@/features/chat/components/greeting-window";
import ChatInput from "@/features/chat/components/chat-input";

import { useAutoScroll } from "@/features/chat/hooks/useAutoScroll";
import type { ChatWindowProps } from "@/features/chat/types/chats.types";

export default function ChatWindow(props: ChatWindowProps) {
  const { bottomRef } = useAutoScroll(props.messages.length);

  const isEmpty = props.messages.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-stone-100/40 dark:bg-stone-800/60">
      <div className={`flex min-h-0 flex-1 flex-col items-center overflow-hidden ${isEmpty ? "justify-center" : ""}`}>
        {!isEmpty && (
          // Fade messages out above the input instead of a hard clip line
          <div className="min-h-0 w-full flex-1 overflow-hidden overscroll-contain [mask-image:linear-gradient(to_bottom,black_calc(100%-2.5rem),transparent)]">
            <MessageList messages={props.messages} bottomRef={bottomRef} />
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
              tools={props.tools}
              onSend={props.onSend}
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
