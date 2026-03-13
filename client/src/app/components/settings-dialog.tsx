"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FaceIcon } from "@radix-ui/react-icons";
import { UserPrefProps } from "../types/userPref";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useSaveUserPreferences } from "../hooks/userUserPref";

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPref:UserPrefProps;
  setUserPref: (userPref:UserPrefProps)=>void
};

export function SettingsDialog({
  open,
  onOpenChange,
  userPref,
  setUserPref
}: SettingsDialogProps) {

  const { data: session } = useSession();
  const userId = session?.user?.id;

  const {savePreferences} = useSaveUserPreferences()
  const handleSave = async () => {
   await savePreferences(userId as string, userPref)
   onOpenChange(false)
}


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="font-paragraph">
        <div className="flex  gap-4">
          <aside className="w-28">
            <div className="space-y-2 text-xs">
              <button className="flex items-center w-full gap-1 rounded-md bg-stone-200 p-2">
                <FaceIcon className="h-3 w-3" />
                Personalization
              </button>
             
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Personalization
              </DialogTitle>
              <DialogDescription>
                Customize how the assistant responds to you.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-2">
              <div className="space-y-2">
                <label className="text-sm">Custom instructions</label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 text-sm resize-none"
                  onChange={(e)=>setUserPref({...userPref, userCustomInstruction:e.target.value})}
                  rows={3}
                  value={userPref.userCustomInstruction}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm">Nickname</label>
                <input
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  onChange={(e)=>(setUserPref({...userPref, userPronouns: e.target.value}))}
                  value={userPref.userPronouns}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm">More about you</label>
                <textarea
                  className="w-full rounded-md border px-3 py-2 text-sm resize-none"
                  onChange={(e) =>
                    setUserPref({ ...userPref, userHobbies: e.target.value })
                  }

                  value={userPref.userHobbies}
                  rows={3}  
                />
              </div>
            </div>
          </main>
          
        </div>
        <div className="flex justify-end gap-2 cursor-pointer">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 cursor-pointer" onClick={handleSave}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
