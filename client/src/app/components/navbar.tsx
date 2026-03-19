/**
 * Application Navbar responsible for:
 * - Model selection
 * - Account controls
 * - Settings dialog access
 */

"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useMemo } from "react";
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
import { GearIcon, ExitIcon, CaretDownIcon } from "@radix-ui/react-icons";

import { SettingsDialog } from "./settings-dialog";
import { UserPrefProps } from "../types/user-pref";
import { MODEL_GROUPS } from "../config/models";
import { ChatAction } from "../types/chats/chat-action";

type NavbarProps = {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  userPref: UserPrefProps;
  setUserPref: (userPref: UserPrefProps) => void;
  dispatch: React.Dispatch<ChatAction>;
};

export default function Navbar({
  selectedModel,
  setSelectedModel,
  userPref,
  setUserPref,
  dispatch,
}: NavbarProps) {
  const { data: session } = useSession();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const currentModel = useMemo(() => {
    return (
      MODEL_GROUPS.flatMap((g) => g.models).find(
        (m) => m.value === selectedModel
      )?.label ?? "Select model"
    );
  }, [selectedModel]);

  if (!session?.user) return null;

  return (
    <nav>
      <div className="flex items-center justify-between px-6 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="font-paragraph flex items-center rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 hover:bg-stone-50">
              {currentModel} <CaretDownIcon className="ml-2" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="font-paragraph w-56">
            {MODEL_GROUPS.map((group) => (
              <div key={group.provider}>
                <DropdownMenuLabel className="flex items-center gap-2 text-xs text-stone-500">
                  <img src={group.url} className="h-3 w-3" />
                  {group.provider}
                </DropdownMenuLabel>

                {group.models.map((model) => (
                  <DropdownMenuItem
                    key={model.value}
                    onSelect={() => setSelectedModel(model.value)}
                    className="cursor-pointer pl-8"
                  >
                    {model.label}
                  </DropdownMenuItem>
                ))}
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

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
