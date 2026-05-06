"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, t } from "@/lib/i18n";
import { Stepper } from "@/components/Stepper";
import { IntakeSidePanel } from "@/components/IntakeSidePanel";
import {
  loadProgress,
  saveProgress,
  upsertPrescription,
  captureLeadEvent,
  EMPTY_PROGRESS,
  type IntakeProgress,
  type IntakeFieldKey,
} from "@/lib/prescription-store";
import type { PrescriptionPayload } from "@/lib/db";

interface IntakeFlowProps {
  /** Initial assistant question shown in the step box if there's no history. */
  initialPrompt: string;
  /** Skill name routed to /api/skill/[name]. */
  skillName: string;
}

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: unknown;
}

/**
 * State-of-the-art intake wizard.
 *
 * Replaces ChatShell on /intake. The owner sees ONE question at a time
 * (current step), types an answer in a single textarea, clicks Continue.
 * The side panel populates live from mark_progress tool calls, and the
 * stepper at the top shows where they are.
 *
 * useChat still drives the streaming under the hood — this is just a
 * different rendering of the same conversation. So the SKILL.md's
 * 12-question flow + smart-routing all work unchanged.
 *
 * Signals the wizard reads from useChat tool invocations:
 *   - mark_progress  → updates currentStep + completedSteps + fields
 *   - propose_prescription → triggers the intake-complete state, also
 *     pushes the card into the localStorage prescription store so
 *     /voorstellen can render it
 */
export function IntakeFlow({ initialPrompt, skillName }: IntakeFlowProps) {
  const [locale] = useLocale();
  const [progress, setProgress] = useState<IntakeProgress>(EMPTY_PROGRESS);

  // Hydrate progress from localStorage on mount (resumability).
  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const initialMessages = [
    { id: "init", role: "assistant" as const, content: initialPrompt },
  ];

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `/api/skill/${skillName}`,
    initialMessages,
    onError: (err) => console.error("Chat error:", err),
  });

  // Latest assistant text is the "current question" rendered in the step box.
  // Find the last assistant message that has non-empty text content.
  const currentQuestion = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant") {
        const text = typeof m.content === "string" ? m.content.trim() : "";
        if (text) return text;
      }
    }
    return initialPrompt;
  })();

  // Extract tool invocations from messages each render. Two channels:
  //   mark_progress → progress state
  //   propose_prescription → prescription store + lead event
  const firedProposalIdsRef = useRef<Set<string>>(new Set());
  const lastProgressKeyRef = useRef<string>("");
  const intakeCaptureFiredRef = useRef(false);

  useEffect(() => {
    let nextProgress: IntakeProgress | null = null;

    for (const m of messages) {
      const invocations = (m as { toolInvocations?: ToolInvocation[] })
        .toolInvocations;
      if (!invocations) continue;

      for (const inv of invocations) {
        if (inv.toolName === "mark_progress") {
          const args = inv.args as {
            currentStep?: number;
            completedSteps?: number[];
            fields?: Array<{ key: IntakeFieldKey; value: string }>;
          };
          if (typeof args.currentStep === "number") {
            nextProgress = {
              currentStep: args.currentStep,
              completedSteps: args.completedSteps ?? [],
              fields: args.fields ?? [],
            };
          }
          continue;
        }

        if (inv.toolName === "propose_prescription") {
          const args = inv.args as PrescriptionPayload;
          upsertPrescription({
            ...args,
            id: inv.toolCallId,
            status: "pending",
            createdAt: new Date().toISOString(),
          } as never);

          if (!firedProposalIdsRef.current.has(inv.toolCallId)) {
            firedProposalIdsRef.current.add(inv.toolCallId);
            captureLeadEvent({
              event: "prescription_proposed",
              prescription: { ...args, toolCallId: inv.toolCallId },
              conversation: messages.map((mm) => ({
                role: mm.role,
                content: typeof mm.content === "string" ? mm.content : "",
              })),
              meta: { locale, skillName },
            });
          }

          // First proposal also = intake_complete event.
          if (!intakeCaptureFiredRef.current) {
            intakeCaptureFiredRef.current = true;
            captureLeadEvent({
              event: "intake_complete",
              conversation: messages.map((mm) => ({
                role: mm.role,
                content: typeof mm.content === "string" ? mm.content : "",
              })),
              meta: { locale, skillName },
            });
          }
        }
      }
    }

    if (nextProgress) {
      const key = `${nextProgress.currentStep}|${nextProgress.completedSteps.join(",")}|${nextProgress.fields.length}`;
      if (key !== lastProgressKeyRef.current) {
        lastProgressKeyRef.current = key;
        setProgress(nextProgress);
        saveProgress(nextProgress);
      }
    }
  }, [messages, locale, skillName]);

  // Has at least one prescription been proposed? Then the intake is "done"
  // (the model finished asking questions and is now in handoff).
  const hasPrescriptions = messages.some((m) => {
    const invocations = (m as { toolInvocations?: ToolInvocation[] })
      .toolInvocations;
    return (
      invocations?.some((i) => i.toolName === "propose_prescription") ?? false
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 lg:py-12">
      {/* Stepper at the top */}
      <div className="mb-10">
        <Stepper
          currentStep={progress.currentStep}
          completedSteps={progress.completedSteps}
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-12">
        {/* Step box (main) */}
        <div className="max-w-prose">
          {!hasPrescriptions && (
            <article className="bg-white border border-cream-200 rounded-lg p-8 sm:p-10 shadow-sm">
              <div className="mono text-xs uppercase tracking-wider text-amber-700 mb-4">
                {t(locale, "wizard.step_of", progress.currentStep)}
              </div>
              <p className="text-xl sm:text-2xl text-zinc-800 leading-snug whitespace-pre-wrap">
                {currentQuestion}
              </p>

              {/* Answer box */}
              <form onSubmit={handleSubmit} className="mt-8">
                <textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder={t(locale, "wizard.placeholder")}
                  rows={4}
                  disabled={isLoading}
                  className="w-full p-4 border border-cream-200 rounded-md bg-white focus:outline-none focus:border-amber-600 transition-colors text-base leading-relaxed disabled:bg-cream-50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      handleSubmit(e as unknown as React.FormEvent);
                    }
                  }}
                />
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="min-h-[44px] px-6 py-3 rounded-md font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? t(locale, "wizard.thinking") : t(locale, "wizard.continue")}
                    </button>
                    <Link
                      href="/"
                      className="text-sm text-zinc-600 underline hover:text-amber-700"
                    >
                      {t(locale, "wizard.pause")}
                    </Link>
                  </div>
                  <span className="mono text-[11px] text-zinc-600">⌘ + ↵</span>
                </div>
              </form>
            </article>
          )}

          {hasPrescriptions && (
            <article className="bg-white border border-amber-200 rounded-lg p-8 sm:p-10 shadow-sm">
              <div className="mono text-xs uppercase tracking-wider text-amber-700 mb-4">
                {t(locale, "wizard.step_of", 12)}
              </div>
              <h2 className="text-2xl font-semibold leading-snug mb-3">
                {t(locale, "wizard.complete_title")}
              </h2>
              <p className="text-zinc-800 leading-relaxed mb-6">
                {t(locale, "wizard.complete_body")}
              </p>
              <Link
                href="/voorstellen"
                className="inline-block min-h-[44px] px-6 py-3 rounded-md font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              >
                {t(locale, "intake.header.proposals_link")}
              </Link>
            </article>
          )}
        </div>

        {/* Side panel */}
        <IntakeSidePanel progress={progress} />
      </div>
    </div>
  );
}
