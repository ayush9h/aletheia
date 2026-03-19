/**
 *
 * List of MessageBubbles
 */
import { Message } from "@/app/types/userMessage";
import MessageBubble from "./message-bubble";
import { memo } from "react";

const MessageList = memo(function MessageList({
  messages,
  userName,
}: {
  messages: Message[];
  userName: string;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mx-auto max-w-3xl space-y-4">
        {/* If Message length == 0, show default username with a message */}
        {messages.length == 0 ? (
          <>
            <div className="font-paragraph flex h-full items-center justify-center text-center">
              <h1 className="text-2xl text-stone-800">
                Hello {userName}, ready when you are.
              </h1>
            </div>
          </>
        ) : (
          <>
            {/* Show the list of messages using MessageBubble */}
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
          </>
        )}
      </div>
    </div>
  );
});

export default MessageList;
