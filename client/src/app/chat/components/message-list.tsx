import { memo } from "react";
import { Virtuoso } from "react-virtuoso";

import type { Message } from "@/app/types/user-message";
import MessageBubble from "./message-bubble";

const MessageList = memo(function MessageList({
  messages,
}: {
  messages: Message[];
}) {
  return (
    <Virtuoso
      className="h-full"
      data={messages}
      alignToBottom
      followOutput
      computeItemKey={(_, message) => message.id}
      itemContent={(_, message) => (
        <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-3">
              <MessageBubble message={message} />
        </div>
      )}
    />
  );
});

export default MessageList;
