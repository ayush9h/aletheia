/**
 *
 * List of MessageBubbles
 */
import { Message } from "@/app/types/user-message";
import MessageBubble from "./message-bubble";
import { memo } from "react";

const MessageList = memo(function MessageList({
  messages,
}: {
  messages: Message[];
}) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
      {messages.map((msg, i) => (
        <MessageBubble key={i} message={msg} />
      ))}
    </div>
  );
});

export default MessageList;
