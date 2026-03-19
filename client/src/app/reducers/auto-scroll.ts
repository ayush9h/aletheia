import { useEffect, useRef } from "react";

/** Auto-scroll hook for chat/message timelines.
 *
 * Behavior:
 * - Scrolls to bottom whenever dependency value changes.*/
export function AutoScroll<T extends HTMLElement>(deps: [number]) {
  const containerRef = useRef<T | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, deps);

  return { containerRef, bottomRef };
}
