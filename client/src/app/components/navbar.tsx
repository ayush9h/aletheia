/**
 * Application Navbar responsible for:
 * - Model selection
 * - Account controls
 * - Settings dialog access
 */

"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from "@/app/components/ui/dropdown-menu";
import { GearIcon, ExitIcon,  } from "@radix-ui/react-icons";

import { SettingsDialog } from "./settings-dialog";
import { UserPrefProps } from "../types/user-pref";
import { ChatAction } from "../types/chats/chat-action";

type NavbarProps = {
  userPref: UserPrefProps;
  setUserPref: (userPref: UserPrefProps) => void;
  dispatch: React.Dispatch<ChatAction>;
};

export default function Navbar({
  userPref,
  setUserPref,
  dispatch,
}: NavbarProps) {
  const { data: session } = useSession();
  const [settingsOpen, setSettingsOpen] = useState(false);


  if (!session?.user) return null;

  return (
    <nav>
      <div className="flex items-center justify-end px-6 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Image
              src={session.user.image as string}
              alt="User avatar"
              width={40}
              height={40}
              className="cursor-pointer rounded-full bg-stone-200 p-1 hover:bg-stone-300"
            />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="font-paragraph">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setSettingsOpen(true);
              }}
            >
              Settings
              <DropdownMenuShortcut>
                <GearIcon className="h-4 w-4" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => signOut({ redirectTo: "/" })}>
              Log out
              <DropdownMenuShortcut>
                <ExitIcon className="h-4 w-4 shrink-0" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          userPref={userPref}
          setUserPref={setUserPref}
          dispatch={dispatch}
        />
      </div>
    </nav>
  );
}
