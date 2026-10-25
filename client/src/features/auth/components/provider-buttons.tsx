"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authProviders } from "@/features/auth/config/auth-providers";
import { cn } from "@/lib/utils";

// Only interactive part of the login page, keeps the rest server-rendered
export default function ProviderButtons() {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleSignIn = async (id: string) => {
    setPendingId(id);
    try {
      await signIn(id, { redirectTo: "/chat" });
    } catch {
      setPendingId(null);
    }
  };

  return (
    <div
      className="mx-auto flex w-full max-w-[400px] flex-col gap-3"
      role="group"
      aria-label="Sign in options"
    >
      {authProviders.map((item) => (
        <Button
          key={item.id}
          type="button"
          disabled={pendingId !== null}
          aria-busy={pendingId === item.id}
          onClick={() => handleSignIn(item.id)}
          className="font-paragraph text-stone-950 focus-visible:ring-brand-500 relative flex h-14 w-full cursor-pointer items-center justify-center rounded-md border-0 bg-stone-100 px-6 text-[16px] font-normal tracking-normal shadow-none transition-colors duration-150 hover:bg-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-800 dark:text-stone-100 dark:ring-offset-stone-950 dark:hover:bg-stone-700"
        >
          <span className="flex items-center justify-center gap-3">
            {pendingId === item.id ? (
              <Loader2
                aria-hidden
                className="size-[21px] shrink-0 animate-spin motion-reduce:animate-none"
              />
            ) : (
              <Image
                src={item.icon}
                alt=""
                width={21}
                height={21}
                className={cn(
                  "h-[21px] w-[21px] shrink-0 object-contain",
                  "invertOnDark" in item && "dark:invert"
                )}
              />
            )}
            <span className="whitespace-nowrap">
              {pendingId === item.id ? "Redirecting…" : item.label}
            </span>
          </span>
        </Button>
      ))}
    </div>
  );
}
