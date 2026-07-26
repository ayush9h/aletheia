import { memo } from "react";

import type { Message } from "@/app/types/user-message";
import MessageBubble from "./message-bubble";

const MessageList = memo(function MessageList({
  messages,
}: {
  messages: Message[];
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-16 pt-4">
      {messages.map((message, index) => (
        <MessageBubble
          key={`${message.role}-${index}`}
          message={message}
        />
      ))}
    </div>
  );
});

export default MessageList;
