"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

import { UserPrefProps } from "../types/userPref";

import { useSession } from "next-auth/react";
import { useSaveUserPreferences } from "../hooks/useUserPref";
import { SETTING_SECTIONS } from "../config/userSettings";
import { useState } from "react";
import PersonalizationSettings from "./settings/personalization";
import DataControls from "./settings/data-controls";
import { ChatAction } from "../types/userChat";
type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPref:UserPrefProps;
  setUserPref: (userPref:UserPrefProps)=>void,
  dispatch: React.Dispatch<ChatAction>;
};

export function SettingsDialog({
  open,
  onOpenChange,
  userPref,
  setUserPref,
  dispatch,
}: SettingsDialogProps) {

  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [activeSection, setActiveSection]= useState<string>('personalization')


  const {savePreferences} = useSaveUserPreferences()
  const handleSave = async () => {
    await savePreferences(userId as string, userPref)
    onOpenChange(false)
  }

  function renderSection(){
    switch(activeSection){
      case 'personalization':
        return (
          <PersonalizationSettings userPref={userPref} setUserPref= {setUserPref} handleSave={handleSave} onOpenChange={onOpenChange} />  
        )

      case 'data-controls':
        return (<DataControls userId={userId as string} dispatch={dispatch}/>)
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-paragraph max-w-2xl h-[85%] overflow-y-auto">
        <div className="flex gap-4">
          <aside className="w-36">
            <div className="space-y-2 text-xs">

              {SETTING_SECTIONS.map(section=>(
                <button key={section.id}  
                        onClick={() => setActiveSection(section.id)} 
                        className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ease-in-out transition-all w-full ${ activeSection === section.id ? "bg-stone-200" : ""}`}>
                  <section.icon className="h-4 w-4"/>
                  {section.label}
                </button>
              ))}
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto">
             {renderSection()}
          </main>
          
        </div>

      </DialogContent>
    </Dialog>
  );
}
