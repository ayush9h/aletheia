/**
 * ChatWindow composes the primary chat layout.
 *
 * Responsibilities:
 * - Orchestrate navbar, message timeline, and input composer
 * - Maintain scroll anchoring behavior
 * - When empty: center the greeting + composer in the middle of the screen
 * - Once messages exist: composer moves to the bottom, messages scroll above it
 *
 * Animation approach (kept deliberately simple):
 * - ChatInput is the ONLY animated element (motion.div + `layout`).
 * - It is never unmounted, never wrapped in AnimatePresence, and has no
 *   layoutId. It just sits in the same spot in the tree the whole time.
 * - Everything else (greeting vs message list) swaps instantly, with no
 *   competing enter/exit animation, so there's nothing left to fight with
 *   ChatInput's own layout transition. This is what removes the glitch.
 * */
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
    <div className="flex h-screen flex-col shadow-xl">
      {/* Application navigation + model controls */}
      <Navbar
        dispatch={ChatWindowProps.dispatch}
        userPref={ChatWindowProps.userPref}
        setUserPref={(v) =>
          ChatWindowProps.dispatch({ type: "SET_USER_PREF", payload: v })
        }
      />

      <div
        className={[
          "flex min-h-0 flex-1 flex-col",
          isEmpty ? "items-center justify-center gap-8 p-4" : "",
        ].join(" ")}
      >
        {isEmpty ? (
          <GreetingWindow userName={ChatWindowProps.userName} />
        ) : (
          <div
            ref={containerRef}
            className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto"
          >
            <MessageList messages={ChatWindowProps.messages} />
            <div ref={bottomRef} />
          </div>
        )}

        {/* The only animated element. `layout` alone (no layoutId, no
            AnimatePresence) makes motion smoothly interpolate its position
            whenever the sibling above it appears/disappears and the parent's
            justify-content shifts it from center to bottom. */}
        <motion.div
          layout
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className={isEmpty ? "w-full max-w-3xl" : "w-full"}
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
        </motion.div>
      </div>
    </div>
  );
}
