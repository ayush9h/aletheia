"use client";

import { useState, type Dispatch } from "react";

import { deleteUserChatsAll } from "@/lib/api/user-data";
import type { ChatAction } from "@/features/chat/types/chat-action";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LEGAL_LINKS } from "@/features/legal/constants/legal-links";
import {
  SettingRow,
  SettingSection,
  SettingsHeader,
} from "@/features/settings/components/settings-layout";

import { ConsentDialogLink } from "c15t/next";
type DataControlsProps = {
  userId: string;
  dispatch: Dispatch<ChatAction>;
};

const ROW_BUTTON =
  "h-9 w-fit shrink-0 cursor-pointer whitespace-nowrap rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";

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
    <div className="flex h-full min-h-0 flex-col">
      <SettingsHeader
        title="Data Controls"
        description="Manage your chat history, privacy choices and legal information."
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <SettingSection title="Privacy">
          <SettingRow
            title="Privacy settings"
            description="Change privacy options for personalized content, or opt out of it."
          >
            <ConsentDialogLink asChild>
              <button
                type="button"
                className={`${ROW_BUTTON} border border-stone-200 text-stone-700 hover:bg-stone-50 dark:border-stone-700/60 dark:text-stone-200 dark:hover:bg-stone-800`}
              >
                Modify
              </button>
            </ConsentDialogLink>
          </SettingRow>

          <SettingRow
            title="Legal"
            description="How we handle your data and the terms of using Aletheia."
          >
            <div className="flex shrink-0 flex-col gap-1 text-sm sm:items-end">
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
          </SettingRow>
        </SettingSection>

        <SettingSection title="Danger zone">
          <SettingRow
            title="Delete all chats"
            description="Permanently delete your entire chat history. This action cannot be undone."
          >
            <Button
              onClick={handleDeleteAll}
              disabled={isDeletingChats}
              className={`${ROW_BUTTON} border border-red-200 bg-white text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/40`}
            >
              {isDeletingChats ? "Deleting..." : "Delete all"}
            </Button>
          </SettingRow>
        </SettingSection>
      </div>
    </div>
  );
}
