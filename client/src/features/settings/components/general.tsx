"use client";

import { useTheme } from "next-themes";

import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ACCENTS, FONTS } from "@/features/settings/constants/appearance";
import { useAppearance } from "@/features/settings/hooks/useAppearance";

const TRIGGER_CLASS =
  "w-full shrink-0 cursor-pointer border-stone-300 text-stone-700 dark:border-stone-700/50 dark:bg-stone-900 dark:text-stone-200 sm:w-44";
const CONTENT_CLASS = "font-paragraph dark:border-stone-700/50 dark:bg-stone-900";

function SettingRow({
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

export default function GeneralSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [accent, setAccent] = useAppearance("accent", "blue");
  const [font, setFont] = useAppearance("font", "default");

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DialogHeader className="shrink-0 pb-8">
        <DialogTitle className="text-xl font-semibold tracking-tight text-stone-950 dark:text-stone-100">
          General
        </DialogTitle>

        <DialogDescription className="mt-1 max-w-md text-sm leading-6 text-stone-500 dark:text-stone-400">
          Manage your application appearance and general preferences.
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="pb-6">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
            Appearance
          </h3>

          <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 p-4 dark:divide-stone-700/60 dark:border-stone-700/60">
            <SettingRow
              title="Dark mode"
              description={
                <>
                  Toggle with <kbd className="font-sans">Ctrl ⇧ D</kbd> / <kbd className="font-sans">Ctrl ⇧ L</kbd>
                </>
              }
            >
              <Switch
                aria-label="Dark mode"
                checked={isDark}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                className="cursor-pointer data-[state=checked]:bg-brand-600"
              />
            </SettingRow>

            <SettingRow title="Accent color" description="Highlight color used across Aletheia.">
              <Select value={accent} onValueChange={setAccent}>
                <SelectTrigger aria-label="Accent color" className={TRIGGER_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={CONTENT_CLASS}>
                  {ACCENTS.map(({ id, swatch }) => (
                    <SelectItem key={id} value={id} className="capitalize">
                      <span className={`size-2.5 rounded-full ${swatch}`} />
                      {id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>

            <SettingRow title="Font" description="OpenDyslexic improves readability for dyslexic readers.">
              <Select value={font} onValueChange={setFont}>
                <SelectTrigger aria-label="Font" className={TRIGGER_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={CONTENT_CLASS}>
                  {FONTS.map(({ id, label, family }) => (
                    <SelectItem key={id} value={id} style={{ fontFamily: family }}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </SettingRow>
          </div>
        </section>
      </div>
    </div>
  );
}
