"use client";
import { useState } from "react";
import { Dialog, DialogContent } from "@/app/components/ui/dialog";
import { useSession } from "next-auth/react";
import { useSaveUserPreferences } from "../hooks/useUserPref";
import { SETTING_SECTIONS } from "../config/userSettings";
import PersonalizationSettings from "./settings/personalization";
import DataControls from "./settings/data-controls";
import { SettingsDialogProps } from "../types/settings/settings.type";

export function SettingsDialog(settingsProps: SettingsDialogProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [activeSection, setActiveSection] = useState<string>("personalization");

  const { savePreferences } = useSaveUserPreferences();
  const handleSave = async () => {
    await savePreferences(userId as string, settingsProps.userPref);
    settingsProps.onOpenChange(false);
  };

  function renderSection() {
    switch (activeSection) {
      case "personalization":
        return (
          <PersonalizationSettings
            userPref={settingsProps.userPref}
            setUserPref={settingsProps.setUserPref}
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
    <Dialog open={settingsProps.open} onOpenChange={settingsProps.onOpenChange}>
      <DialogContent className="font-paragraph h-[85%] max-w-2xl overflow-y-auto">
        <div className="flex gap-4">
          <aside className="w-36">
            <div className="space-y-2 text-xs">
              {SETTING_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-md p-2 transition-all ease-in-out ${
                    activeSection === section.id ? "bg-stone-200" : ""
                  }`}
                >
                  <section.icon className="h-4 w-4" />
                  {section.label}
                </button>
              ))}
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto">{renderSection()}</main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
