"use client";

import { Check, Circle } from "lucide-react";
import { useLocale, t, type DictKey } from "@/lib/i18n";
import type { IntakeFieldKey, IntakeProgress } from "@/lib/prescription-store";

const ALL_FIELDS: IntakeFieldKey[] = [
  "what_business_does",
  "size",
  "customers",
  "pricing",
  "day_shape",
  "leak",
  "fire",
  "tools",
  "pretender",
  "wish",
  "no_go",
  "one_promise",
];

interface IntakeSidePanelProps {
  progress: IntakeProgress;
}

/**
 * Right rail — populates live as the AI emits mark_progress tool calls.
 *
 * Each of the 12 fields gets a row. Filled fields show the value; unfilled
 * ones show a gray placeholder dot so the owner sees the full shape of the
 * intake from turn 1 (sets expectation: 12 things, here's what we still
 * need).
 *
 * Editorial spacing, not a dashboard panel. Sticky so it stays visible as
 * the step box scrolls.
 */
export function IntakeSidePanel({ progress }: IntakeSidePanelProps) {
  const [locale] = useLocale();
  const filledMap = new Map(progress.fields.map((f) => [f.key, f.value]));

  return (
    <aside className="bg-cream-50 border border-cream-200 rounded-lg p-5 sticky top-6 max-h-[calc(100vh-3rem)] overflow-y-auto">
      <h3 className="mono text-xs uppercase tracking-wider text-zinc-600 mb-4">
        {t(locale, "wizard.side_title")}
      </h3>

      {progress.fields.length === 0 && (
        <p className="text-sm text-zinc-600 italic mb-4">
          {t(locale, "wizard.side_empty")}
        </p>
      )}

      <ul className="space-y-3">
        {ALL_FIELDS.map((key) => {
          const value = filledMap.get(key);
          const isFilled = Boolean(value);
          const labelKey = `wizard.field.${key}` as DictKey;
          return (
            <li key={key} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex-shrink-0">
                {isFilled ? (
                  <Check className="w-4 h-4 text-amber-600" aria-hidden />
                ) : (
                  <Circle className="w-4 h-4 text-cream-200" aria-hidden />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className={
                    isFilled
                      ? "mono text-[10px] uppercase tracking-wider text-zinc-600"
                      : "mono text-[10px] uppercase tracking-wider text-cream-200"
                  }
                >
                  {t(locale, labelKey)}
                </div>
                {isFilled && (
                  <div className="text-sm text-zinc-800 leading-snug mt-0.5">
                    {value}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
