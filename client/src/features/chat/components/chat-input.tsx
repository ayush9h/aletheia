"use client";

// ChatInput renders the primary message composer

import { Fragment, useMemo, useRef } from "react";
import {
  ArrowRightIcon,
  Cross2Icon,
  CaretDownIcon,
} from "@radix-ui/react-icons";
import { Check, Mic, Square } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import Image from "next/image";

import type { inputProps as ChatInputProps } from "@/features/chat/types/chats.types";
import { useSpeechToText } from "@/features/voice/hooks/useSpeechToText";
import InputOptions, { options } from "@/features/chat/components/input-options";
import { MODEL_GROUPS } from "@/features/chat/config/models";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppTooltip from "@/components/ui/app-tooltip";
import { cn, getMonthlyResetDate } from "@/lib/utils";
import { MENU_CONTENT, MENU_ITEM, MENU_LABEL, MENU_SEPARATOR } from "@/lib/menu";
import { Button } from "@/components/ui/button";
import StarterPrompts from "@/features/chat/components/starter-prompts";

export default function ChatInput(props: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const optionList = props.tools;

  const setOptionList = (tools: string[]) => {
    props.dispatch({
      type: "SET_TOOLS",
      payload: tools,
    });
  };

  const currentModel = useMemo(() => {
    return (
      MODEL_GROUPS.flatMap((group) => group.models).find(
        (model) => model.value === props.selectedModel
      )?.label ?? "Select model"
    );
  }, [props.selectedModel]);

  const {
    isListening,
    isSupported: isSpeechSupported,
    toggle: toggleSpeechRecognition,
    cancel: cancelSpeechRecognition,
  } = useSpeechToText({
    value: props.value,
    onChange: props.onChange,
    language: "en-US",
  });

  const usage = props.usage;
  const usageRatio = usage ? usage.tokens_used / usage.token_limit : 0;
  const capReached = usageRatio >= 1;
  const showUsageWarning = !!usage && usageRatio >= 0.8;
  const resetDate = getMonthlyResetDate().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  const handleSend = () => {
    if (!props.value.trim() || capReached) {
      return;
    }

    cancelSpeechRecognition();
    props.onSend();
  };

  const handleFilesSelected = (files: File[]) => {
    if (!files.length) {
      return;
    }

    props.onFilesSelected?.(files);
  };

  return (
    <div className="font-paragraph mx-auto w-full max-w-3xl px-3 sm:px-4 md:px-0">
      {/* Monthly token usage warning */}
      {showUsageWarning && (
        <div
          role="status"
          className={[
            "mx-6 rounded-t-lg border border-b-0 px-4 py-1.5 text-center text-xs sm:mx-10",
            capReached
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
              : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400",
          ].join(" ")}
        >
          {capReached
            ? `You've reached your monthly limit of ${usage.token_limit.toLocaleString()} tokens. It resets on ${resetDate}.`
            : `You've used ${Math.floor(usageRatio * 100)}% of your monthly tokens (${usage.tokens_used.toLocaleString()} / ${usage.token_limit.toLocaleString()}).`}
        </div>
      )}

      <div className="flex flex-col rounded-2xl border border-stone-200/80 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-colors focus-within:border-stone-300 dark:border-stone-700/50 dark:bg-stone-800/50 dark:shadow-none dark:focus-within:border-stone-600">
        {/* User Input */}
        <TextareaAutosize
          value={props.value}
          onChange={(event) => {
            props.onChange(event.target.value);
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              handleSend();
            }
          }}
          className="w-full resize-none overflow-y-auto bg-transparent px-3 pb-1 pt-3.5 text-sm text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-500 sm:px-4"
          minRows={1}
          maxRows={6}
          placeholder={isListening ? "Listening…" : "Ask anything"}
          aria-label="Message"
        />

        {/* Bottom toolbar */}
        <div className="flex min-w-0 items-center gap-2 px-2 pb-2 pt-1">
          {/* Tools */}
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="shrink-0">
              <InputOptions
                tools={optionList}
                setTools={setOptionList}
                onAddFileClick={() => fileInputRef.current?.click()}
              />
            </div>

            {optionList.map((item) => {
              const tool = options.find((option) => option.key === item);

              if (!tool) {
                return null;
              }

              return (
                <div
                  key={item}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-brand-100 px-2 py-1 text-xs text-brand-600 dark:bg-brand-950/50 dark:text-brand-400"
                >
                  <span className="max-w-24 truncate sm:max-w-none">
                    {tool.toolLabel}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setOptionList(
                        optionList.filter((toolKey) => toolKey !== item),
                      )
                    }
                    className="ml-1 shrink-0 cursor-pointer text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
                    aria-label={`Remove ${tool.toolLabel}`}
                  >
                    <Cross2Icon className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Fixed controls */}
          <div className="flex shrink-0 items-center gap-1">
            {/* Model selector */}
            <DropdownMenu>
              <AppTooltip label="Choose model">
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="font-paragraph max-w-28 flex h-8 shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 text-sm text-stone-600 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 sm:max-w-none sm:px-2.5"
                  >
                    <span className="truncate">{currentModel}</span>

                    <CaretDownIcon className="h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-stone-500" />
                  </button>
                </DropdownMenuTrigger>
              </AppTooltip>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className={`${MENU_CONTENT} w-60`}
              >
                {MODEL_GROUPS.map((group, index) => (
                  <Fragment key={group.provider}>
                    {index > 0 && (
                      <DropdownMenuSeparator className={MENU_SEPARATOR} />
                    )}

                    <DropdownMenuLabel className={MENU_LABEL}>
                      <Image
                        src={group.url}
                        alt=""
                        width={12}
                        height={12}
                        className="h-3 w-3"
                      />

                      {group.provider}
                    </DropdownMenuLabel>

                    {group.models.map((model) => (
                      <DropdownMenuItem
                        key={model.value}
                        onSelect={() => {
                          props.setSelectedModel(model.value);
                        }}
                        // Indent so model names sit under the provider name, not its logo
                        className={cn(MENU_ITEM, "pl-[1.875rem]")}
                      >
                        <span className="flex-1">{model.label}</span>

                        {props.selectedModel === model.value && (
                          <Check
                            aria-hidden="true"
                            className="size-4 text-brand-600 dark:text-brand-400"
                          />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Microphone */}
            {isSpeechSupported && (
              <AppTooltip
                label={isListening ? "Stop voice input" : "Start voice input"}
              >
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  aria-label={
                    isListening ? "Stop voice input" : "Start voice input"
                  }
                  aria-pressed={isListening}
                  className={[
                    "flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors",
                    isListening
                      ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-950/70"
                      : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800",
                  ].join(" ")}
                >
                  {isListening ? (
                    <Square className="h-3.5 w-3.5" fill="currentColor" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
              </AppTooltip>
            )}

            {/* Send */}
            <AppTooltip label="Send message">
              <Button
                type="button"
                onClick={handleSend}
                disabled={!props.value.trim() || capReached}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-brand-600 hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <ArrowRightIcon className="h-4 w-4 text-white" />
              </Button>
            </AppTooltip>
          </div>
        </div>
      </div>

      {/* Hidden file input (triggered from the "Add file" menu item) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);

          handleFilesSelected(files);

          // Allows selecting the same file again later.
          event.target.value = "";
        }}
      />

      {/* Disclaimer */}
      <p className="font-paragraph mt-2 text-center text-[11px] leading-4 text-stone-500 dark:text-stone-400 sm:text-xs">
        Aletheia can make mistakes. Check important information.
      </p>

      <StarterPrompts
        show={props.showStarterPrompts ?? false}
        onPromptSelect={(prompt) => {
          props.onChange(prompt);
        }}
      />
    </div>
  );
}
