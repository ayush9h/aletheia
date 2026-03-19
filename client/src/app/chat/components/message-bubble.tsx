/**
 * MessageBubble renders a single chat message with optional reasoning,
 * markdown formatting, copy interaction, and execution telemetry.
 **/

import ReactMarkdown from "react-markdown";
import {
  CopyIcon,
  ClockIcon,
  LightningBoltIcon,
  CheckIcon,
} from "@radix-ui/react-icons";
import { Message } from "@/app/types/userMessage";
import {
  Accordion,
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import remarkGfm from "remark-gfm";
import { memo, useCallback, useState } from "react";

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
    <div>
      {/* Left Alignment : Assistant Message
       * Right Alignment: User Message
       */}
      <div
        className={`font-paragraph flex ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        <div
          className={`rounded-md text-sm  ${
            isUser
              ? "max-w-[60%] bg-blue-500 px-4 py-2 text-white"
              : "w-full   text-stone-800"
          }`}
        >
          {/* Accordion on the basis of reasoning available */}
          {!isUser && message.reasoning && (
            <Accordion
              type="single"
              collapsible
              className="mb-4 flex flex-col rounded-md border border-stone-100 bg-stone-100 p-2"
            >
              <AccordionItem value="reasoning">
                <AccordionTrigger
                  className="
                    data-[state=open]:text-stone-700 py-1 px-0 text-xs
                    text-stone-500
                    hover:no-underline
                  "
                >
                  Show reasoning
                </AccordionTrigger>

                <AccordionContent className="px-0 pb-2 pt-1 text-xs leading-relaxed text-stone-600">
                  {String(message.reasoning)}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          {/* Markdown rendering of the response */}
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {String(message.text)}
          </ReactMarkdown>
        </div>
      </div>

      {/* User actions and metrics for the particular message
       * Copy
       * Tokens consumed
       * Time taken
       */}
      {!isUser && (
        <div className="mt-2.5 flex justify-between gap-2 text-stone-500">
          {/* Copy */}
          <div className="flex gap-2">
            {copied ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <>
                <CopyIcon
                  onClick={handleCopy}
                  className="h-4 w-4 cursor-pointer hover:text-stone-800"
                />
              </>
            )}
          </div>

          {/* Time taken */}
          <div className="font-paragraph flex items-center gap-2 text-xs text-stone-500">
            <div title="Time taken" className="flex items-center gap-1">
              <ClockIcon className="h-3.5 w-3.5" />
              <span>{message.duration}s</span>
            </div>

            {/* Tokens consumed */}
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
