/**
 * ChatInput renders the primary message composer.
 *
 * Responsibilities:
 * - Controlled multiline input with auto-resize
 * - Submit on Enter (Shift+Enter for newline)
 * - Expose send + future attachment entry points
 */

import { ArrowUpIcon, PlusIcon } from "@radix-ui/react-icons";
import TextareaAutosize from "react-textarea-autosize";
import { inputProps } from "@/app/types/chats/chats.type";

export default function ChatInput(inputProps: inputProps) {
  return (
    <div className="font-paragraph mx-auto w-full max-w-3xl rounded-2xl pb-2">
      <div className="flex flex-col gap-2 rounded-2xl border p-3">
        {/* User Input */}
        <TextareaAutosize
          value={inputProps.value}
          onChange={(e) => inputProps.onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              inputProps.onSend();
            }
          }}
          className="max-h-[10rem] w-full resize-none overflow-y-auto bg-transparent text-sm outline-none"
          minRows={1}
          maxRows={6}
          placeholder="Ask anything"
        />
        <div className="flex items-center justify-between">
          {/* Options Button - TODO */}
          <PlusIcon className="h-4 w-4 cursor-not-allowed" />

          {/* Send */}
          <button
            onClick={() => inputProps.onSend()}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700"
          >
            <ArrowUpIcon className="h-4 w-4 text-stone-100" />
          </button>
        </div>
      </div>

      {/* Product disclaimer */}

      <p className="font-paragraph mt-2 text-center text-xs text-stone-500">
        Aletheia is currently being developed. Some features may not be
        functional. It can make mistakes. Check important info.
      </p>
    </div>
  );
}
