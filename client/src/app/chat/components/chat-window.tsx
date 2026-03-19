/**
 * ChatWindow composes the primary chat layout.
 *
 * Responsibilities:
 * - Orchestrate navbar, message timeline, and input composer
 * - Maintain scroll anchoring behavior
 * */
import Navbar from "@/app/components/navbar";
import MessageList from "./message-list";
import ChatInput from "./chat-input";
import { AutoScroll } from "@/app/reducers/auto-scroll";
import { ChatWindowProps } from "@/app/types/chats/chats.type";

export default function ChatWindow(ChatWindowProps: ChatWindowProps) {
  // AutoScroll
  const { containerRef, bottomRef } = AutoScroll<HTMLDivElement>([
    ChatWindowProps.messages.length,
  ]);

  return (
    <div className="flex h-screen flex-col shadow-xl">
      {/* Application navigation + model controls */}
      <Navbar
        selectedModel={ChatWindowProps.selectedModel}
        dispatch={ChatWindowProps.dispatch}
        setSelectedModel={(m) =>
          ChatWindowProps.dispatch({ type: "SET_MODEL", payload: m })
        }
        userPref={ChatWindowProps.userPref}
        setUserPref={(v) =>
          ChatWindowProps.dispatch({ type: "SET_USER_PREF", payload: v })
        }
      />

      {/* Scrollable message timeline */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <MessageList
          messages={ChatWindowProps.messages}
          userName={ChatWindowProps.userName}
        />
        <div ref={bottomRef} />
      </div>

      {/* Message composer */}

      <ChatInput
        value={ChatWindowProps.input}
        onChange={(v) =>
          ChatWindowProps.dispatch({ type: "SET_INPUT", payload: v })
        }
        onSend={ChatWindowProps.onSend}
      />
    </div>
  );
}
