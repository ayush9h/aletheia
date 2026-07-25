import Navbar from "@/app/components/navbar";
import MessageList from "./message-list";
import GreetingWindow from "./greeting-window";
import ChatInput from "./chat-input";
import { AutoScroll } from "@/app/reducers/auto-scroll";
import { ChatWindowProps } from "@/app/types/chats/chats.type";
import { motion } from "motion/react";

export default function ChatWindow(ChatWindowProps: ChatWindowProps) {
  // AutoScroll
  const { containerRef, bottomRef } = AutoScroll<HTMLDivElement>([
    ChatWindowProps.messages.length,
  ]);

  const isEmpty = ChatWindowProps.messages.length === 0;

  return (
    <div className="flex h-screen flex-col shadow-xl overflow-hidden">
      {/* Application navigation + model controls */}
      <Navbar
        dispatch={ChatWindowProps.dispatch}
        userPref={ChatWindowProps.userPref}
        setUserPref={(v) =>
          ChatWindowProps.dispatch({ type: "SET_USER_PREF", payload: v })
        }
      />


      <div className="flex min-h-0 flex-1 flex-col justify-center items-center">
        <div
          className={`w-full transition-all duration-300 ease-in-out ${
            isEmpty ? "h-0 flex-0 overflow-hidden" : "flex-1 min-h-0"
          }`}
        >
          {!isEmpty && (
            <div
              ref={containerRef}
              className="flex h-full w-full flex-col overflow-y-auto"
            >
              <MessageList messages={ChatWindowProps.messages} />
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {isEmpty && (
          <div className="mb-6 text-center">
            <GreetingWindow userName={ChatWindowProps.userName} />
          </div>
        )}

        <motion.div
          layout="position"
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full flex justify-center px-4 pb-4"
        >
          <div
            className="w-full transition-[max-width] duration-300 ease-in-out max-w-4xl"
          >
            <ChatInput
              value={ChatWindowProps.input}
              onChange={(v) =>
                ChatWindowProps.dispatch({ type: "SET_INPUT", payload: v })
              }
              dispatch={ChatWindowProps.dispatch}
              tools={ChatWindowProps.tools}
              onSend={ChatWindowProps.onSend}
              setSelectedModel={(m) =>
                ChatWindowProps.dispatch({ type: "SET_MODEL", payload: m })
              }
              selectedModel={ChatWindowProps.selectedModel}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
