import Link from "next/link";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

import { LEGAL_LINKS } from "@/features/legal/constants/legal-links";
import type { LegalDocument } from "@/features/legal/types/legal.types";

const PROSE =
  "text-[15px] leading-7 text-stone-600 dark:text-stone-300 [&_a]:text-brand-600 [&_a]:underline [&_a]:decoration-current/40 [&_a]:underline-offset-2 hover:[&_a]:decoration-current dark:[&_a]:text-brand-400 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-stone-900 dark:[&_h3]:text-stone-100 [&_li]:mt-1.5 [&_p]:mt-3 [&_strong]:font-semibold [&_strong]:text-stone-900 dark:[&_strong]:text-stone-100 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:marker:text-stone-400";

export default function LegalPage({ document }: { document: LegalDocument }) {
  const { title, updated, intro, sections } = document;

  return (
    <div className="font-paragraph min-h-dvh bg-white text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/80 backdrop-blur dark:border-stone-800 dark:bg-stone-950/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="font-header text-2xl font-extrabold tracking-[-0.06em] text-brand-500">
            aletheia
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          >
            <ArrowLeftIcon className="size-3.5" />
            Back to Aletheia
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-20 pt-14">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-brand-600 dark:text-brand-400">Legal</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">Last updated {updated}</p>
          <div className={`mt-6 ${PROSE}`}>{intro}</div>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-24">
              <p className="text-xs font-medium uppercase tracking-widest text-stone-400">On this page</p>
              <ol className="mt-4 space-y-2 border-l border-stone-200 text-sm dark:border-stone-800">
                {sections.map((section, index) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="-ml-px block border-l border-transparent pl-4 text-stone-500 transition-colors hover:border-brand-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                    >
                      {index + 1}. {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <article className="max-w-2xl divide-y divide-stone-200 dark:divide-stone-800">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-20 py-10 first:pt-0">
                <h2 className="flex items-baseline gap-3 text-xl font-semibold tracking-tight">
                  <span className="text-sm tabular-nums text-brand-600 dark:text-brand-400">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </h2>
                <div className={PROSE}>{section.content}</div>
              </section>
            ))}
          </article>
        </div>
      </div>

      <footer className="border-t border-stone-200 dark:border-stone-800">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-6 text-xs text-stone-500 dark:text-stone-400">
          <span>© {new Date().getFullYear()} Aletheia</span>
          {LEGAL_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className="transition-colors hover:text-stone-900 dark:hover:text-stone-100">
              {label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
