import { memo, useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  CheckIcon,
  ClockIcon,
  CopyIcon,
  LightningBoltIcon,
  SpeakerLoudIcon,
  StopIcon
} from "@radix-ui/react-icons";
import { useReadAloud } from "@/app/components/read-aloud";

import type { Message } from "@/app/types/user-message";
import PlanPanel from "@/app/components/ui/plan-panel";
import ThinkingStatus from "@/app/components/ui/randomizer";

const MessageBubble = memo(function MessageBubble({
  message,
}: {
  message: Message;
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const text = String(message.text ?? "");

  const { isReading, isSupported, toggle: handleReadAloud } =
    useReadAloud(text);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1000);
    } catch (error) {
      console.error("Copy failed", error);
    }
  }, [text]);

  return (
    <div>
      <div
        className={`font-paragraph flex ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`rounded-md text-sm ${
            isUser
              ? "max-h-64 max-w-[60%] overflow-y-auto whitespace-pre-wrap break-words bg-blue-500 px-4 py-2 text-stone-100"
              : "w-full text-stone-800"
          }`}
        >
          {!isUser && message.plan && <PlanPanel plan={message.plan} />}

          {!isUser && message.isStreaming && !message.text && (
            <div className="flex min-h-8 items-center py-1">
              <ThinkingStatus />
            </div>
          )}

          {Boolean(message.text) && (
            <div className="leading-6 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>p]:my-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {String(message.text)}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {!isUser && !message.isStreaming && Boolean(message.text) && (
        <div className="mt-1 gap-1 flex items-center justify-between text-stone-500">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy response"}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md hover:bg-stone-100 hover:text-stone-800"
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 text-green-600" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={handleReadAloud}
              disabled={!isSupported}
              aria-label={isReading ? "Stop reading" : "Read aloud"}
              title={isReading ? "Stop reading" : "Read aloud"}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isReading ? (
                <StopIcon className="h-4 w-4" />
              ) : (
                <SpeakerLoudIcon className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="font-paragraph flex items-center gap-3 text-xs">
            <div title="Time taken" className="flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              <span>{message.duration}s</span>
            </div>

            <div title="Tokens consumed" className="flex items-center gap-1">
              <LightningBoltIcon className="h-3.5 w-3.5" />
              <span>{message.tokens_consumed}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default MessageBubble;
