"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, t } from "@/lib/i18n";
import { INTAKE_STEP_TOTAL } from "@/lib/prescription-store";

interface StepperProps {
  currentStep: number;
  completedSteps: number[];
  total?: number;
}

/**
 * 12-dot horizontal progress stepper. Current step gets an amber filled
 * pill (because it's larger than the dots — gives the user a visible
 * "you are here"). Completed steps show a check. Future steps are bare
 * cream-colored circles.
 *
 * Mobile: horizontal scroll with snap, doesn't try to compress all 12 into
 * tiny dots that nobody can read.
 */
export function Stepper({ currentStep, completedSteps, total = INTAKE_STEP_TOTAL }: StepperProps) {
  const [locale] = useLocale();
  const completed = new Set(completedSteps);

  return (
    <div className="flex items-center gap-3">
      <span className="mono text-xs uppercase tracking-wider text-zinc-600 whitespace-nowrap">
        {t(locale, "wizard.step_of", currentStep)}
      </span>
      <ol
        role="list"
        aria-label={t(locale, "wizard.step_of", currentStep)}
        className="flex items-center gap-1.5"
      >
        {Array.from({ length: total }, (_, i) => i + 1).map((step) => {
          const isDone = completed.has(step);
          const isCurrent = step === currentStep;
          return (
            <li
              key={step}
              aria-current={isCurrent ? "step" : undefined}
              aria-label={`Step ${step}${isDone ? " (completed)" : isCurrent ? " (current)" : ""}`}
              className={cn(
                "flex items-center justify-center transition-all",
                isCurrent
                  ? "h-6 w-6 rounded-full bg-amber-600 text-white"
                  : isDone
                  ? "h-3 w-3 rounded-full bg-amber-600"
                  : "h-2 w-2 rounded-full bg-cream-200"
              )}
            >
              {isCurrent && (
                <span className="mono text-[10px] font-semibold leading-none">
                  {step}
                </span>
              )}
              {isDone && <Check className="w-2 h-2 text-white" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
