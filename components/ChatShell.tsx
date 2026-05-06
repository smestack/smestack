"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLocale, t } from "@/lib/i18n";
import {
  loadMessages as loadStoredMessages,
  saveMessages,
  upsertPrescription,
  captureLeadEvent,
} from "@/lib/prescription-store";
import type { PrescriptionPayload } from "@/lib/db";

export interface ChatShellProps {
  skillName: string;
  initialPrompt?: string;
  /** Right-rail bullets — "What I've learned about you so far" */
  rightRailBullets?: string[];
}

export function ChatShell({ skillName, initialPrompt, rightRailBullets }: ChatShellProps) {
  const [locale] = useLocale();

  // Load any persisted messages from a previous session (resumability).
  // Falls back to the initialPrompt if there's nothing stored.
  const stored = typeof window !== "undefined" ? loadStoredMessages() : [];
  const initialMessages =
    stored.length > 0
      ? (stored as any)
      : initialPrompt
      ? [{ id: "init", role: "assistant" as const, content: initialPrompt }]
      : [];

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `/api/skill/${skillName}`,
    initialMessages,
    onError: (err) => {
      console.error("Chat error:", err);
    },
  });

  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Persist message history to localStorage on every update — enables refresh
  // without losing the conversation.
  useEffect(() => {
    if (messages.length > 0) {
      saveMessages(
        messages.map((m) => ({
          id: m.id,
          role: m.role as any,
          content: typeof m.content === "string" ? m.content : "",
          toolCalls: (m as any).toolInvocations,
        }))
      );
    }
  }, [messages]);

  // Extract propose_prescription tool calls into the client prescription
  // store. Each tool invocation becomes a card that /voorstellen renders.
  // Also fire a `prescription_proposed` lead event PER unique tool call so
  // the founders see in KV every proposal the model made (even unapproved).
  // Dedupe by toolCallId so React StrictMode + re-renders don't double-fire.
  const firedProposalIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const m of messages) {
      const invocations = (m as any).toolInvocations as
        | Array<{
            toolCallId: string;
            toolName: string;
            args: PrescriptionPayload;
          }>
        | undefined;
      if (!invocations) continue;
      for (const inv of invocations) {
        if (inv.toolName !== "propose_prescription") continue;
        upsertPrescription({
          ...inv.args,
          id: inv.toolCallId,
          status: "pending",
          createdAt: new Date().toISOString(),
        } as any);

        // First time we see this tool-call ID? Fire the lead event.
        if (!firedProposalIdsRef.current.has(inv.toolCallId)) {
          firedProposalIdsRef.current.add(inv.toolCallId);
          captureLeadEvent({
            event: "prescription_proposed",
            prescription: { ...inv.args, toolCallId: inv.toolCallId },
            conversation: messages.map((mm) => ({
              role: mm.role,
              content: typeof mm.content === "string" ? mm.content : "",
            })),
            meta: { locale, skillName },
          });
        }
      }
    }
  }, [messages, locale, skillName]);

  // When the model says the intake is complete, fire a lead-capture event.
  // Heuristic: the model emitted a propose_prescription tool call AND
  // hasn't done so before in this useChat instance. (More reliable detection
  // would require the model to emit a dedicated 'intake_complete' tool —
  // worth adding to SKILL.md in v0.6.)
  const captureFiredRef = useRef(false);
  useEffect(() => {
    if (captureFiredRef.current) return;
    const hasProposal = messages.some((m: any) =>
      (m.toolInvocations ?? []).some(
        (i: { toolName: string }) => i.toolName === "propose_prescription"
      )
    );
    if (hasProposal) {
      captureFiredRef.current = true;
      captureLeadEvent({
        event: "intake_complete",
        conversation: messages.map((m) => ({
          role: m.role,
          content: typeof m.content === "string" ? m.content : "",
        })),
        meta: { locale, skillName },
      });
    }
  }, [messages, locale, skillName]);

  // Has the model proposed at least one prescription? Surface a link so the
  // user knows where to look.
  const hasPrescriptions = messages.some((m: any) =>
    (m.toolInvocations ?? []).some(
      (i: { toolName: string }) => i.toolName === "propose_prescription"
    )
  );

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-12 max-w-5xl mx-auto px-6 py-12">
      {/* Conversation column */}
      <div className="max-w-prose">
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "mb-8 leading-relaxed",
              m.role === "assistant" ? "text-zinc-800" : "text-zinc-600 italic"
            )}
          >
            {m.role === "user" && (
              <div className="mono text-xs uppercase tracking-wider text-zinc-600 mb-1">
                {t(locale, "common.you_said")}
              </div>
            )}
            {typeof m.content === "string" ? m.content : ""}
          </div>
        ))}

        {/* When prescriptions exist, show a soft inline pointer to /voorstellen. */}
        {hasPrescriptions && (
          <div className="mb-8 p-4 border border-amber-200 bg-amber-50 rounded-md text-sm">
            <p className="text-zinc-800 mb-2">
              {locale === "nl"
                ? "Ik heb concrete voorstellen voor je klaargezet."
                : "I've prepared some concrete proposals for you."}
            </p>
            <Link
              href="/voorstellen"
              className="text-amber-700 underline hover:text-amber-800"
            >
              {locale === "nl"
                ? "Bekijk de voorstellen →"
                : "View the proposals →"}
            </Link>
          </div>
        )}

        {isLoading && <div className="text-sm text-zinc-600">…</div>}

        <div ref={endRef} />

        {/* Input form */}
        <form onSubmit={handleSubmit} className="mt-6">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder={t(locale, "common.input_placeholder")}
            rows={3}
            className="w-full p-4 border border-cream-200 rounded-md bg-white focus:outline-none focus:border-amber-600 transition-colors text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as any);
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="mt-3 min-h-[44px] px-6 rounded-md font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {t(locale, "common.continue")}
          </button>
        </form>
      </div>

      {/* Right rail — "What I've learned" — collapses on mobile */}
      {rightRailBullets && rightRailBullets.length > 0 && (
        <aside className="hidden lg:block bg-cream-50 border border-cream-200 rounded-md p-5 h-fit sticky top-12">
          <h3 className="mono text-xs uppercase tracking-wider text-zinc-600 mb-3">
            {t(locale, "common.right_rail_title")}
          </h3>
          <ul className="space-y-2 text-sm text-zinc-800">
            {rightRailBullets.map((b, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-600 select-none">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
