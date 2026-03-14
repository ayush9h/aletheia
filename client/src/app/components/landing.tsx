"use client";
import { signIn } from "next-auth/react";
import Image from "next/image";

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col px-4 py-8">
      <div className="flex flex-1 flex-col items-center justify-center">

        <div className="mb-8">
          <div className="relative gap-2 inline-flex items-center rounded-md px-4 py-1.5 text-xs font-medium font-paragraphbg-white/70 backdrop-blur-md border border-stone-200 shadow-[0_6px_20px_rgba(0,0,0,0.06)] text-stone-600 overflow-hidden">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />

            <span className="relative z-10">
              Currently in development
            </span>

          </div>
        </div>

        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="font-header text-5xl font-extrabold text-blue-500 md:text-8xl">
            aletheia 
          </h1>
        </div>

        <div className="flex w-full flex-col justify-center gap-4 sm:w-auto sm:max-w-none sm:flex-row">
          <button
            onClick={() => signIn("google", { redirectTo: "/chat" })}
            className="font-paragraph flex cursor-pointer items-center justify-center gap-2 rounded-md border border-stone-200 bg-stone-50 p-3 text-sm text-stone-800 transition-all ease-in-out duration-300 hover:bg-stone-200/50"
          >
            <Image
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google logo"
              width={15}
              height={15}
              loading="lazy"
            />
            <span>Sign in with Google</span>
          </button>

          {/* GitHub Button */}
          <button
            onClick={() => signIn("github", { redirectTo: "/chat" })}
            className="font-paragraph flex cursor-pointer items-center justify-center gap-2 rounded-md border border-stone-200 bg-stone-50 p-3 text-sm text-stone-800 transition-all ease-in-out duration-300 hover:bg-stone-200/50"
          >
            <Image
              src="https://www.svgrepo.com/show/512317/github-142.svg"
              alt="GitHub logo"
              width={15}
              height={15}
              loading="lazy"
            />
            <span>Sign in with Github</span>
          </button>
        </div>
      </div>

      <footer className="mx-auto mt-16 w-full max-w-3xl text-center">
        <div className="font-paragraph text-xs text-stone-500">
          © {new Date().getFullYear()} Aletheia. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
