import { motion } from "motion/react";

import MessageList from "./message-list";
import GreetingWindow from "./greeting-window";
import ChatInput from "./chat-input";

import { useAutoScroll } from "@/app/reducers/auto-scroll";
import type { ChatWindowProps } from "@/app/types/chats/chats.type";

export default function ChatWindow(props: ChatWindowProps) {
  const { bottomRef } = useAutoScroll(props.messages.length);

  const isEmpty = props.messages.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div
        className={`flex min-h-0 flex-1 flex-col items-center overflow-hidden ${
          isEmpty ? "justify-center" : ""
        }`}
      >
        {/* Message area takes remaining height only when messages exist */}
        {!isEmpty && (
          <div className="min-h-0 w-full flex-1 overflow-hidden overscroll-contain">
            <MessageList messages={props.messages} bottomRef={bottomRef} />
          </div>
        )}

        {/* Empty-state greeting */}
        {isEmpty && (
          <div className="mb-6 shrink-0 text-center">
            <GreetingWindow userName={props.userName} />
          </div>
        )}

        {/* Centered when empty, bottom-positioned when messages exist */}
        <motion.div
          layout="position"
          transition={{
            duration: 0.4,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={`flex w-full shrink-0 justify-center px-4 ${
            isEmpty ? "" : "pb-3"
          }`}
        >
          <div className="w-full max-w-4xl transition-[max-width] duration-300 ease-in-out">
            <ChatInput
              value={props.input}
              onChange={(value) =>
                props.dispatch({
                  type: "SET_INPUT",
                  payload: value,
                })
              }
              dispatch={props.dispatch}
              tools={props.tools}
              onSend={props.onSend}
              setSelectedModel={(model) =>
                props.dispatch({
                  type: "SET_MODEL",
                  payload: model,
                })
              }
              selectedModel={props.selectedModel}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
