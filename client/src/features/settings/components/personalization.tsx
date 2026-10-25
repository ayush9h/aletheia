"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  FIELD_CLASS,
  SELECT_TRIGGER,
  SettingRow,
  SettingSection,
  SettingsHeader,
} from "@/features/settings/components/settings-layout";
import { MENU_CONTENT, MENU_SELECT_ITEM } from "@/lib/menu";
import type { UserPrefProps } from "@/types/user-pref";
import type { PersonalizedSettingProps } from "@/features/settings/types/preferences.types";

const TONES = ["Efficient", "Balanced", "Creative", "Technical"];

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 py-4 first:pt-0 last:pb-0">
      <label htmlFor={id} className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {label}
      </label>
      {children}
    </div>
  );
}

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
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <SettingsHeader
        title="Personalization"
        description="Customize how Aletheia responds to you."
      />

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <SettingSection title="Responses">
          <SettingRow
            title="Base style and tone"
            description="This controls response personality, not capability."
          >
            <Select
              value={draft.baseTone}
              onValueChange={(value) => update("baseTone", value)}
            >
              <SelectTrigger aria-label="Base style and tone" className={SELECT_TRIGGER}>
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>

              <SelectContent position="popper" sideOffset={6} className={MENU_CONTENT}>
                {TONES.map((tone) => (
                  <SelectItem key={tone} value={tone} className={MENU_SELECT_ITEM}>
                    {tone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow
            title="Memory storage"
            description="Allow Aletheia to remember useful details and personalize future conversations."
          >
            <Switch
              aria-label="Memory storage"
              checked={draft.memoryEnabled}
              onCheckedChange={(checked) => update("memoryEnabled", checked)}
              className="cursor-pointer self-start data-[state=checked]:bg-brand-600 sm:self-center"
            />
          </SettingRow>

          <Field id="custom-instructions" label="Custom instructions">
            <textarea
              id="custom-instructions"
              rows={4}
              value={draft.userCustomInstruction}
              placeholder="Additional behavior, style, or tone preferences"
              onChange={(event) =>
                update("userCustomInstruction", event.target.value)
              }
              className={`${FIELD_CLASS} resize-none`}
            />
          </Field>
        </SettingSection>

        <SettingSection title="About you">
          <Field id="nickname" label="Nickname">
            <input
              id="nickname"
              value={draft.nickname}
              placeholder="What should Aletheia call you?"
              onChange={(event) => update("nickname", event.target.value)}
              className={FIELD_CLASS}
            />
          </Field>

          <Field id="occupation" label="Occupation">
            <input
              id="occupation"
              value={draft.occupation}
              placeholder="Your profession or role"
              onChange={(event) => update("occupation", event.target.value)}
              className={FIELD_CLASS}
            />
          </Field>

          <Field id="more-about-you" label="More about you">
            <textarea
              id="more-about-you"
              rows={3}
              value={draft.userHobbies}
              placeholder="Interests, values, preferences"
              onChange={(event) => update("userHobbies", event.target.value)}
              className={`${FIELD_CLASS} resize-none`}
            />
          </Field>
        </SettingSection>
      </div>

      {/* Footer stays visible while the fields scroll */}
      <div className="flex shrink-0 justify-end gap-2 border-t border-stone-200 pt-4 dark:border-stone-700/50">
        <Button
          type="button"
          variant="outline"
          disabled={isSaving}
          onClick={() => onOpenChange(false)}
          className="cursor-pointer rounded-lg border-stone-200 text-stone-700 transition-all duration-150 ease-out active:translate-y-px active:scale-[0.98] dark:border-stone-700/60 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          Cancel
        </Button>

        <Button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSubmit()}
          className="cursor-pointer rounded-lg bg-brand-600 text-white transition-all duration-150 ease-out hover:bg-brand-700 active:translate-y-px active:scale-[0.98] disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
