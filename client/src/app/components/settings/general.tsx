"use client";

import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

export default function GeneralSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const currentTheme = theme === "system" ? resolvedTheme : theme;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DialogHeader className="shrink-0 pb-8">
        <DialogTitle className="text-xl font-semibold tracking-tight text-stone-950 dark:text-stone-100">
          General
        </DialogTitle>

        <DialogDescription className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">
          Manage your application appearance and general preferences.
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-8 pb-6">
          <section>
            <div className="mb-4">
              <h3 className="text-sm font-medium text-stone-900 dark:text-stone-100">
                Appearance
              </h3>

              <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">
                Choose how Aletheia looks.
              </p>
            </div>

            <div className="flex items-center justify-between gap-6 rounded-xl border border-stone-200 px-4 py-3.5 dark:border-stone-700/60">
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                  Theme
                </p>

                <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                  Switch between light and dark mode.
                </p>
              </div>

              <div
                role="group"
                aria-label="Theme"
                className="flex shrink-0 rounded-lg border border-stone-200 bg-white p-1 shadow-sm dark:border-stone-700 dark:bg-stone-900"
              >
                {/* Light */}
                <button
                  type="button"
                  aria-label="Use light theme — Ctrl Shift L"
                  aria-pressed={currentTheme === "light"}
                  onClick={() => setTheme("light")}
                  className={`flex h-9 items-center gap-2 rounded-md px-3 text-xs font-medium transition-all cursor-pointer ${
                    currentTheme === "light"
                      ? "bg-stone-100 text-stone-900 shadow-sm dark:bg-stone-800 dark:text-stone-100"
                      : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                  }`}
                >
                  <SunIcon className="size-3.5 shrink-0" />

                  <span>Light</span>

                  <span className="ml-0.5 flex items-center gap-0.5 text-[10px] font-normal text-stone-400 dark:text-stone-500">
                    <kbd>Ctrl</kbd>
                    <span>⇧</span>
                    <kbd>L</kbd>
                  </span>
                </button>

                {/* Dark */}
                <button
                  type="button"
                  aria-label="Use dark theme — Ctrl Shift D"
                  aria-pressed={currentTheme === "dark"}
                  onClick={() => setTheme("dark")}
                  className={`flex h-9 items-center gap-2 rounded-md px-3 text-xs font-medium transition-all cursor-pointer ${
                    currentTheme === "dark"
                      ? "bg-stone-100 text-stone-900 shadow-sm dark:bg-stone-800 dark:text-stone-100"
                      : "text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
                  }`}
                >
                  <MoonIcon className="size-3.5 shrink-0" />

                  <span>Dark</span>

                  <span className="ml-0.5 flex items-center gap-0.5 text-[10px] font-normal text-stone-400 dark:text-stone-500">
                    <kbd>Ctrl</kbd>
                    <span>⇧</span>
                    <kbd>D</kbd>
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
