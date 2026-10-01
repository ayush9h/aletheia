"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/app/components/ui/dialog";
import { useSession } from "next-auth/react";
import { useSaveUserPreferences } from "../hooks/useUserPref";
import { SETTING_SECTIONS } from "../config/user-settings";
import PersonalizationSettings from "./settings/personalization";
import DataControls from "./settings/data-controls";
import GeneralSettings from "./settings/general";
import { SettingsDialogProps } from "../types/settings/settings.type";
import { UserPrefProps } from "../types/user-pref";

export function SettingsDialog(settingsProps: SettingsDialogProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [activeSection, setActiveSection] = useState<string>("general");

  const { savePreferences } = useSaveUserPreferences();

  const handleSave = async (userPref: UserPrefProps) => {
    if (!userId) return;

    await savePreferences(userId, userPref);
    settingsProps.setUserPref(userPref);
    settingsProps.onOpenChange(false);
  };

  function renderSection() {
    switch (activeSection) {
      case "general":
        return <GeneralSettings />;

      case "personalization":
        return (
          <PersonalizationSettings
            userPref={settingsProps.userPref}
            handleSave={handleSave}
            onOpenChange={settingsProps.onOpenChange}
          />
        );

      case "data-controls":
        return (
          <DataControls
            userId={userId as string}
            dispatch={settingsProps.dispatch}
          />
        );

      default:
        return null;
    }
  }

  return (
    <Dialog open={settingsProps.open} onOpenChange={settingsProps.onOpenChange}>
      <DialogContent className="font-paragraph h-[85dvh] max-h-[85dvh] w-[calc(100%-1.5rem)] max-w-2xl overflow-hidden border-stone-200 p-0 text-stone-900 dark:border-stone-700/50 dark:bg-stone-800/50 dark:text-stone-100 sm:w-[calc(100%-2rem)]">
        <DialogTitle className="sr-only">Settings</DialogTitle>

        <div className="flex h-full min-h-0 flex-col md:flex-row">
          <aside className="shrink-0 border-b border-stone-200 bg-stone-50 dark:border-stone-700/50 dark:bg-stone-950 md:w-48 md:border-b-0 md:border-r md:p-5">
            <div className="flex gap-1 overflow-x-auto p-3 md:flex-col md:gap-2 md:overflow-visible md:p-0">
              {SETTING_SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-md p-2 text-left text-xs transition-colors md:w-full ${isActive ? "bg-stone-200 text-stone-900 dark:bg-stone-800 dark:text-stone-100" : "text-stone-700 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"}`}
                  >
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                    <span className="whitespace-nowrap">{section.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-white p-4 dark:bg-stone-900 sm:p-6">
              {renderSection()}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
