import { useState, type Dispatch } from "react";

import { DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { deleteUserChatsAll } from "@/app/lib/api/userData";
import type { ChatAction } from "@/app/types/chats/chat-action";
import { Button } from "../ui/button";

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
    <>
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold text-stone-950">
          Data Controls
        </DialogTitle>
      </DialogHeader>

      <div className="mt-8">
        <div className="grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-6">
          <div className="min-w-0 text-left">
            <h3 className="text-sm font-medium text-stone-800">
              Delete all chats
            </h3>

            <p className="mt-1 max-w-lg text-xs leading-5 text-stone-500">
              Permanently delete your entire chat history. This action cannot
              be undone.
            </p>
          </div>

          <Button
            onClick={handleDeleteAll}
            disabled={isDeletingChats}
            className="justify-self-end cursor-pointer whitespace-nowrap rounded-md border border-red-500 bg-red-50 px-4 py-2 text-xs font-medium text-red-500  hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-950/30 dark:hover:bg-red-950/50 transition-all"
          >
            {isDeletingChats ? "Deleting..." : "Delete all"}
          </Button>
        </div>
      </div>
    </>
  );
}
