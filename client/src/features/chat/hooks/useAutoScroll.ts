import { useEffect, useRef } from "react";
import type { VirtuosoHandle } from "react-virtuoso";

export function useAutoScroll(messageCount: number) {
  const bottomRef = useRef<VirtuosoHandle>(null);

  useEffect(() => {
    if (messageCount === 0) return;

    bottomRef.current?.scrollToIndex({
      index: messageCount - 1,
      align: "end",
      behavior: "smooth",
    });
  }, [messageCount]);

  return { bottomRef };
}
