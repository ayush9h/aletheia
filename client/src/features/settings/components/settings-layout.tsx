import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const SELECT_TRIGGER =
  "w-full shrink-0 cursor-pointer rounded-lg border-stone-200 text-stone-700 transition-colors hover:bg-stone-50 dark:border-stone-700/60 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800 sm:w-44";

export const FIELD_CLASS =
  "w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 dark:border-stone-700/60 dark:bg-stone-900 dark:text-stone-200 dark:placeholder:text-stone-500 dark:focus:border-stone-500";

export function SettingsHeader({ title, description }: { title: string; description: string }) {
  return (
    <DialogHeader className="shrink-0 pb-8">
      <DialogTitle className="text-xl font-semibold tracking-tight text-stone-950 dark:text-stone-100">
        {title}
      </DialogTitle>

      <DialogDescription className="mt-1 max-w-md text-sm leading-6 text-stone-500 dark:text-stone-400">
        {description}
      </DialogDescription>
    </DialogHeader>
  );
}

// Titled card of rows separated by dividers
export function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pb-6">
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
        {title}
      </h3>

      <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 px-4 py-4 dark:divide-stone-700/60 dark:border-stone-700/60">
        {children}
      </div>
    </section>
  );
}

export function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h4 className="text-sm font-medium text-stone-800 dark:text-stone-200">{title}</h4>
        <p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">{description}</p>
      </div>
      {children}
    </div>
  );
}
