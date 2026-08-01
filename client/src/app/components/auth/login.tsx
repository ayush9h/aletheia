'use client'
import Image from "next/image"
import { authProviders } from "@/app/config/auth-provider"
import { signIn } from "next-auth/react"
import { Button } from "../ui/button"

export default function LoginPage() {
  return (
  <>
      <div className="flex min-h-screen flex-col px-4 py-8">

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mb-8">
          <div className="font-paragraph relative inline-flex items-center gap-2 overflow-hidden rounded-md border border-stone-200 bg-white/70 px-4 py-1.5 text-xs font-medium text-stone-600 shadow-[0_6px_20px_rgba(0,0,0,0.06)] backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />

            <span className="relative z-10">Currently in development</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6 text-center">
          <h1 className="font-header text-5xl font-extrabold text-blue-500 md:text-8xl">
            aletheia
          </h1>
        </div>

        <div className="flex w-full flex-col justify-center gap-4 sm:w-auto sm:max-w-none sm:flex-row">
          {authProviders.map((item) => (
            <Button
              key={item.id}
              className="font-paragraph flex cursor-pointer items-center justify-center gap-2 rounded-md border border-stone-200 bg-stone-50 text-sm text-stone-800 shadow-xs transition-all duration-150 ease-out hover:bg-stone-200/50 active:translate-y-px active:scale-[0.98] active:bg-stone-200"
              onClick={() => signIn(item.id, { redirectTo: "/chat" })}>

              <Image src={item.icon} alt={item.title} width={15} height={15} loading="lazy" />
              <span>{item.label}</span>

            </Button>
          ))}
        </div>
      </div>

      <footer className="mx-auto mt-16 w-full max-w-3xl text-center">
        <div className="font-paragraph text-xs text-stone-500">
          © {new Date().getFullYear()} Aletheia. All rights reserved.
        </div>
      </footer>
    </div>

  </>
  )
}
