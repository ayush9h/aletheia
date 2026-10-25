"use client";

import { useTheme } from "next-themes";

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
import {
  SELECT_TRIGGER,
  SettingRow,
  SettingSection,
  SettingsHeader,
} from "@/features/settings/components/settings-layout";
import { MENU_CONTENT, MENU_SELECT_ITEM } from "@/lib/menu";

export default function GeneralSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [accent, setAccent] = useAppearance("accent", "blue");
  const [font, setFont] = useAppearance("font", "default");

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SettingsHeader
        title="General"
        description="Manage your application appearance and general preferences."
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <SettingSection title="Appearance">
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
              <SelectTrigger aria-label="Accent color" className={SELECT_TRIGGER}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={6} className={MENU_CONTENT}>
                {ACCENTS.map(({ id, swatch }) => (
                  <SelectItem key={id} value={id} className={`${MENU_SELECT_ITEM} capitalize`}>
                    <span className={`size-2.5 rounded-full ${swatch}`} />
                    {id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>

          <SettingRow title="Font" description="OpenDyslexic improves readability for dyslexic readers.">
            <Select value={font} onValueChange={setFont}>
              <SelectTrigger aria-label="Font" className={SELECT_TRIGGER}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={6} className={MENU_CONTENT}>
                {FONTS.map(({ id, label, family }) => (
                  <SelectItem key={id} value={id} style={{ fontFamily: family }} className={MENU_SELECT_ITEM}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
        </SettingSection>
      </div>
    </div>
  );
}
