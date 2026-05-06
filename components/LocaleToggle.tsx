"use client";

import { useLocale, t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * NL / EN toggle. Lives in page headers.
 *
 * Two pill-buttons; the active one is amber-filled. Persists to localStorage
 * via useLocale. Mobile-friendly: ≥44px combined height.
 */
export function LocaleToggle() {
  const [locale, setLocale] = useLocale();

  return (
    <div
      role="group"
      aria-label={t(locale, "toggle.aria")}
      className="inline-flex items-center border border-cream-200 rounded-md overflow-hidden"
    >
      <Pill active={locale === "nl"} label="NL" onClick={() => setLocale("nl")} />
      <span aria-hidden className="w-px self-stretch bg-cream-200" />
      <Pill active={locale === "en"} label="EN" onClick={() => setLocale("en")} />
    </div>
  );
}

function Pill({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "mono text-xs uppercase tracking-wider px-3 py-1.5 transition-colors",
        active
          ? "bg-amber-600 text-white"
          : "text-zinc-600 hover:bg-cream-50"
      )}
    >
      {label}
    </button>
  );
}
