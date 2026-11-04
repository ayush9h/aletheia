import { memo } from "react";
import { Virtuoso, type VirtuosoHandle } from "react-virtuoso";

import MessageBubble from "@/features/chat/components/message-bubble";
import type { Message } from "@/types/user-message";

type ListContext = { onRetry?: (prompt: string) => void };

// Stable references so Virtuoso doesn't remount the footer or re-create item renderers
const COMPONENTS = { Footer: () => <div className="h-[20rem]" /> };
const itemKey = (_: number, message: Message) => message.id;
const renderItem = (_: number, message: Message, context: ListContext) => (
  <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-3">
    <MessageBubble message={message} onRetry={context.onRetry} />
  </div>
);
// Keep a streaming answer in view, unless the reader scrolled up
const followOutput = (atBottom: boolean) => (atBottom ? "auto" : false);

const MessageList = memo(function MessageList({
  messages,
  bottomRef,
  onRetry,
}: {
  messages: Message[];
  bottomRef: React.RefObject<VirtuosoHandle | null>;
  onRetry?: (prompt: string) => void;
}) {
  return (
    <Virtuoso
      ref={bottomRef}
      className="h-full"
      data={messages}
      context={{ onRetry }}
      computeItemKey={itemKey}
      components={COMPONENTS}
      itemContent={renderItem}
      followOutput={followOutput}
    />
  );
});

export default MessageList;
