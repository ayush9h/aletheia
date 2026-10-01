"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

export default function GeneralSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DialogHeader className="shrink-0 pb-5">
        <DialogTitle className="text-xl font-semibold text-stone-950 dark:text-stone-100">
          General
        </DialogTitle>

        <DialogDescription className="text-stone-500 dark:text-stone-400">
          Manage your application appearance and general preferences.
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto pr-3">
        <div className="space-y-6 pb-6">
          <div className="flex items-center justify-between gap-6">
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-stone-800 dark:text-stone-200">
                Theme
              </h3>

              <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">
                Choose how Aletheia looks.
              </p>
            </div>

            <div
              role="group"
              aria-label="Theme"
              className="flex shrink-0 rounded-lg border border-stone-300 bg-stone-50 p-1 dark:border-stone-700 dark:bg-stone-900"
            >
              <button
                type="button"
                aria-label="Use light theme"
                aria-pressed={currentTheme === "light"}
                onClick={() => setTheme("light")}
                className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors ${currentTheme === "light" ? "bg-white text-stone-900 shadow-sm dark:bg-stone-800 dark:text-stone-100" : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"}`}
              >
                <SunIcon className="size-3.5" />
                Light
              </button>

              <button
                type="button"
                aria-label="Use dark theme"
                aria-pressed={currentTheme === "dark"}
                onClick={() => setTheme("dark")}
                className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors ${currentTheme === "dark" ? "bg-white text-stone-900 shadow-sm dark:bg-stone-800 dark:text-stone-100" : "text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"}`}
              >
                <MoonIcon className="size-3.5" />
                Dark
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
