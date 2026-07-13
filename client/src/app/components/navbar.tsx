"use client";

/**
 * Application navbar responsible for:
 * - Account controls
 * - Settings dialog access
 */

import Image from "next/image";
import {
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { signOut, useSession } from "next-auth/react";
import { ExitIcon, GearIcon } from "@radix-ui/react-icons";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

import { SettingsDialog } from "./settings-dialog";
import type { UserPrefProps } from "../types/user-pref";
import type { ChatAction } from "../types/chats/chat-action";

type NavbarProps = {
  userPref: UserPrefProps;
  setUserPref: Dispatch<SetStateAction<UserPrefProps>>;
  dispatch: Dispatch<ChatAction>;
};

export default function Navbar({
  userPref,
  setUserPref,
  dispatch,
}: NavbarProps) {
  const { data: session, status } = useSession();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (status === "loading" || !session?.user) {
    return null;
  }

  const displayName = session.user.name?.trim() || "User";
  const avatarUrl = session.user.image;
  const fallbackInitial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async (): Promise<void> => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await signOut({
        redirectTo: "/",
      });
    } catch (error) {
      console.error("Failed to sign out", error);
      setIsSigningOut(false);
    }
  };

  return (
    <nav aria-label="Account navigation">
      <div className="flex items-center justify-end px-6 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Open account menu for ${displayName}`}
              className="flex size-8 items-center justify-center overflow-hidden rounded-full bg-stone-200 cursor-pointer"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={30}
                  height={30}
                  className="size-8 object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="text-sm font-medium text-stone-700"
                >
                  {fallbackInitial}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="font-paragraph"
          >
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{displayName}</span>

                {session.user.email && (
                  <span className="max-w-56 truncate text-xs font-normal text-muted-foreground">
                    {session.user.email}
                  </span>
                )}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer" onSelect={() => setSettingsOpen(true)}>
              Settings

              <DropdownMenuShortcut>
                <GearIcon aria-hidden="true" className="size-4" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              disabled={isSigningOut}
              onSelect={() => {
                void handleSignOut();
              }}
              className="
                text-red-500 focus:bg-red-50 focus:text-red-600 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-600 dark:focus:bg-red-950/30 dark:data-[highlighted]:bg-red-950/30
                cursor-pointer
              "
            >
              {isSigningOut ? "Logging out..." : "Log out"}

              <DropdownMenuShortcut className="text-inherit opacity-100">
                <ExitIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-inherit"
                />
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
