"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Session } from "@/types/user-message";

type DeleteSessionDialogProps = {
  session: Session | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (sessionId: number) => void | Promise<void>;
};

// Confirms a chat deletion before calling the API
export function DeleteSessionDialog({ session, onOpenChange, onConfirm }: DeleteSessionDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!session || isDeleting) return;

    setIsDeleting(true);
    try {
      await onConfirm(session.session_id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={session !== null} onOpenChange={(open) => !isDeleting && onOpenChange(open)}>
      <DialogContent
        showCloseButton={false}
        className="font-paragraph max-w-sm dark:border-stone-700 dark:bg-stone-900"
      >
        <DialogHeader>
          <DialogTitle className="text-stone-950 dark:text-stone-100">Delete chat?</DialogTitle>
          <DialogDescription className="text-stone-500 dark:text-stone-400">
            This will permanently delete{" "}
            <span className="font-medium text-stone-800 dark:text-stone-200">
              {session?.session_title || "New Chat"}
            </span>
            . This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              disabled={isDeleting}
              className="cursor-pointer dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="cursor-pointer"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
