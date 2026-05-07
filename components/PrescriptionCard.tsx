"use client";

import { useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale, t } from "@/lib/i18n";
import {
  findHandleiding,
  handleidingHref,
} from "@/lib/handleidingen-catalog";

export interface PrescriptionCardProps {
  id: string;
  proposedSkillName: string;
  headline: string;
  whatGetsAutomated: string[];
  dataFlow: { origin: string; destination: string };
  whatCouldGoWrong: string;
  whyForYou: string;
  effort: "S" | "M" | "L" | "COMING_SOON";
  isStub?: boolean;
  isCustomDesign?: boolean;
  /** What the owner needs to do/provide for this to actually run. Surfaced after approve. */
  nextSteps?: string[];
  status?: string;
  onAction?: (action: "approve" | "modify" | "reject", payload?: string) => Promise<void> | void;
}

export function PrescriptionCard(props: PrescriptionCardProps) {
  const [busy, setBusy] = useState(false);
  // Initial "done" state from props.status. Accepts either the new client
  // store convention ("approve"/"modify"/"reject") or the legacy server-side
  // convention ("approved"/"rejected") for backwards-compat with any
  // pre-existing data.
  const [done, setDone] = useState<string | null>(
    props.status === "approve" || props.status === "approved"
      ? "approve"
      : props.status === "reject" || props.status === "rejected"
      ? "reject"
      : null
  );
  const [locale] = useLocale();

  async function handle(action: "approve" | "modify" | "reject") {
    if (busy || done) return;
    setBusy(true);
    try {
      await props.onAction?.(action);
      setDone(action);
    } finally {
      setBusy(false);
    }
  }

  const isComingSoon = props.effort === "COMING_SOON" || props.isStub;

  const eyebrowLabel = props.isCustomDesign
    ? t(locale, "card.eyebrow.custom_design")
    : t(locale, "card.eyebrow.proposal");
  const comingSoonSuffix = isComingSoon ? ` — ${t(locale, "card.eyebrow.coming_soon")}` : "";

  return (
    <article className="prescription-card max-w-prose mx-auto my-8">
      {/* Title row */}
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <span className="mono text-xs uppercase tracking-wider text-zinc-600">
          {eyebrowLabel}
          {comingSoonSuffix}
        </span>
        <span className="mono text-xs text-zinc-600">{props.proposedSkillName}</span>
      </div>

      <h2 className="text-2xl font-semibold leading-snug mb-6">{props.headline}</h2>

      {/* What gets automated */}
      <h3 className="mono text-xs uppercase tracking-wider text-zinc-600 mb-2">
        {t(locale, "card.section.what_automated")}
      </h3>
      <ul className="space-y-1.5 mb-6 text-zinc-800">
        {props.whatGetsAutomated.map((bullet, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-amber-600 select-none">•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>

      {/* Data flow */}
      <h3 className="mono text-xs uppercase tracking-wider text-zinc-600 mb-2">
        {t(locale, "card.section.data_flow")}
      </h3>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="flow-chip">{props.dataFlow.origin}</span>
        <ArrowRight className="w-4 h-4 text-zinc-600" aria-hidden />
        <span className="flow-chip">{t(locale, "brand.name")}</span>
        <ArrowRight className="w-4 h-4 text-zinc-600" aria-hidden />
        <span className="flow-chip">{props.dataFlow.destination}</span>
      </div>

      {/* Risk callout */}
      <div className="risk-callout">
        <div className="mono text-xs uppercase tracking-wider text-amber-700 mb-1">
          {t(locale, "card.section.risk")}
        </div>
        <p className="text-sm text-zinc-800">{props.whatCouldGoWrong}</p>
      </div>

      {/* Why this, for you */}
      <h3 className="mono text-xs uppercase tracking-wider text-zinc-600 mb-2 mt-6">
        {t(locale, "card.section.why")}
      </h3>
      <p className="text-sm text-zinc-600 italic mb-6">{props.whyForYou}</p>

      {/* Action buttons */}
      {!isComingSoon && (
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
          <button
            type="button"
            onClick={() => handle("approve")}
            disabled={busy || !!done}
            aria-label={`${t(locale, "card.action.approve")} ${props.proposedSkillName}`}
            className={cn(
              "min-h-[44px] px-6 rounded-md font-medium transition-colors",
              "bg-amber-600 text-white hover:bg-amber-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              done === "approve" && "bg-amber-700"
            )}
          >
            {done === "approve"
              ? t(locale, "card.status.approved")
              : busy
              ? "..."
              : t(locale, "card.action.approve")}
          </button>
          <button
            type="button"
            onClick={() => handle("modify")}
            disabled={busy || !!done}
            aria-label={`${t(locale, "card.action.modify")} ${props.proposedSkillName}`}
            className={cn(
              "min-h-[44px] px-6 rounded-md font-medium transition-colors",
              "border border-cream-200 hover:bg-cream-50",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {t(locale, "card.action.modify")}
          </button>
          <button
            type="button"
            onClick={() => handle("reject")}
            disabled={busy || !!done}
            aria-label={`${t(locale, "card.action.reject")} ${props.proposedSkillName}`}
            className={cn(
              "min-h-[44px] px-6 rounded-md font-medium transition-colors",
              "border border-cream-200 hover:bg-cream-50 text-zinc-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              done === "reject" && "border-zinc-400"
            )}
          >
            {done === "reject"
              ? t(locale, "card.status.rejected")
              : t(locale, "card.action.reject")}
          </button>
        </div>
      )}

      {isComingSoon && (
        <div className="text-sm text-zinc-600 italic">
          {t(locale, "card.coming_soon.note")}
        </div>
      )}

      {done === "approve" && props.nextSteps && props.nextSteps.length > 0 && (
        <div className="mt-6 pt-6 border-t border-cream-200">
          <h3 className="mono text-xs uppercase tracking-wider text-amber-700 mb-3">
            {t(locale, "card.section.next_steps")}
          </h3>
          <ol className="space-y-2 text-sm text-zinc-800">
            {props.nextSteps.map((step, i) => (
              <NextStepItem key={i} index={i} step={step} locale={locale} />
            ))}
          </ol>
          <p className="mt-4 text-xs text-zinc-600 italic">
            {t(locale, "card.next_steps.outro")}
          </p>
        </div>
      )}

      {done === "approve" && (!props.nextSteps || props.nextSteps.length === 0) && (
        <div className="mt-4 text-xs text-zinc-600 mono">
          {t(locale, "card.approved.no_steps")}
        </div>
      )}

      {done === "modify" && (
        <div className="mt-4 text-xs text-zinc-600 mono">
          {t(locale, "card.modify.note")}
        </div>
      )}

      {done === "reject" && (
        <div className="mt-4 text-xs text-zinc-600 mono">
          {t(locale, "card.reject.note")}
        </div>
      )}
    </article>
  );
}

/**
 * Render one entry from nextSteps. If the AI referenced a handleiding
 * (via "/handleidingen/<slug>" or just "<slug>" matching the catalog),
 * render an accent link-card instead of a plain bullet — that's the
 * "click here to learn how to get the API token" affordance.
 */
function NextStepItem({
  index,
  step,
  locale,
}: {
  index: number;
  step: string;
  locale: "nl" | "en";
}) {
  const guide = findHandleiding(step);

  if (!guide) {
    return (
      <li className="flex gap-2">
        <span className="mono text-amber-600 select-none">{index + 1}.</span>
        <span>{step}</span>
      </li>
    );
  }

  const title = locale === "nl" ? guide.title_nl : guide.title_en;
  const duration = locale === "nl" ? guide.duration_nl : guide.duration_en;
  const cta = locale === "nl" ? "Open de handleiding" : "Open the guide";

  return (
    <li className="flex gap-2">
      <span className="mono text-amber-600 select-none">{index + 1}.</span>
      <a
        href={handleidingHref(guide.slug)}
        className="flex-1 flex items-start gap-3 -my-1 px-4 py-3 rounded-md border border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 transition-colors group"
      >
        <BookOpen
          className="w-4 h-4 text-amber-700 shrink-0 mt-0.5"
          aria-hidden
        />
        <span className="flex-1 leading-snug">
          <span className="block font-medium text-zinc-900">{title}</span>
          <span className="block text-xs text-zinc-600 mt-0.5">
            {duration} · {cta}{" "}
            <span aria-hidden className="group-hover:translate-x-0.5 inline-block transition-transform">
              →
            </span>
          </span>
        </span>
      </a>
    </li>
  );
}
