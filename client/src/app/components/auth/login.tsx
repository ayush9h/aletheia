"use client";

import { useState } from "react";
import Image from "next/image";
import { signIn } from "next-auth/react";

import { authProviders } from "@/app/config/auth-provider";
import { Button } from "../ui/button";


export default function LoginPage() {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleSignIn = async (id: string) => {
    setPendingId(id);

    try {
      await signIn(id, {
        redirectTo: "/chat",
      });
    } catch {
      setPendingId(null);
    }
  };

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-white px-6 py-8 text-center text-stone-950 dark:bg-stone-950 dark:text-white">
      {/* Main content */}
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <section className="flex w-full max-w-sm flex-col items-center">
          {/* Brand */}
          <div className="flex flex-col items-center">
            <h1 className="font-header -mt-1 text-[4.25rem] font-extrabold leading-none tracking-[-0.06em] text-blue-500 sm:text-[5rem]">
              aletheia
            </h1>
          </div>

          {/* Authentication heading */}
          <h2 className="font-paragraph mb-7 mt-14 text-xl font-extralight leading-none tracking-tight">
            Log into your account
          </h2>

          {/* Provider buttons */}
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
                className="font-paragraph relative flex h-14 w-full cursor-pointer items-center justify-center rounded-full border-0 bg-stone-100 px-6 text-[16px] font-normal tracking-normal text-stone-950 shadow-none transition-colors duration-150 hover:bg-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700">
                {/* Centered icon + text group */}
                <span className="flex items-center justify-center gap-3">
                  <Image
                    src={item.icon}
                    alt=""
                    width={21}
                    height={21}
                    className="h-[21px] w-[21px] shrink-0 object-contain"
                  />

                  <span className="whitespace-nowrap">
                    {pendingId === item.id
                      ? "Redirecting…"
                      : item.label}
                  </span>
                </span>
              </Button>
            ))}
          </div>

          {/* Terms */}
          <p className="font-paragraph mt-6 max-w-[17rem] text-[13px] leading-5 text-stone-500">
            By continuing, you agree to Aletheia&apos;s terms and privacy
            practices.
          </p>
        </section>
      </div>

      {/* Footer */}
      <footer className="font-paragraph relative z-10 pt-8 text-xs text-stone-500">
        © {new Date().getFullYear()} Aletheia. Currently in development.
      </footer>
    </main>
  );
}
