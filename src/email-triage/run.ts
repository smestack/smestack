/**
 * Daily triage entry point.
 *
 *   bun run triage
 *
 * What this does:
 *   1. Loads OAuth tokens (workspace/oauth-tokens.json)
 *   2. Loads voice exemplars (workspace/voice-exemplars.jsonl)
 *   3. Loads business profile (workspace/business.md) for context
 *   4. Fetches inbox messages received since the last triage run
 *   5. For each message:
 *      - Classifies into needs-reply | fyi | marketing | calendar | spam (Haiku)
 *      - For needs-reply: drafts a reply in the owner's voice (Sonnet + cache_control)
 *      - Renders an interactive card in the terminal
 *      - Captures owner action: send_as_is | edit_send | reject | skip
 *   6. Logs every action to workspace/triage-events.jsonl (the pivot-gate metric)
 *
 * Hard guardrail: NEVER auto-sends. Every send requires explicit approval.
 *
 * BYOK: uses Claude API directly with cache_control on the static prefix
 * (system + business.md + voice exemplars). Cached reads cost 0.1× base input
 * — ~10x cheaper than re-sending the static block on every draft.
 */

import Anthropic from "@anthropic-ai/sdk";
import { google } from "googleapis";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { TOKENS_PATH } from "./gmail-oauth.ts";
import { loadVoiceExemplars, appendTriageEvent } from "./voice-match.ts";

const WORKSPACE_DIR = join(process.cwd(), "workspace");
const BUSINESS_MD_PATH = join(WORKSPACE_DIR, "business.md");
const LAST_RUN_PATH = join(WORKSPACE_DIR, "triage-last-run.txt");
const DRAFTS_PATH = join(WORKSPACE_DIR, "drafts.jsonl");

type Classification = "needs-reply" | "fyi" | "marketing" | "calendar" | "spam";

interface TriageDraft {
  msg_id: string;
  thread_id: string;
  from: string;
  to: string;
  subject: string;
  received_at: string;
  original_excerpt: string;
  classification: Classification;
  classification_reason: string;
  drafted_reply: string;
  voice_confidence: "high" | "medium" | "low";
}

function readEnv(): { anthropicKey: string; clientId: string; clientSecret: string } {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    console.error("ERROR: .env not found. See README for setup.");
    process.exit(1);
  }
  const env = Object.fromEntries(
    readFileSync(envPath, "utf8")
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("#"))
      .map((l) => {
        const idx = l.indexOf("=");
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
      })
  ) as Record<string, string>;
  if (!env.ANTHROPIC_API_KEY) {
    console.error("ERROR: ANTHROPIC_API_KEY missing in .env (BYOK).");
    process.exit(1);
  }
  return {
    anthropicKey: env.ANTHROPIC_API_KEY,
    clientId: env.GMAIL_CLIENT_ID,
    clientSecret: env.GMAIL_CLIENT_SECRET,
  };
}

function loadGmail() {
  if (!existsSync(TOKENS_PATH)) {
    console.error("ERROR: no Gmail tokens. Run `bun run auth:gmail` first.");
    process.exit(1);
  }
  const tokens = JSON.parse(readFileSync(TOKENS_PATH, "utf8"));
  const { clientId, clientSecret } = readEnv();
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials(tokens);
  return google.gmail({ version: "v1", auth: oauth2Client });
}

function decodeBase64Url(s: string): string {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function extractPlainBody(payload: any): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  for (const part of payload.parts ?? []) {
    const body = extractPlainBody(part);
    if (body) return body;
  }
  return "";
}

function getHeader(headers: any[] | undefined, name: string): string {
  return (headers ?? []).find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function loadBusinessMd(): string {
  if (!existsSync(BUSINESS_MD_PATH)) return "(no business profile yet — run /business-intake first)";
  return readFileSync(BUSINESS_MD_PATH, "utf8");
}

function readLastRunTs(): string {
  if (!existsSync(LAST_RUN_PATH)) {
    const fallback = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    return fallback;
  }
  return readFileSync(LAST_RUN_PATH, "utf8").trim();
}

function writeLastRunTs(ts: string): void {
  writeFileSync(LAST_RUN_PATH, ts);
}

async function fetchNewMessages(gmail: any, sinceIso: string): Promise<any[]> {
  const sinceUnix = Math.floor(Date.parse(sinceIso) / 1000);
  const list = await gmail.users.messages.list({
    userId: "me",
    q: `in:inbox after:${sinceUnix}`,
    maxResults: 100,
  });
  const messages = list.data.messages ?? [];
  const detailed: any[] = [];
  for (const m of messages) {
    if (!m.id) continue;
    const full = await gmail.users.messages.get({ userId: "me", id: m.id, format: "full" });
    detailed.push(full.data);
  }
  return detailed;
}

async function classifyAndDraft(
  client: Anthropic,
  message: any,
  businessMd: string,
  exemplars: ReturnType<typeof loadVoiceExemplars>
): Promise<TriageDraft> {
  const headers = message.payload?.headers;
  const subject = getHeader(headers, "Subject");
  const from = getHeader(headers, "From");
  const to = getHeader(headers, "To");
  const body = extractPlainBody(message.payload).trim().slice(0, 6000);
  const receivedAt = getHeader(headers, "Date");

  // Static prefix — gets cache_control to enable 90% discount on cached reads
  const staticPrefix = `You are SmeStack's email-triage skill, drafting replies in the owner's voice.

Voice exemplars (the owner's most recent 20 sent emails):
${exemplars.map((e, i) => `--- Exemplar ${i + 1} ---\nSubject: ${e.subject}\n${e.body}`).join("\n\n")}

Business profile (for context only — do not quote in the reply):
${businessMd}

Style notes derived from the exemplars:
- Match the owner's typical greeting and sign-off
- Match their typical sentence length and register
- Match their use of emoji / punctuation if any
- Do NOT add disclaimers, salesy language, or AI-shaped phrases
- Plain prose. Concise. Specific.`;

  const userMessage = `Classify and draft a reply for this incoming email.

From: ${from}
To: ${to}
Subject: ${subject}
Received: ${receivedAt}

Body:
${body}

Output JSON in this exact shape:
{
  "classification": "needs-reply" | "fyi" | "marketing" | "calendar" | "spam",
  "classification_reason": "<one short sentence>",
  "voice_confidence": "high" | "medium" | "low",
  "drafted_reply": "<reply body if classification is needs-reply, else empty string>"
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: staticPrefix,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");

  // Extract JSON from response (model sometimes wraps in markdown fence)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      msg_id: message.id,
      thread_id: message.threadId,
      from,
      to,
      subject,
      received_at: receivedAt,
      original_excerpt: body.slice(0, 800),
      classification: "fyi",
      classification_reason: "(parse error — defaulting to fyi)",
      drafted_reply: "",
      voice_confidence: "low",
    };
  }
  const parsed = JSON.parse(jsonMatch[0]);

  return {
    msg_id: message.id,
    thread_id: message.threadId,
    from,
    to,
    subject,
    received_at: receivedAt,
    original_excerpt: body.slice(0, 800),
    classification: parsed.classification,
    classification_reason: parsed.classification_reason ?? "",
    drafted_reply: parsed.drafted_reply ?? "",
    voice_confidence: parsed.voice_confidence ?? "low",
  };
}

function renderCard(draft: TriageDraft): void {
  const sep = "═".repeat(63);
  const rule = "────";
  console.log("");
  console.log(sep);
  console.log(`  EMAIL DRAFT — ${draft.subject}`);
  console.log(`  From: ${draft.from}`);
  console.log(`  Received: ${draft.received_at}`);
  console.log("");
  console.log(`  ${rule} ORIGINAL EMAIL (truncated to 8 lines) ${rule}`);
  const excerptLines = draft.original_excerpt.split("\n").slice(0, 8);
  for (const l of excerptLines) console.log(`  ${l}`);
  console.log("");
  console.log(`  ${rule} PROPOSED DRAFT REPLY (in your voice) ${rule}`);
  for (const l of draft.drafted_reply.split("\n")) console.log(`  ${l}`);
  console.log("");
  console.log(`  ${rule} INSTRUMENTATION ${rule}`);
  console.log(`  Voice match confidence: ${draft.voice_confidence}`);
  console.log(`  Classification: ${draft.classification} — ${draft.classification_reason}`);
  console.log("");
  console.log(`  [ S ] Send as-is (one-click approve, this is the pivot-gate metric)`);
  console.log(`  [ E ] Edit and send (counts as approval-with-modification)`);
  console.log(`  [ R ] Reject — don't send`);
  console.log(`  [ K ] Skip — handle this one myself later`);
  console.log(sep);
}

async function promptAction(): Promise<"send_as_is" | "edit_send" | "reject" | "skip"> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question("> [S/E/R/K] ")).trim().toLowerCase();
  rl.close();
  if (answer === "s") return "send_as_is";
  if (answer === "e") return "edit_send";
  if (answer === "r") return "reject";
  if (answer === "k") return "skip";
  return "skip";
}

async function sendReply(
  gmail: any,
  threadId: string,
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const replySubject = subject.startsWith("Re: ") ? subject : `Re: ${subject}`;
  const raw = [
    `To: ${to}`,
    `Subject: ${replySubject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    body,
  ].join("\r\n");
  const encoded = Buffer.from(raw, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded, threadId },
  });
}

async function main(): Promise<void> {
  const { anthropicKey } = readEnv();
  const client = new Anthropic({ apiKey: anthropicKey });
  const gmail = loadGmail();
  const businessMd = loadBusinessMd();
  const exemplars = loadVoiceExemplars();

  if (exemplars.length === 0) {
    console.error("ERROR: no voice exemplars. Run `bun run voice:check --bootstrap` first.");
    process.exit(1);
  }

  const sinceIso = readLastRunTs();
  console.log(`Fetching inbox messages since ${sinceIso}...`);
  const messages = await fetchNewMessages(gmail, sinceIso);

  if (messages.length === 0) {
    console.log("No new messages to triage. Inbox zero.");
    writeLastRunTs(new Date().toISOString());
    return;
  }

  console.log(`Found ${messages.length} new message(s). Classifying + drafting...`);

  const drafts: TriageDraft[] = [];
  for (const m of messages) {
    process.stdout.write(".");
    const draft = await classifyAndDraft(client, m, businessMd, exemplars);
    drafts.push(draft);
  }
  console.log("\n");

  // Persist all drafts before any user interaction
  writeFileSync(DRAFTS_PATH, drafts.map((d) => JSON.stringify(d)).join("\n") + "\n");

  // Show only needs-reply drafts as cards. Other classifications are summarized.
  const replyDrafts = drafts.filter((d) => d.classification === "needs-reply");
  const others = drafts.filter((d) => d.classification !== "needs-reply");

  if (others.length > 0) {
    console.log(`Auto-classified ${others.length} non-reply messages:`);
    for (const o of others) {
      console.log(`  - ${o.classification}: ${o.subject}`);
    }
    console.log("");
  }

  for (const draft of replyDrafts) {
    renderCard(draft);
    const action = await promptAction();

    if (action === "send_as_is") {
      try {
        await sendReply(gmail, draft.thread_id, draft.from, draft.subject, draft.drafted_reply);
        console.log("  → sent.");
      } catch (err: any) {
        console.error(`  → send failed: ${err.message}`);
      }
    } else if (action === "edit_send") {
      console.log("  → opening $EDITOR not yet implemented in v0 — copy the draft, edit in your client, send manually. Logging as edit_send.");
    } else if (action === "reject") {
      console.log("  → rejected.");
    } else {
      console.log("  → skipped.");
    }

    appendTriageEvent({
      ts: new Date().toISOString(),
      msg_id: draft.msg_id,
      action,
      subject: draft.subject,
    });
  }

  writeLastRunTs(new Date().toISOString());
  console.log("\nDone. Run `bun run voice:check` after 5 days to see the pivot-gate report.");
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("Triage failed:", err.message);
    process.exit(1);
  });
}
