import { memo, useCallback, useLayoutEffect, useRef, useState, type ComponentProps } from "react";
import ReactMarkdown, { type Components, type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  CheckIcon,
  ClockIcon,
  CopyIcon,
  LightningBoltIcon,
  SpeakerLoudIcon,
  StopIcon,
} from "@radix-ui/react-icons";

import ChartBlock, { parseChartSpec } from "@/features/chat/components/chart-block";
import CodeBlock from "@/features/chat/components/code-block";
import PlanPanel from "@/features/chat/components/plan-panel";
import ThinkingStatus from "@/features/chat/components/thinking-status";
import { useReadAloud } from "@/features/voice/hooks/useReadAloud";
import type { Message } from "@/types/user-message";

// Module-level so markdown config isn't recreated on every streamed chunk
const REMARK_PLUGINS = [remarkGfm];

function MarkdownCode({ className, children, ...props }: ComponentProps<"code"> & ExtraProps) {
  if (!className) {
    return (
      <code
        className="font-paragraph rounded bg-stone-200 px-1.5 py-0.5 text-[0.9em] text-stone-800 dark:bg-stone-800 dark:text-stone-200"
        {...props}
      >
        {children}
      </code>
    );
  }
  const language = /language-([\w-]+)/.exec(className)?.[1];
  const code = String(children).replace(/\n$/, "");
  if (language === "chart") {
    const chart = parseChartSpec(code);
    if (chart) return <ChartBlock spec={chart} />;
    // Shiki lacks chart grammar
    return <CodeBlock code={code} language="json" />;
  }
  if (language === "markdown" || language === "md") {
    return (
      <div className="my-2 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>p]:my-2">
        <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={MARKDOWN_COMPONENTS}>
          {code}
        </ReactMarkdown>
      </div>
    );
  }
  return <CodeBlock code={code} language={language} />;
}

const MARKDOWN_COMPONENTS: Components = {
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all text-brand-600 underline decoration-current/40 underline-offset-2 transition-colors hover:decoration-current dark:text-brand-400"
    >
      {children}
    </a>
  ),
  code: MarkdownCode,
  pre: ({ children }) => <>{children}</>,
  table: ({ children }) => (
    <div className="my-3 w-full overflow-x-auto">
      <table className="min-w-[800px] border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-stone-300 dark:border-stone-700">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="whitespace-nowrap px-3 py-2 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="px-3 py-2 align-top">{children}</td>,
  tr: ({ children }) => (
    <tr className="border-b border-stone-200 last:border-b-0 dark:border-stone-700/50">{children}</tr>
  ),
};

// Placeholder for partial charts
const STREAMING_COMPONENTS: Components = {
  ...MARKDOWN_COMPONENTS,
  code(props) {
    if (/language-chart\b/.test(props.className ?? "") && !parseChartSpec(String(props.children))) {
      return (
        <span className="my-4 flex h-72 items-center justify-center rounded-lg border border-stone-200 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
          Rendering chart…
        </span>
      );
    }
    return <MarkdownCode {...props} />;
  },
};

const ACTION_BUTTON =
  "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-200";

const MessageBubble = memo(function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const text = String(message.text ?? "");
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  // Measure while collapsed
  useLayoutEffect(() => {
    const el = contentRef.current;
    if (isUser && el && !expanded) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [isUser, text, expanded]);

  const { isReading, isSupported, toggle: handleReadAloud } = useReadAloud(text);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1000);
    } catch (error) {
      console.error("Copy failed", error);
    }
  }, [text]);

  return (
    <div>
      <div className={`font-paragraph flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`rounded-md text-sm ${isUser ? "max-w-[60%] whitespace-pre-wrap break-words bg-brand-500 px-4 py-2 text-stone-100 [&_a]:text-white" : "w-full min-w-0 overflow-hidden text-stone-800 dark:text-stone-200"}`}
        >
          {!isUser && message.plan && <PlanPanel plan={message.plan} />}

          {!isUser && message.isStreaming && !message.text && (
            <div className="flex min-h-8 items-center py-1">
              <ThinkingStatus />
            </div>
          )}

          {Boolean(message.text) && (
            <div
              ref={contentRef}
              className={`relative min-w-0 max-w-full break-words leading-6 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&>p]:my-2 [&_pre]:max-w-full [&_pre]:overflow-x-auto ${isUser && !expanded ? "max-h-64 overflow-hidden" : ""}`}
            >
              <ReactMarkdown
                remarkPlugins={REMARK_PLUGINS}
                components={message.isStreaming ? STREAMING_COMPONENTS : MARKDOWN_COMPONENTS}
              >
                {text}
              </ReactMarkdown>
              {/* Hints hidden content */}
              {overflows && !expanded && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-brand-500" />
              )}
            </div>
          )}

          {overflows && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              className="mt-1 cursor-pointer text-xs font-medium text-white/80 underline-offset-2 hover:text-white hover:underline"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      </div>

      {!isUser && !message.isStreaming && Boolean(message.text) && (
        <div className="mt-1 flex items-center justify-between gap-1 text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopy}
              aria-label={copied ? "Copied" : "Copy response"}
              className={ACTION_BUTTON}
            >
              {copied ? (
                <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
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
              className={`${ACTION_BUTTON} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {isReading ? <StopIcon className="h-4 w-4" /> : <SpeakerLoudIcon className="h-4 w-4" />}
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
