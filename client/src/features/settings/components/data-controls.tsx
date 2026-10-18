"use client";

import { useState, type Dispatch } from "react";

import {
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteUserChatsAll } from "@/lib/api/user-data";
import type { ChatAction } from "@/features/chat/types/chat-action";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LEGAL_LINKS } from "@/features/legal/constants/legal-links";

import { ConsentDialogLink } from "c15t/next";
type DataControlsProps = {
  userId: string;
  dispatch: Dispatch<ChatAction>;
};

export default function DataControls({
  userId,
  dispatch,
}: DataControlsProps) {
  const [isDeletingChats, setIsDeletingChats] = useState(false);

  const handleDeleteAll = async () => {
    if (isDeletingChats) return;

    setIsDeletingChats(true);

    try {
      await deleteUserChatsAll(userId);

      dispatch({ type: "SET_SESSIONS", payload: [] });
      dispatch({ type: "SET_MESSAGES", payload: [] });
      dispatch({ type: "SET_SELECTED_SESSION", payload: null });
    } catch (error) {
      console.error("Failed to delete all chats:", error);
    } finally {
      setIsDeletingChats(false);
    }
  };

  return (
    <div className="h-full">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold text-stone-950 dark:text-stone-100">
          Data Controls
        </DialogTitle>
      </DialogHeader>

      <div className="mt-8">
        <div className="flex flex-col gap-5 sm:grid sm:grid-cols-[minmax(0,1fr)_8rem] sm:items-center sm:gap-6">
          <div className="min-w-0 text-left">
            <h3 className="text-sm font-medium text-stone-800 dark:text-stone-200">
              Delete all chats
            </h3>
            <p className="mt-1 max-w-lg text-xs leading-5 text-stone-500 dark:text-stone-400">
              Permanently delete your entire chat history. This action cannot be undone.
            </p>
          </div>

          <Button
            onClick={handleDeleteAll}
            disabled={isDeletingChats}
            className="w-fit cursor-pointer whitespace-nowrap rounded-md border border-red-500 bg-red-50 px-4 py-2 text-xs font-medium text-red-500 transition-all hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 sm:justify-self-end"
          >
            {isDeletingChats ? "Deleting..." : "Delete all"}
          </Button>


          <div className="min-w-0 text-left">
            <h3 className="text-sm font-medium text-stone-800 dark:text-stone-200">
              Change Privacy settings
            </h3>
            <p className="mt-1 max-w-lg text-xs leading-5 text-stone-500 dark:text-stone-400">
              Change privacy options for personalized content, or opt-out of it.
            </p>
          </div>

          <ConsentDialogLink>
            <p className="w-fit cursor-pointer whitespace-nowrap rounded-md px-4 py-2 text-xs bg-stone-100 hover:bg-stone-200 dark:border-stone-900 dark:bg-stone-950/30 dark:stone-red-400 dark:hover:bg-stone-950/50 sm:justify-self-end">
              Modify
            </p></ConsentDialogLink>

          <div className="min-w-0 text-left">
            <h3 className="text-sm font-medium text-stone-800 dark:text-stone-200">
              Legal
            </h3>
            <p className="mt-1 max-w-lg text-xs leading-5 text-stone-500 dark:text-stone-400">
              How we handle your data and the terms of using Aletheia.
            </p>
          </div>

          <div className="flex flex-col gap-1 text-xs sm:items-end">
            {LEGAL_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                target="_blank"
                className="whitespace-nowrap text-brand-600 underline decoration-current/40 underline-offset-2 hover:decoration-current dark:text-brand-400"
              >
                {label}
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
