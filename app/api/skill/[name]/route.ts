/**
 * /api/skill/[name] — pure stream proxy to Anthropic.
 *
 * Vercel-compatible. No server-side state. No SQLite. The conversation
 * history comes from useChat in the request body — that IS the source of
 * truth for messages. The server does only three things:
 *
 *   1. Load the SKILL.md from disk (read-only, no per-tenant data)
 *   2. Stream a Claude completion via Vercel AI SDK
 *   3. Surface tool calls (propose_prescription) so the client can render
 *      them inline
 *
 * Lead-capture (the answers themselves) lives in /api/answers, not here.
 *
 * Auth: BYOK on local (ANTHROPIC_API_KEY in .env). On Vercel, set
 * ANTHROPIC_API_KEY in the project env vars — that's MKBStack-paid for all
 * visitors. Cost surface ~$0.50 per intake at Haiku 4.5 BYOK rates.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool } from "ai";
import { z } from "zod";
import { NextRequest } from "next/server";
import { loadSkill } from "@/lib/skills";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const { messages: clientMessages } = await req.json();

  if (!Array.isArray(clientMessages) || clientMessages.length === 0) {
    return new Response("messages array required", { status: 400 });
  }

  let skillPrompt: string;
  try {
    skillPrompt = loadSkill(name);
  } catch {
    return new Response(`Skill not found: ${name}`, { status: 404 });
  }

  const modelId = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

  const result = streamText({
    model: anthropic(modelId),
    system: skillPrompt,
    messages: clientMessages,
    maxTokens: 4096,
    tools: {
      // Live-progress signal for the wizard UI. The model calls this AFTER
      // each substantive answer with: which step we're on, and what fields
      // were learned this turn. Side panel + stepper read from these calls.
      mark_progress: tool({
        description:
          "Call this at the END of every turn during /business-intake (after asking the next question in your prose response). Tells the wizard UI which step we're on and what business-profile fields were learned this turn. The 12 fixed steps map to the 12 questions in the SKILL.md.",
        parameters: z.object({
          currentStep: z
            .number()
            .min(1)
            .max(12)
            .describe(
              "The step the owner is currently being asked. 1=business_type, 2=size, 3=customers, 4=pricing, 5=day_shape, 6=leak, 7=fire, 8=tools, 9=pretender, 10=wish, 11=no_go, 12=one_promise"
            ),
          completedSteps: z
            .array(z.number().min(1).max(12))
            .describe(
              "Step numbers already answered, INCLUDING any smart-skipped ones. Cumulative — always pass the full list."
            ),
          fields: z
            .array(
              z.object({
                key: z.enum([
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
                ]),
                value: z
                  .string()
                  .describe(
                    "Short structured value (1-2 sentences max) suitable for a side-panel chip. NOT the full conversation paragraph — just the distilled fact in the owner's voice."
                  ),
              })
            )
            .describe(
              "Cumulative — always pass ALL fields known so far, not just the ones learned this turn. The wizard renders the full list in the side panel."
            ),
        }),
        execute: async () => ({ ok: true }),
      }),

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
          whatCouldGoWrong: z.string().describe("One-line honest risk in plain English."),
          whyForYou: z
            .string()
            .describe(
              "One-line citation: 'You said in the intake: \"<verbatim quote>\".' This justifies WHY this prescription, for this owner, right now."
            ),
          effort: z
            .enum(["S", "M", "L", "COMING_SOON"])
            .describe("S = quick, M = medium, L = long, COMING_SOON = stub card"),
          isStub: z.boolean().optional(),
          isCustomDesign: z.boolean().optional(),
          nextSteps: z
            .array(z.string())
            .min(2)
            .max(5)
            .describe(
              "2-5 short concrete bullets describing what the owner needs to do/provide for this to actually run in real life — credentials to obtain, accounts to set up, files to create, decisions to make. Specific to this owner's tools (e.g., 'Get a Moneybird API token from Settings > Integrations'). Surfaced on the card after approve. NOT optional — every prescription must include this so the owner has a clear next move after clicking Approve."
            ),
        }),
        // Server tool body intentionally minimal — the prescription is
        // rendered client-side from the tool-call payload. We just echo
        // back a confirmation so the model knows the card was rendered.
        execute: async () => ({
          ok: true,
          message: "Card rendered for the owner.",
        }),
      }),
    },
  });

  return result.toDataStreamResponse();
}
