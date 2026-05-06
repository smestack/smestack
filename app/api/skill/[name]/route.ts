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
