import ProviderButtons from "@/features/auth/components/provider-buttons";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-white px-6 py-8 text-center text-stone-950 dark:bg-stone-950 dark:text-white">
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <section className="flex w-full max-w-sm flex-col items-center">
          <h1 className="font-header -mt-1 text-[4.25rem] font-extrabold leading-none tracking-[-0.06em] text-brand-500 sm:text-[5rem]">
            aletheia
          </h1>

          <h2 className="font-paragraph mb-7 mt-14 text-xl font-extralight leading-none tracking-tight">
            Log into your account
          </h2>

          <ProviderButtons />

          <p className="font-paragraph mt-6 max-w-[17rem] text-[13px] leading-5 text-stone-500">
            By continuing, you agree to Aletheia&apos;s terms and privacy practices.
          </p>
        </section>
      </div>

      <footer className="font-paragraph relative z-10 pt-8 text-xs text-stone-500">
        © {new Date().getFullYear()} Aletheia. Currently in development.
      </footer>
    </main>
  );
}
