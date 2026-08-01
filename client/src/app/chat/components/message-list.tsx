import { memo } from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";

import type { Message } from "@/app/types/user-message";
import MessageBubble from "./message-bubble";

const MessageList = memo(function MessageList({
  messages,
  bottomRef,
}: {
  messages: Message[];
  bottomRef: React.RefObject<VirtuosoHandle | null>;
}) {
  return (
    <Virtuoso
      ref={bottomRef}
      className="h-full"
      data={messages}
      computeItemKey={(_, message) => message.id}
      components={{ Footer: () => <div className="h-[20rem]" /> }}
      itemContent={(_, message) => (
        <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-3">
          <MessageBubble message={message} />
        </div>
      )}
    />
  );
});

export default MessageList;
