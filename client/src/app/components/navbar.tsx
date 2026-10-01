"use client";

/**
 * Application navbar responsible for:
 * - Account controls
 * - Settings dialog access
 */

import Image from "next/image";
import { useState, type Dispatch } from "react";
import { signOut, useSession } from "next-auth/react";
import { ExitIcon, GearIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";

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
  setUserPref: Dispatch<UserPrefProps>;
  dispatch: Dispatch<ChatAction>;
  onOpenSidebar?: () => void;
};

export default function Navbar({
  userPref,
  setUserPref,
  dispatch,
  onOpenSidebar
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
      <div className="flex items-center justify-between bg-stone-100/40 px-4 py-2 dark:bg-stone-800/60 md:justify-end md:px-6">
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={onOpenSidebar}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-stone-600 transition-colors hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800 md:hidden"
        >
          <HamburgerMenuIcon className="size-4" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Open account menu for ${displayName}`}
              className="flex size-[2.25rem] cursor-pointer items-center justify-center rounded-full bg-stone-200 dark:bg-stone-800"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={25}
                  height={25}
                  className="size-[1.75rem] rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="text-sm font-medium text-stone-700 dark:text-stone-200"
                >
                  {fallbackInitial}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="font-paragraph dark:border-stone-700 dark:bg-stone-900"
          >
            <DropdownMenuLabel className="dark:text-stone-200">
              <div className="flex flex-col">
                <span>{displayName}</span>

                {session.user.email && (
                  <span className="max-w-56 truncate text-xs font-normal text-muted-foreground dark:text-stone-400">
                    {session.user.email}
                  </span>
                )}
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="dark:bg-stone-700" />

            <DropdownMenuItem
              className="cursor-pointer dark:text-stone-200 dark:focus:bg-stone-800 dark:focus:text-stone-100"
              onSelect={() => setSettingsOpen(true)}
            >
              Settings
              <DropdownMenuShortcut>
                <GearIcon aria-hidden="true" className="size-4" />
              </DropdownMenuShortcut>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="dark:bg-stone-700" />

            <DropdownMenuItem
              disabled={isSigningOut}
              onSelect={() => {
                void handleSignOut();
              }}
              className="cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-600 dark:text-red-400 dark:focus:bg-red-950/30 dark:focus:text-red-400 dark:data-[highlighted]:bg-red-950/30 dark:data-[highlighted]:text-red-400"
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
