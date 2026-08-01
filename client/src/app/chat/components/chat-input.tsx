"use client";
/**
 * ChatInput renders the primary message composer.
 *
 * Responsibilities:
 * - Controlled multiline input with auto-resize
 * - Submit on Enter (Shift+Enter for newline)
 * - Expose send + future attachment entry points
 */

import { ArrowRightIcon, Cross2Icon } from "@radix-ui/react-icons";
import { Mic, Square } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { inputProps } from "@/app/types/chats/chats.type";
import { useSpeechToText } from "@/app/components/voice/speech-text";
import { options } from "@/app/components/input-options";
import InputOptions from "@/app/components/input-options";
import { useMemo } from "react";
import { MODEL_GROUPS } from "@/app/config/models";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import AppTooltip from "@/app/components/ui/app-tooltip";
import { CaretDownIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";

export default function ChatInput(inputProps: inputProps) {
  const optionList = inputProps.tools;

  const setOptionList = (tools: string[]) =>
    inputProps.dispatch({ type: "SET_TOOLS", payload: tools });

  const currentModel = useMemo(() => {
    return (
      MODEL_GROUPS.flatMap((g) => g.models).find(
        (m) => m.value === inputProps.selectedModel
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
    <div className="font-paragraph mx-auto w-full max-w-3xl">
      <div className="flex flex-col rounded-xl border">
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
          className="max-h-[10rem] w-full resize-none overflow-y-auto bg-transparent p-3 text-sm outline-none"
          minRows={1}
          maxRows={6}
          placeholder={isListening ? "Listening…" : "Ask anything"}
          aria-label="Message"
        />
        <div className="flex items-center justify-between border-t p-2">
          {/* Options Button */}
          <div className="flex items-center gap-3">
            <div>
              <InputOptions tools={optionList} setTools={setOptionList} />
            </div>

            {/* Show the tool label from the tools key */}
            {optionList.map((item) => {
              const tool = options.find((o) => o.key === item);

              return (
                <div
                  key={item}
                  className="flex items-center gap-1 rounded-lg bg-blue-200 px-2 py-1 text-xs  text-blue-600"
                >
                  <span>{tool?.toolLabel}</span>

                  <button
                    onClick={() =>
                      setOptionList(optionList.filter((i) => i !== item))
                    }
                    className="ml-1 cursor-pointer hover:text-blue-800"
                  >
                    <Cross2Icon className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Model selector + Send, grouped so the selector sits right before send */}
          <div className="ml-3 flex shrink-0 items-center gap-1">
            {/* Model selector */}
            <DropdownMenu>
              <AppTooltip label="Choose model">
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="font-paragraph flex h-8 items-center gap-1 rounded-lg px-2.5 text-sm text-stone-600 transition-colors hover:bg-stone-100"
                  >
                    {currentModel}

                    <CaretDownIcon className="h-3.5 w-3.5 text-stone-400" />
                  </button>
                </DropdownMenuTrigger>
              </AppTooltip>

              <DropdownMenuContent align="end" className="font-paragraph w-56">
                {MODEL_GROUPS.map((group) => (
                  <div key={group.provider}>
                    <DropdownMenuLabel className="flex items-center gap-2 text-xs text-stone-500">
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
                        className="cursor-pointer pl-8 text-xs"
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
                    "flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors",
                    isListening
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "text-stone-600 hover:bg-stone-100",
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
                onClick={handleSend}
                disabled={!inputProps.value.trim()}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-blue-600  hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowRightIcon className="h-4 w-4 text-white" />
              </Button>
            </AppTooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
