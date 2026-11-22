"use client";

import { Ghost } from "lucide-react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { motion } from "motion/react";

// Window chrome around the ghost panel, so it reads as its own window
export function GhostTitleBar({ onExit }: { onExit: () => void }) {
  return (
    <div className="font-paragraph flex shrink-0 items-center gap-2.5 px-4 py-2.5">
      <Ghost className="size-[18px] shrink-0 text-stone-500 dark:text-stone-400" />

      <p className="text-sm font-medium text-stone-700 dark:text-stone-200">
        Aoratos
      </p>

      <button
        type="button"
        onClick={onExit}
        aria-label="Close ghost chat"
        className="size-8 max-md:after:absolute max-md:after:-inset-1.5 relative ml-auto flex shrink-0 cursor-pointer items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-stone-200 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
      >
        <Cross2Icon className="size-4" />
      </button>
    </div>
  );
}

export function GhostIntro() {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="font-paragraph flex items-center justify-center gap-3 text-3xl text-stone-100"
    >
      <Ghost className="size-8 text-brand-400 shrink-0" />
      You&apos;re aoratos
    </motion.h1>
  );
}

export function GhostNote() {
  return (
    <p className="font-paragraph mt-2 text-center text-[11px] leading-4 text-stone-400 sm:text-xs">
      Gone when you refresh.
    </p>
  );
}
