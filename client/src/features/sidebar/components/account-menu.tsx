"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState, type Dispatch } from "react";
import { signOut, useSession } from "next-auth/react";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { ChartNoAxesCombinedIcon, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppTooltip from "@/components/ui/app-tooltip";
import {
  MENU_CONTENT,
  MENU_ITEM,
  MENU_ITEM_DANGER,
  MENU_SEPARATOR,
} from "@/lib/menu";

import { UserPrefProps } from "@/types/user-pref";
import { ChatAction } from "@/features/chat/types/chat-action";

// Dialogs load on demand, keeping recharts and settings out of the initial bundle
const SettingsDialog = dynamic(() =>
  import("@/features/settings/components/settings-dialog").then((m) => m.SettingsDialog),
);
const AnalyticsDialog = dynamic(() => import("@/features/analytics/components/analytics-dialog"));

type AccountMenuProps = {
  open: boolean;
  userPref: UserPrefProps;
  setUserPref: Dispatch<UserPrefProps>;
  dispatch: Dispatch<ChatAction>;
};

export default function AccountMenu({
  open,
  userPref,
  setUserPref,
  dispatch,
}: AccountMenuProps) {
  const { data: session, status } = useSession();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
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

  const avatar = (size: string) =>
    avatarUrl ? (
      <Image
        src={avatarUrl}
        alt=""
        width={32}
        height={32}
        className={`${size} shrink-0 rounded-full object-cover`}
      />
    ) : (
      <span
        aria-hidden="true"
        className={`${size} flex shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-medium text-stone-700 dark:bg-stone-700 dark:text-stone-200`}
      >
        {fallbackInitial}
      </span>
    );

  const trigger = (
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        aria-label={`Open account menu for ${displayName}`}
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors duration-150 hover:bg-stone-200/60 data-[state=open]:bg-stone-200/60 dark:hover:bg-stone-800 dark:data-[state=open]:bg-stone-800"
      >
        {avatar("size-6")}

        {open && (
          <>
            <span className="animate-sidebar-in min-w-0 flex-1 truncate">{displayName}</span>
            <CaretSortIcon aria-hidden="true" className="animate-sidebar-in size-4 shrink-0 text-stone-500" />
          </>
        )}
      </button>
    </DropdownMenuTrigger>
  );

  return (
    // Portaled menu and dialog clicks bubble through React; keep them from expanding the collapsed sidebar
    <div onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        {open ? trigger : <AppTooltip label="Account" side="right">{trigger}</AppTooltip>}

        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={8}
          // Match the trigger so both edges line up; min width covers the collapsed sidebar
          className={`${MENU_CONTENT} w-(--radix-dropdown-menu-trigger-width) min-w-56`}
        >
          <DropdownMenuLabel className="flex items-center gap-2.5 px-2.5 py-2 font-normal">
            {avatar("size-8")}

            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium text-stone-900 dark:text-stone-100">
                {displayName}
              </span>

              {session.user.email && (
                <span className="truncate text-xs text-stone-500 dark:text-stone-400">
                  {session.user.email}
                </span>
              )}
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className={MENU_SEPARATOR} />

          {/* Settings */}
          <DropdownMenuItem className={MENU_ITEM} onSelect={() => setSettingsOpen(true)}>
            <Settings aria-hidden="true" className="size-4" />
            Settings
          </DropdownMenuItem>

          {/* Analytics */}
          <DropdownMenuItem className={MENU_ITEM} onSelect={() => setAnalyticsOpen(true)}>
            <ChartNoAxesCombinedIcon aria-hidden="true" className="size-4" />
            Analytics
          </DropdownMenuItem>

          <DropdownMenuSeparator className={MENU_SEPARATOR} />

          {/* Logout */}
          <DropdownMenuItem
            variant="destructive"
            disabled={isSigningOut}
            onSelect={() => {
              void handleSignOut();
            }}
            className={MENU_ITEM_DANGER}
          >
            <LogOut aria-hidden="true" className="size-4" />
            {isSigningOut ? "Logging out..." : "Log out"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings dialog */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        userPref={userPref}
        setUserPref={setUserPref}
        dispatch={dispatch}
      />

      {/* Analytics dialog */}
      <AnalyticsDialog
        open={analyticsOpen}
        onOpenChange={setAnalyticsOpen}
      />
    </div>
  );
}
