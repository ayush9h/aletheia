"use client";

/**
 * ChatInput renders the primary message composer.
 *
 * Responsibilities:
 * - Controlled multiline input with auto-resize
 * - Submit on Enter (Shift+Enter for newline)
 * - Tool selection
 * - Model selection
 * - Voice input
 * - Responsive mobile layout
 */

import { useMemo } from "react";
import {
  ArrowRightIcon,
  Cross2Icon,
  CaretDownIcon,
} from "@radix-ui/react-icons";
import { Mic, Square } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import Image from "next/image";

import { inputProps } from "@/app/types/chats/chats.type";
import { useSpeechToText } from "@/app/components/voice/speech-text";
import { options } from "@/app/components/input-options";
import InputOptions from "@/app/components/input-options";
import { MODEL_GROUPS } from "@/app/config/models";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import AppTooltip from "@/app/components/ui/app-tooltip";
import { Button } from "@/app/components/ui/button";
import StarterPrompts from "./starterPrompts/starterPrompts";

export default function ChatInput(inputProps: inputProps) {
  const optionList = inputProps.tools;

  const setOptionList = (tools: string[]) =>
    inputProps.dispatch({ type: "SET_TOOLS", payload: tools });

  const currentModel = useMemo(() => {
    return (
      MODEL_GROUPS.flatMap((g) => g.models).find(
        (m) => m.value === inputProps.selectedModel,
      )?.label ?? "Select model"
    );
  }, [inputProps.selectedModel]);

  const {
    isListening,
    isSupported: isSpeechSupported,
    toggle: toggleSpeechRecognition,
    cancel: cancelSpeechRecognition,
  } = useSpeechToText({
    value: inputProps.value,
    onChange: inputProps.onChange,
    language: "en-US",
  });

  const handleSend = () => {
    if (!inputProps.value.trim()) {
      return;
    }

    cancelSpeechRecognition();
    inputProps.onSend();
  };

  return (
    <div className="font-paragraph mx-auto w-full max-w-3xl px-3 sm:px-4 md:px-0">
      <div className="flex flex-col rounded-xl border border-stone-200 bg-white shadow-[0_1px_6px_rgba(0,0,0,0.025)] focus-within:border-blue-500 dark:border-stone-700/50 dark:bg-stone-800/50 dark:shadow-none dark:focus-within:border-blue-500">
        {/* User Input */}
        <TextareaAutosize
          value={inputProps.value}
          onChange={(event) => {
            inputProps.onChange(event.target.value);
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
          className="max-h-[10rem] w-full resize-none overflow-y-auto bg-transparent px-3 py-3 text-sm text-stone-900 outline-none placeholder:text-stone-400 dark:text-stone-100 dark:placeholder:text-stone-500 sm:px-4"
          minRows={1}
          maxRows={6}
          placeholder={isListening ? "Listening…" : "Ask anything"}
          aria-label="Message"
        />

        {/* Bottom toolbar */}
        <div className="flex min-w-0 items-center gap-2 border-t border-stone-200 p-2 dark:border-stone-700/50">
          {/* Tools */}
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="shrink-0">
              <InputOptions
                tools={optionList}
                setTools={setOptionList}
              />
            </div>

            {optionList.map((item) => {
              const tool = options.find((o) => o.key === item);

              return (
                <div
                  key={item}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-blue-100 px-2 py-1 text-xs text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                >
                  <span className="max-w-24 truncate sm:max-w-none">
                    {tool?.toolLabel}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setOptionList(
                        optionList.filter((i) => i !== item),
                      )
                    }
                    className="ml-1 shrink-0 cursor-pointer text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    aria-label={`Remove ${tool?.toolLabel ?? "tool"}`}
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
                    className="font-paragraph flex h-8 max-w-28 shrink-0 items-center gap-1 rounded-lg px-2 text-sm text-stone-600 transition-colors hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 sm:max-w-none sm:px-2.5"
                  >
                    <span className="truncate">{currentModel}</span>

                    <CaretDownIcon className="h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-stone-500" />
                  </button>
                </DropdownMenuTrigger>
              </AppTooltip>

              <DropdownMenuContent
                align="end"
                className="font-paragraph w-56 dark:border-stone-700 dark:bg-stone-900"
              >
                {MODEL_GROUPS.map((group) => (
                  <div key={group.provider}>
                    <DropdownMenuLabel className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
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
                          inputProps.setSelectedModel(model.value);
                        }}
                        className="cursor-pointer pl-8 text-xs dark:text-stone-200 dark:focus:bg-stone-800 dark:focus:text-stone-100"
                      >
                        {model.label}
                      </DropdownMenuItem>
                    ))}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Microphone */}
            {isSpeechSupported && (
              <AppTooltip
                label={
                  isListening
                    ? "Stop voice input"
                    : "Start voice input"
                }
              >
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  aria-label={
                    isListening
                      ? "Stop voice input"
                      : "Start voice input"
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
                    <Square
                      className="h-3.5 w-3.5"
                      fill="currentColor"
                    />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
              </AppTooltip>
            )}

            {/* Send */}
            <AppTooltip label="Send message">
              <Button
                onClick={handleSend}
                disabled={!inputProps.value.trim()}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowRightIcon className="h-4 w-4 text-white" />
              </Button>
            </AppTooltip>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="font-paragraph mt-2 text-center text-[11px] leading-4 text-stone-500 dark:text-stone-400 sm:text-xs">
        <span className="font-header text-sm">Aletheia</span> can make
        mistakes. Check important information.
      </p>

      <StarterPrompts
        show={inputProps.showStarterPrompts ?? false}
        onPromptSelect={(prompt) => {
          inputProps.onChange(prompt);
        }}
      />
    </div>
  );
}
