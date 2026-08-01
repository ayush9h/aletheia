"use client";
import { useState } from "react";
import { Dialog, DialogContent } from "@/app/components/ui/dialog";
import { useSession } from "next-auth/react";
import { useSaveUserPreferences } from "../hooks/useUserPref";
import { SETTING_SECTIONS } from "../config/user-settings";
import PersonalizationSettings from "./settings/personalization";
import DataControls from "./settings/data-controls";
import { SettingsDialogProps } from "../types/settings/settings.type";
import { UserPrefProps } from "../types/user-pref";


export function SettingsDialog(settingsProps: SettingsDialogProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [activeSection, setActiveSection] = useState<string>("personalization");

  const { savePreferences } = useSaveUserPreferences();
  const handleSave = async (userPref: UserPrefProps) => {
    if (!userId) return;

    await savePreferences(userId, userPref);
    settingsProps.setUserPref(userPref);
    settingsProps.onOpenChange(false);
  };

  function renderSection() {
    switch (activeSection) {
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
    }
  }

  return (
    <Dialog
      open={settingsProps.open}
      onOpenChange={settingsProps.onOpenChange}
    >
      <DialogContent className="h-[85dvh] max-h-[85dvh] max-w-2xl overflow-hidden p-0 font-paragraph">
        <div className="flex h-full min-h-0">
          <aside className="w-48 shrink-0 border-r border-stone-200 p-5">
            <div className="space-y-2 text-xs">
              {SETTING_SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`flex w-full cursor-pointer items-center gap-2 rounded-md p-2 text-left text-stone-800 transition-colors ${
                      isActive ? "bg-stone-200" : "hover:bg-stone-100"
                    }`}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="min-h-0 min-w-0 flex-1 overflow-hidden p-6">
            {renderSection()}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
