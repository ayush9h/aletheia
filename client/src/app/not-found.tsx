import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh font-paragraph grid place-items-center bg-stone-100/40 px-6 py-8 text-stone-900 dark:bg-stone-800/60 dark:text-stone-100">
      <div className="flex flex-col items-center text-center">
        {/* 4 [logo] 4 */}
        <p className="m-0 flex items-center text-[clamp(7rem,26vw,15rem)] leading-[0.9] tracking-[-0.03em]">
          <span className="sr-only">404</span>
          <span aria-hidden="true">4</span>
          <Image
            src="/logo.png"
            alt=""
            width={256}
            height={256}
            priority
            className="mx-[0.03em] h-[0.78em] w-[0.78em]"
          />
          <span aria-hidden="true">4</span>
        </p>

        <h1 className="mb-2 mt-6 text-[clamp(2rem,5vw,2.75rem)] font-normal leading-[1.1]">
          This page isn&apos;t here.
        </h1>
        <p className="mb-8 max-w-[34ch] text-[1.0625rem] leading-relaxed text-stone-500 dark:text-stone-400">
          The link may be broken, or the page may have moved. Head back home and
          try again from there.
        </p>

        <Link
          href="/"
          className="inline-block rounded-md  bg-brand-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline-offset-[3px] focus-visible:outline-brand-500"
        >
          Go to home
        </Link>
      </div>
    </main>
  );
}
