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
          {props.isCustomDesign ? "skill design proposal" : "prescription"}
          {isComingSoon ? " — coming soon" : ""}
        </span>
        <span className="mono text-xs text-zinc-600">
          {props.proposedSkillName}
        </span>
      </div>

      <h2 className="text-2xl font-semibold leading-snug mb-6">
        {props.headline}
      </h2>

      {/* What gets automated */}
      <h3 className="mono text-xs uppercase tracking-wider text-zinc-600 mb-2">
        What gets automated
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
        Data flow
      </h3>
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="flow-chip">{props.dataFlow.origin}</span>
        <ArrowRight className="w-4 h-4 text-zinc-600" aria-hidden />
        <span className="flow-chip">SmeStack</span>
        <ArrowRight className="w-4 h-4 text-zinc-600" aria-hidden />
        <span className="flow-chip">{props.dataFlow.destination}</span>
      </div>

      {/* Risk callout */}
      <div className="risk-callout">
        <div className="mono text-xs uppercase tracking-wider text-amber-700 mb-1">
          risk
        </div>
        <p className="text-sm text-zinc-800">{props.whatCouldGoWrong}</p>
      </div>

      {/* Why this, for you */}
      <h3 className="mono text-xs uppercase tracking-wider text-zinc-600 mb-2 mt-6">
        Why this, for you
      </h3>
      <p className="text-sm text-zinc-600 italic mb-6">{props.whyForYou}</p>

      {/* Action buttons */}
      {!isComingSoon && (
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-2">
          <button
            type="button"
            onClick={() => handle("approve")}
            disabled={busy || !!done}
            aria-label={`Approve ${props.proposedSkillName} prescription`}
            className={cn(
              "min-h-[44px] px-6 rounded-md font-medium transition-colors",
              "bg-amber-600 text-white hover:bg-amber-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              done === "approve" && "bg-amber-700"
            )}
          >
            {done === "approve" ? "Approved" : busy ? "..." : "Approve"}
          </button>
          <button
            type="button"
            onClick={() => handle("modify")}
            disabled={busy || !!done}
            aria-label={`Modify ${props.proposedSkillName} prescription`}
            className={cn(
              "min-h-[44px] px-6 rounded-md font-medium transition-colors",
              "border border-cream-200 hover:bg-cream-50",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Modify
          </button>
          <button
            type="button"
            onClick={() => handle("reject")}
            disabled={busy || !!done}
            aria-label={`Reject ${props.proposedSkillName} prescription`}
            className={cn(
              "min-h-[44px] px-6 rounded-md font-medium transition-colors",
              "border border-cream-200 hover:bg-cream-50 text-zinc-600",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              done === "reject" && "border-zinc-400"
            )}
          >
            {done === "reject" ? "Rejected" : "Reject"}
          </button>
        </div>
      )}

      {isComingSoon && (
        <div className="text-sm text-zinc-600 italic">
          On the v0.5 roadmap. Run /smestack-prescription-engine again when it ships.
        </div>
      )}

      {done && (
        <div className="mt-4 text-xs text-zinc-600 mono">
          {done === "approve" && `→ approved. Next steps shown below.`}
          {done === "modify" && `→ modify mode. Tell the chat what to change.`}
          {done === "reject" && `→ rejected. Won't reappear unless you ask.`}
        </div>
      )}
    </article>
  );
}
