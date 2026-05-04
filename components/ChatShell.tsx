"use client";

import { useChat } from "@ai-sdk/react";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ChatShellProps {
  skillName: string;
  initialPrompt?: string;
  /** Right-rail bullets — "What I've learned about you so far" */
  rightRailBullets?: string[];
}

export function ChatShell({ skillName, initialPrompt, rightRailBullets }: ChatShellProps) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `/api/skill/${skillName}`,
    initialMessages: initialPrompt
      ? [{ id: "init", role: "assistant" as const, content: initialPrompt }]
      : [],
    onError: (err) => {
      console.error("Chat error:", err);
    },
  });

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-12 max-w-5xl mx-auto px-6 py-12">
      {/* Conversation column */}
      <div className="max-w-prose">
        {/* The AI's messages render as PROSE, not chat bubbles — locked in mockup. */}
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
                you said
              </div>
            )}
            {/* Render text-only content. Tool calls are surfaced separately. */}
            {typeof m.content === "string" ? m.content : ""}
          </div>
        ))}

        {isLoading && (
          <div className="text-sm text-zinc-600">…</div>
        )}

        <div ref={endRef} />

        {/* Input form */}
        <form onSubmit={handleSubmit} className="mt-6">
          <textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Type your reply…"
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
            Continue
          </button>
        </form>
      </div>

      {/* Right rail — "What I've learned" — collapses on mobile */}
      {rightRailBullets && rightRailBullets.length > 0 && (
        <aside className="hidden lg:block bg-cream-50 border border-cream-200 rounded-md p-5 h-fit sticky top-12">
          <h3 className="mono text-xs uppercase tracking-wider text-zinc-600 mb-3">
            What I've learned about you so far
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
