/**
 * /api/skill/[name] — the generic skill execution endpoint.
 *
 * Used by the chat shell on /intake and /prescriptions. Vercel AI SDK's
 * useChat hook on the client streams text from this endpoint.
 *
 * Eng-review locked architecture:
 *   - Loads SKILL.md (the prose system prompt)
 *   - Loads business.md (full profile in v0; per-skill manifest in v0.5+)
 *   - Loads conversation history from SQLite (server-side state model)
 *   - cache_control on the static prefix when on BYOK path (90% read discount)
 *   - Persists every assistant + user turn to SQLite
 *   - Tool: propose_prescription — emits a card the client renders
 */

import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool } from "ai";
import { z } from "zod";
import { NextRequest } from "next/server";
import {
  appendMessage,
  createPrescription,
  getOrCreateSkillRun,
  loadMessages,
} from "@/lib/db";
import { loadBusinessMd, loadSkill } from "@/lib/skills";

export const runtime = "nodejs";
export const maxDuration = 120;

// Auth path detection: BYOK if ANTHROPIC_API_KEY is in env, else assume CC OAuth.
// Eng-review locked: enable cache_control ONLY on BYOK path.
function isBYOK(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const { messages: clientMessages } = await req.json();

  // Get the latest user message from the client; the rest we have in SQLite.
  const userMsg = clientMessages.findLast((m: any) => m.role === "user");
  if (!userMsg) {
    return new Response("No user message in request", { status: 400 });
  }

  // Load (or create) the active skill run for this skill.
  const skillRunId = getOrCreateSkillRun(name);

  // Persist the new user turn.
  appendMessage(skillRunId, "user", userMsg.content);

  // Build the static prefix that gets cache_control on BYOK.
  let skillPrompt: string;
  try {
    skillPrompt = loadSkill(name);
  } catch (err: any) {
    return new Response(`Skill not found: ${name}`, { status: 404 });
  }
  const businessMd = loadBusinessMd();

  // System prompt = SKILL.md prose + current business profile.
  const systemPrompt = `${skillPrompt}\n\n## Current business profile (workspace/business.md)\n\n${businessMd}`;

  // TODO(v0.5): re-enable Anthropic prompt caching on the static prefix.
  // AI SDK 4.x expects system as a string (not the [{text, cache_control}] block
  // shape that the raw Anthropic SDK accepts). To get the 90% cached-read
  // discount in this setup, switch to providerOptions.anthropic.cacheControl
  // on a CoreMessage, or pin the static prefix into a leading user message.
  // Documented in CEO plan as a v0.5 cost optimization. Skipped for v0.
  void isBYOK;

  // Reload full message history from SQLite (server-side state — eng-review locked).
  const stored = loadMessages(skillRunId);

  // Model: configurable via ANTHROPIC_MODEL env var. Default Haiku 4.5
  // (cheaper + faster + good enough for the consultant intake voice).
  const modelId = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

  // Stream the model response.
  const result = streamText({
    model: anthropic(modelId),
    system: systemPrompt,
    messages: stored.map((m) => ({ role: m.role as any, content: m.content })),
    maxTokens: 4096,
    tools: {
      propose_prescription: tool({
        description:
          "Propose a prescription card for the owner to review. Use this when you've identified a specific, narrow, risk-assessed automation worth installing. Each card is shown to the owner one at a time with Approve / Modify / Reject buttons.",
        parameters: z.object({
          proposedSkillName: z
            .string()
            .describe("kebab-case skill name, e.g. 'email-triage' or 'hours-sentinel'"),
          headline: z
            .string()
            .describe(
              "One-sentence headline in plain English. Specific to this owner. Reference a quote or fact from their profile."
            ),
          whatGetsAutomated: z
            .array(z.string())
            .describe("3 bullets describing what the AI does"),
          dataFlow: z.object({
            origin: z.string().describe("e.g. 'Gmail inbox' or 'WhatsApp message'"),
            destination: z.string().describe("e.g. 'drafted reply' or 'daily timesheet'"),
          }),
          whatCouldGoWrong: z
            .string()
            .describe("One-line honest risk in plain English."),
          whyForYou: z
            .string()
            .describe(
              "One-line citation: 'You said in the intake: \"<verbatim quote>\".' This justifies WHY this prescription, for this owner, right now."
            ),
          effort: z.enum(["S", "M", "L", "COMING_SOON"]).describe("S = quick, M = medium, L = long, COMING_SOON = stub card"),
          isStub: z
            .boolean()
            .optional()
            .describe("True if this is a 'coming soon' stub from the catalog."),
          isCustomDesign: z
            .boolean()
            .optional()
            .describe("True if this is a custom skill being designed via skill-design."),
        }),
        execute: async (input) => {
          const id = createPrescription(skillRunId, input);
          return { ok: true, prescriptionId: id, message: "Card rendered to owner. Awaiting their action." };
        },
      }),
    },
    onFinish: ({ text }) => {
      // Persist the assistant turn after the stream completes.
      if (text) {
        appendMessage(skillRunId, "assistant", text);
      }
    },
  });

  return result.toDataStreamResponse();
}
