"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export default function ThemeShortcuts() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.ctrlKey || !event.shiftKey) {
        return;
      }

      const target = event.target as HTMLElement | null;

      // Never interfere with typing.
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "d":
          event.preventDefault();
          setTheme("dark");
          break;

        case "l":
          event.preventDefault();
          setTheme("light");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [setTheme]);

  return null;
}
