"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

// ponytail: all three choices on screen, so there is nothing to open — a
// dropdown for three mutually exclusive options is a click nobody needs.
const THEMES = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
  { value: "system", label: "System", Icon: MonitorIcon },
];

const noStore = () => () => {};

/** Segmented light/dark/system picker. */
export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  // next-themes only knows the theme after it has read storage, so the server
  // and the first client render must agree on "nothing selected" — guessing
  // system here hydrated as aria-pressed="false" over a client-side true.
  const hydrated = useSyncExternalStore(noStore, () => true, () => false);
  const active = hydrated ? theme ?? "system" : null;

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="inline-flex flex-wrap items-center gap-1 rounded-full border p-1"
    >
      {THEMES.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={active === value}
          onClick={() => setTheme(value)}
          className={cn(
            "inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-foreground",
            active === value
              ? "bg-foreground font-medium text-background"
              : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
          )}
        >
          <Icon aria-hidden="true" className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
