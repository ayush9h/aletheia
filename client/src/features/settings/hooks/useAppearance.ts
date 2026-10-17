import { useState } from "react";

export function useAppearance(key: "accent" | "font", fallback: string) {
  const [value, setValue] = useState(
    () => document.documentElement.dataset[key] ?? fallback
  );

  const update = (next: string) => {
    document.documentElement.dataset[key] = next;
    localStorage.setItem(`aletheia-${key}`, next);
    setValue(next);
  };

  return [value, update] as const;
}
