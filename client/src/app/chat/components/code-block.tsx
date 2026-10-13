"use client";

import { memo, useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { codeToHtml } from "shiki";

interface CodeBlockProps {
  code: string;
  language?: string;
}

const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  md: "markdown",
  py: "python",
  rb: "ruby",
  cs: "csharp",
  "c++": "cpp",
  rs: "rust",
  golang: "go",
};

function normalizeLanguage(language?: string) {
  if (!language) return "text";

  const normalized = language.toLowerCase().trim();

  return LANGUAGE_ALIASES[normalized] ?? normalized;
}

const CodeBlock = memo(function CodeBlock({ code, language }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const normalizedLanguage = normalizeLanguage(language);

  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      try {
        const result = await codeToHtml(code, {
          lang: normalizedLanguage,
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
          defaultColor: false,
        });

        if (!cancelled) {
          setHtml(result);
        }
      } catch (error) {
        console.error("Shiki highlighting failed:", error);

        if (!cancelled) {
          setHtml(null);
        }
      }
    }

    void highlight();

    return () => {
      cancelled = true;
    };
  }, [code, normalizedLanguage]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  };

  return (
    <div className="my-4 min-w-0 overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800">
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b border-stone-200 bg-stone-100 px-3 dark:border-stone-800 dark:bg-stone-900">
        <span className="font-mono text-xs text-stone-500 dark:text-stone-400">
          {language || "code"}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-stone-500 transition-colors hover:bg-stone-200 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
        >
          {copied ? (
            <>
              <CheckIcon className="h-3.5 w-3.5 text-green-500" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <CopyIcon className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Shiki */}
      <div className="code-scroll overflow-x-auto">
        {html ? (
          <div
            className="shiki-wrapper"
            dangerouslySetInnerHTML={{
              __html: html,
            }}
          />
        ) : (
          <pre className="m-0 overflow-x-auto p-4 font-mono text-sm leading-6">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
});

export default CodeBlock;
