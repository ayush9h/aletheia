import ReactMarkdown from "react-markdown";
import {
  CopyIcon,
  // ClockIcon,
  // LightningBoltIcon,
  CheckIcon,
} from "@radix-ui/react-icons";
import { Message } from "@/app/types/user-message";
import PlanPanel from "@/app/components/ui/plan-panel";
import remarkGfm from "remark-gfm";
import { memo, useCallback, useState } from "react";
import ThinkingStatus from "@/app/components/ui/randomizer";

const MessageBubble = memo(function MessageBubble({
  message,
}: {
  message: Message;
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(String(message.text));
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  }, [message.text]);

  return (
    <div className="my-2">
      <div
        className={`font-paragraph flex ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`rounded-md text-sm ${
            isUser
              ? "max-w-[60%] break-all max-h-64 whitespace-pre-wrap overflow-y-auto bg-blue-500 px-4 py-2 text-stone-100"
              : "w-full text-stone-800"
          }`}
        >
          {/* Plan panel */}
          {!isUser && message.plan && <PlanPanel plan={message.plan} />}

          {!isUser && message.isStreaming && !message.text && (
            <ThinkingStatus/>
          )}

          {/* Markdown Content */}
          {Boolean(message.text) && (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {String(message.text)}
            </ReactMarkdown>
          )}
        </div>
      </div>

      {/* Show footer controls ONLY after generation completes */}
      {!isUser && !message.isStreaming && message.text && (
        <div className="mt-2.5 flex justify-between gap-2 text-stone-500">
          <div className="flex gap-2">
            {copied ? (
              <CheckIcon className="h-4 w-4 text-green-600" />
            ) : (
              <CopyIcon
                onClick={handleCopy}
                className="h-4 w-4 cursor-pointer hover:text-stone-800"
              />
            )}
          </div>
          <div className="font-paragraph flex items-center gap-2 text-xs text-stone-500">
            {/*<div title="Time taken" className="flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              <span>{message.duration}s</span>
            </div>
            <div title="Tokens consumed" className="flex items-center gap-1">
              <LightningBoltIcon className="h-3.5 w-3.5" />
              <span>{message.tokens_consumed}</span>
            </div>*/}
          </div>
        </div>
      )}
    </div>
  );
});

export default MessageBubble;
