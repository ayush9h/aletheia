import { memo } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";

import MessageBubble from "@/features/chat/components/message-bubble";
import type { Message } from "@/types/user-message";

// Stable references so Virtuoso doesn't remount the footer or re-create item renderers
const COMPONENTS = { Footer: () => <div className="h-[20rem]" /> };
const itemKey = (_: number, message: Message) => message.id;
const renderItem = (_: number, message: Message) => (
  <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-3">
    <MessageBubble message={message} />
  </div>
);

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
      computeItemKey={itemKey}
      components={COMPONENTS}
      itemContent={renderItem}
    />
  );
});

export default MessageList;
