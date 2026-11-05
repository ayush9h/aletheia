import Image from "next/image";
import Link from "next/link";

import loginArt from "@/features/auth/assets/login-art.png";
import ProviderButtons from "@/features/auth/components/provider-buttons";

const LINK_CLASS =
  "text-stone-700 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-brand-600 hover:decoration-current dark:text-stone-300 dark:decoration-stone-600 dark:hover:text-brand-400";

export default function LoginPage() {
  return (
    <main className="min-h-dvh text-stone-950 dark:bg-stone-950 flex bg-stone-200 p-2 dark:text-white">
      <aside className="relative hidden w-1/2 shrink-0 overflow-hidden rounded-l-lg lg:block">
        <Image
          src={loginArt}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="50vw"
          className="object-cover"
        />
      </aside>

      <div className="relative flex flex-1 flex-col overflow-hidden rounded-lg bg-white px-3 py-5 text-center dark:bg-stone-900 lg:rounded-l-none">
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <section className="flex w-full max-w-sm flex-col items-center">
            <h1 className="font-header text-brand-500 -mt-1 text-[4.25rem] font-extrabold leading-none tracking-[-0.06em] sm:text-[5rem]">
              aletheia
            </h1>

            <h2 className="font-paragraph mb-7 mt-14 text-xl font-extralight leading-none tracking-tight">
              Log in to your account
            </h2>

            <ProviderButtons />

            <p className="font-paragraph mt-6 max-w-[17rem] text-[13px] leading-5 text-stone-500">
              By continuing, you agree to Aletheia&apos;s{" "}
              <Link href="/terms" className={LINK_CLASS}>
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className={LINK_CLASS}>
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>

        <footer className="font-paragraph relative z-10 pt-8 text-xs text-stone-500">
          © {new Date().getFullYear()} Aletheia. Currently in development.
        </footer>
      </div>
    </main>
  );
}
