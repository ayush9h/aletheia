"use client";

import { useEffect, useState } from "react";

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

import { Button } from "@/app/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

import type { UserPrefProps } from "@/app/types/user-pref";
import type { PersonalizedSettingProps } from "@/app/types/settings/preferences.type";

export default function PersonalizationSettings({
  userPref,
  handleSave,
  onOpenChange,
}: PersonalizedSettingProps) {
  const [draft, setDraft] = useState<UserPrefProps>(userPref);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(userPref);
  }, [userPref]);

  const update = <K extends keyof UserPrefProps>(
    key: K,
    value: UserPrefProps[K],
  ) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = async () => {
    if (isSaving) return;

    setIsSaving(true);

    try {
      await handleSave(draft);
    } catch (error) {
      console.error("Failed to save user preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto pr-2 sm:pr-3">
      <DialogHeader className="shrink-0 pb-5">
        <DialogTitle className="text-xl font-semibold text-stone-950 dark:text-stone-100">
          Personalization
        </DialogTitle>

        <DialogDescription className="text-stone-500 dark:text-stone-400">
          Customize how Aletheia responds to you.
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto pr-2 sm:pr-3">
        <div className="space-y-6 pb-8">
          {/* Base style */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-stone-800 dark:text-stone-200">
                Base style and tone
              </h3>

              <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">
                This controls response personality, not capability.
              </p>
            </div>

            <Select
              value={draft.baseTone}
              onValueChange={(value) => update("baseTone", value)}
            >
              <SelectTrigger className="w-full shrink-0 border-stone-300 text-stone-700 dark:border-stone-700/50 dark:bg-stone-900 dark:text-stone-200 sm:w-40">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>

              <SelectContent className="font-paragraph dark:border-stone-700/50 dark:bg-stone-900">
                <SelectItem value="Efficient">Efficient</SelectItem>
                <SelectItem value="Balanced">Balanced</SelectItem>
                <SelectItem value="Creative">Creative</SelectItem>
                <SelectItem value="Technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Memory */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-stone-800 dark:text-stone-200">
                Memory storage
              </h3>

              <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">
                Allow Aletheia to remember useful details and personalize
                future conversations.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={draft.memoryEnabled}
              aria-label="Toggle memory storage"
              onClick={() => update("memoryEnabled", !draft.memoryEnabled)}
              className={`relative h-6 w-11 shrink-0 cursor-pointer self-start rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-stone-950 sm:self-center ${draft.memoryEnabled ? "bg-blue-500" : "bg-stone-300 dark:bg-stone-700"}`}
            >
              <span
                aria-hidden="true"
                className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${draft.memoryEnabled ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          {/* Custom instructions */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-stone-700 dark:text-stone-300">
              Custom instructions
            </h3>

            <textarea
              rows={4}
              value={draft.userCustomInstruction}
              placeholder="Additional behavior, style, or tone preferences"
              onChange={(event) =>
                update("userCustomInstruction", event.target.value)
              }
              className="w-full resize-none rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-stone-500 dark:border-stone-700/50 dark:bg-stone-900 dark:text-stone-200 dark:placeholder:text-stone-500 dark:focus:border-stone-500"
            />
          </div>

          {/* About you */}
          <div className="space-y-4">
            <h3 className="font-semibold text-stone-900 dark:text-stone-100">
              About you
            </h3>

            <div className="space-y-2">
              <h3 className="text-xs font-medium text-stone-700 dark:text-stone-300">
                Nickname
              </h3>

              <input
                value={draft.nickname}
                placeholder="What should Aletheia call you?"
                onChange={(event) => update("nickname", event.target.value)}
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-stone-500 dark:border-stone-700/50 dark:bg-stone-900 dark:text-stone-200 dark:placeholder:text-stone-500 dark:focus:border-stone-500"
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-medium text-stone-700 dark:text-stone-300">
                Occupation
              </h3>

              <input
                value={draft.occupation}
                placeholder="Your profession or role"
                onChange={(event) => update("occupation", event.target.value)}
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-stone-500 dark:border-stone-700/50 dark:bg-stone-900 dark:text-stone-200 dark:placeholder:text-stone-500 dark:focus:border-stone-500"
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-medium text-stone-700 dark:text-stone-300">
                More about you
              </h3>

              <textarea
                rows={3}
                value={draft.userHobbies}
                placeholder="Interests, values, preferences"
                onChange={(event) => update("userHobbies", event.target.value)}
                className="w-full resize-none rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none placeholder:text-stone-400 focus:border-stone-500 dark:border-stone-700/50 dark:bg-stone-900 dark:text-stone-200 dark:placeholder:text-stone-500 dark:focus:border-stone-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 justify-end gap-2 border-t border-stone-200 bg-white pt-4 dark:border-stone-700/50 dark:bg-stone-900">
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={() => onOpenChange(false)}
          className="cursor-pointer border-stone-300 text-stone-700 transition-all duration-150 ease-out active:translate-y-px active:scale-[0.98] dark:border-stone-700/50 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          Cancel
        </Button>

        <Button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSubmit()}
          className="cursor-pointer bg-blue-600 transition-all duration-150 ease-out hover:bg-blue-700 active:translate-y-px active:scale-[0.98] disabled:cursor-not-allowed dark:text-stone-300"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
