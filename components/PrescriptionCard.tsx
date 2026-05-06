"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [done, setDone] = useState<string | null>(props.status === "approved" ? "approve" : props.status === "rejected" ? "reject" : null);

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

  return (
    <article className="prescription-card max-w-prose mx-auto my-8">
      {/* Title row */}
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <span className="mono text-xs uppercase tracking-wider text-zinc-600">
          {props.isCustomDesign ? "voorstel op maat" : "voorstel"}
          {isComingSoon ? " — binnenkort" : ""}
        </span>
        <span className="mono text-xs text-zinc-600">
          {props.proposedSkillName}
        </span>
      </div>

      <h2 className="text-2xl font-semibold leading-snug mb-6">
        {props.headline}
      </h2>

      {/* Wat wordt geautomatiseerd */}
      <h3 className="mono text-xs uppercase tracking-wider text-zinc-600 mb-2">
        Wat wordt geautomatiseerd
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
        Data­stroom
      </h3>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="flow-chip">{props.dataFlow.origin}</span>
        <ArrowRight className="w-4 h-4 text-zinc-600" aria-hidden />
        <span className="flow-chip">MKBStack</span>
        <ArrowRight className="w-4 h-4 text-zinc-600" aria-hidden />
        <span className="flow-chip">{props.dataFlow.destination}</span>
      </div>

      {/* Risico callout */}
      <div className="risk-callout">
        <div className="mono text-xs uppercase tracking-wider text-amber-700 mb-1">
          risico
        </div>
        <p className="text-sm text-zinc-800">{props.whatCouldGoWrong}</p>
      </div>

      {/* Why this, for you */}
      <h3 className="mono text-xs uppercase tracking-wider text-zinc-600 mb-2 mt-6">
        Waarom dit, voor jou
      </h3>
      <p className="text-sm text-zinc-600 italic mb-6">{props.whyForYou}</p>

      {/* Action buttons */}
      {!isComingSoon && (
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
          <button
            type="button"
            onClick={() => handle("approve")}
            disabled={busy || !!done}
            aria-label={`Goedkeuren ${props.proposedSkillName}`}
            className={cn(
              "min-h-[44px] px-6 rounded-md font-medium transition-colors",
              "bg-amber-600 text-white hover:bg-amber-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              done === "approve" && "bg-amber-700"
            )}
          >
            {done === "approve" ? "Goedgekeurd" : busy ? "..." : "Goedkeuren"}
          </button>
          <button
            type="button"
            onClick={() => handle("modify")}
            disabled={busy || !!done}
            aria-label={`Aanpassen ${props.proposedSkillName}`}
            className={cn(
              "min-h-[44px] px-6 rounded-md font-medium transition-colors",
              "border border-cream-200 hover:bg-cream-50",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Aanpassen
          </button>
          <button
            type="button"
            onClick={() => handle("reject")}
            disabled={busy || !!done}
            aria-label={`Afwijzen ${props.proposedSkillName}`}
            className={cn(
              "min-h-[44px] px-6 rounded-md font-medium transition-colors",
              "border border-cream-200 hover:bg-cream-50 text-zinc-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              done === "reject" && "border-zinc-400"
            )}
          >
            {done === "reject" ? "Afgewezen" : "Afwijzen"}
          </button>
        </div>
      )}

      {isComingSoon && (
        <div className="text-sm text-zinc-600 italic">
          Op de v0.5 roadmap. Voer /mkbstack-prescription-engine opnieuw uit als deze beschikbaar is.
        </div>
      )}

      {done === "approve" && props.nextSteps && props.nextSteps.length > 0 && (
        <div className="mt-6 pt-6 border-t border-cream-200">
          <h3 className="mono text-xs uppercase tracking-wider text-amber-700 mb-3">
            Volgende stappen
          </h3>
          <ul className="space-y-2 text-sm text-zinc-800">
            {props.nextSteps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="mono text-amber-600 select-none">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-zinc-600 italic">
            Pak ze in je eigen tempo op. Niets gaat live tot jij groen licht geeft.
          </p>
        </div>
      )}

      {done === "approve" && (!props.nextSteps || props.nextSteps.length === 0) && (
        <div className="mt-4 text-xs text-zinc-600 mono">
          → goedgekeurd. (Volgende stappen worden getoond zodra ze beschikbaar zijn.)
        </div>
      )}

      {done === "modify" && (
        <div className="mt-4 text-xs text-zinc-600 mono">
          → wijzig-modus. Vertel in de chat wat er moet veranderen.
        </div>
      )}

      {done === "reject" && (
        <div className="mt-4 text-xs text-zinc-600 mono">
          → afgewezen. Komt niet terug tenzij je het vraagt.
        </div>
      )}
    </article>
  );
}
