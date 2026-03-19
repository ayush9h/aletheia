/**
 * PersonalizationSettings dialog for configuring user AI response preferences.
 *
 * @param userPref - Persisted user personalization configuration
 * @param setUserPref - State setter to commit finalized preferences
 * @param handleSave - Persistence handler for backend sync
 * @param onOpenChange - Dialog visibility controller
 */
"use client";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { UserPrefProps } from "@/app/types/userPref";
import { PersonalizedSettingProps } from "@/app/types/settings/preferences.type";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";

export default function PersonalizationSettings(
  PersonalizedSettingProps: PersonalizedSettingProps
) {
  /**
   * Local draft state.
   */
  const [draft, setDraft] = useState<UserPrefProps>(
    PersonalizedSettingProps.userPref
  );

  /**
   * Sync draft when persisted preferences change externally.
   */
  useEffect(() => {
    setDraft(PersonalizedSettingProps.userPref);
  }, [PersonalizedSettingProps.userPref]);

  /**
   * Generic field updater for preference draft mutations.
   */
  const update = (key: keyof UserPrefProps, value: string | undefined) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };
  return (
    <div className="space-y-8">
      <DialogHeader>
        <DialogTitle className="text-xl">Personalization</DialogTitle>
        <DialogDescription>
          Customize how Aletheia responds to you.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="flex items-start justify-between">
          {/* Base Style and Tone */}
          <div>
            <h3 className="text-sm">Base Style and Tone</h3>
            <p className="text-muted-foreground text-xs">
              This controls response personality, not capability.
            </p>
          </div>

          <Select
            value={draft.baseTone}
            onValueChange={(v) => update("baseTone", v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Efficient">Efficient</SelectItem>
              <SelectItem value="Balanced">Balanced</SelectItem>
              <SelectItem value="Creative">Creative</SelectItem>
              <SelectItem value="Technical">Technical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Instructions */}

        <div className="space-y-2">
          <h3 className="text-xs">Custom instructions</h3>
          <textarea
            className="w-full resize-none rounded-md border px-3 py-2 text-sm"
            rows={4}
            placeholder="Additional behavior, style, or tone preferences"
            value={draft.userCustomInstruction}
            onChange={(e) => update("userCustomInstruction", e.target.value)}
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">About you</h3>

          <div className="space-y-2">
            <h3 className="text-xs">Nickname</h3>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="What should Aletheia call you?"
              value={draft.nickname}
              onChange={(e) => update("nickname", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-xs">Occupation</h3>
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Your profession or role"
              value={draft.occupation}
              onChange={(e) => update("occupation", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-xs">More About You</h3>
            <textarea
              className="w-full resize-none rounded-md border px-3 py-2 text-sm"
              rows={3}
              placeholder="Interests, values, preferences"
              value={draft.userHobbies}
              onChange={(e) => update("userHobbies", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex cursor-pointer justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => PersonalizedSettingProps.onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          className="cursor-pointer bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            PersonalizedSettingProps.setUserPref(draft);
            PersonalizedSettingProps.handleSave();
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
