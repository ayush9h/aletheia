"use client";

import Image from "next/image";
import { authProviders } from "@/app/config/auth-provider";
import { signIn } from "next-auth/react";
import { Button } from "../ui/button";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white px-4 py-6 sm:px-6 sm:py-8 dark:bg-stone-950">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mb-7 sm:mb-8">
          <div className="font-paragraph relative inline-flex items-center gap-2 overflow-hidden rounded-md border border-stone-200 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-stone-600 shadow-[0_6px_20px_rgba(0,0,0,0.06)] backdrop-blur-md dark:border-stone-700/50 dark:bg-stone-900/70 dark:text-stone-300 dark:shadow-[0_6px_20px_rgba(0,0,0,0.2)]">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-blue-600 dark:bg-blue-500" />
            <span className="relative z-10 whitespace-nowrap">
              Currently in development
            </span>
          </div>
        </div>

        <div className="mb-7 text-center sm:mb-8">
          <h1 className="font-header text-6xl font-extrabold leading-none text-blue-500 sm:text-7xl md:text-8xl">
            aletheia
          </h1>
        </div>

        <div className="flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:gap-4">
          {authProviders.map((item) => (
            <Button
              key={item.id}
              className="font-paragraph flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-5 text-sm text-stone-800 shadow-xs transition-all duration-150 ease-out hover:bg-stone-200/50 active:translate-y-px active:scale-[0.98] active:bg-stone-200 sm:w-auto dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 dark:active:bg-stone-800"
              onClick={() => signIn(item.id, { redirectTo: "/chat" })}
            >
              <Image
                src={item.icon}
                alt={item.title}
                width={15}
                height={15}
                loading="lazy"
              />
              <span>{item.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <footer className="mx-auto mt-12 w-full max-w-3xl px-2 text-center sm:mt-16">
        <div className="font-paragraph text-xs text-stone-500 dark:text-stone-500">
          © {new Date().getFullYear()} Aletheia. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
