/**
 * Voice-match: pull the owner's last 200 sent emails, write the most-recent 20
 * (with subject + body) to workspace/voice-exemplars.jsonl. These exemplars
 * are the few-shot examples for every drafted reply.
 *
 * Modes:
 *   bun run voice:check --bootstrap   first-time scan, writes exemplars
 *   bun run voice:check               5-day pivot-gate report from triage-events.jsonl
 *
 * The pivot gate (locked in design doc): approve-without-modification rate
 * over 5 days >= 40% on the builder's own inbox = email-triage is the v0
 * hero. < 40% = pivot to meeting-notes-summarizer.
 */

import { google, gmail_v1 } from "googleapis";
import { writeFileSync, readFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { TOKENS_PATH } from "./gmail-oauth.ts";

const WORKSPACE_DIR = join(process.cwd(), "workspace");
const EXEMPLARS_PATH = join(WORKSPACE_DIR, "voice-exemplars.jsonl");
const TRIAGE_EVENTS_PATH = join(WORKSPACE_DIR, "triage-events.jsonl");

const VOICE_EXEMPLAR_COUNT = 20;
const SCAN_BATCH_SIZE = 200;

interface VoiceExemplar {
  id: string;
  subject: string;
  body: string;
  to: string;
  date: string;
}

interface TriageEvent {
  ts: string;
  msg_id: string;
  action: "send_as_is" | "edit_send" | "reject" | "skip";
  subject: string;
}

function loadGmailClient(): gmail_v1.Gmail {
  if (!existsSync(TOKENS_PATH)) {
    console.error(
      "ERROR: no Gmail tokens found. Run `bun run auth:gmail` first."
    );
    process.exit(1);
  }
  const tokens = JSON.parse(readFileSync(TOKENS_PATH, "utf8"));
  const envPath = join(process.cwd(), ".env");
  const env = Object.fromEntries(
    readFileSync(envPath, "utf8")
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("#"))
      .map((l) => {
        const idx = l.indexOf("=");
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
      })
  ) as Record<string, string>;
  const oauth2Client = new google.auth.OAuth2(
    env.GMAIL_CLIENT_ID,
    env.GMAIL_CLIENT_SECRET
  );
  oauth2Client.setCredentials(tokens);
  return google.gmail({ version: "v1", auth: oauth2Client });
}

function decodeBase64Url(s: string): string {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function extractPlainBody(payload: gmail_v1.Schema$MessagePart | undefined): string {
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

function getHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string {
  return (headers ?? []).find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

async function bootstrapExemplars(): Promise<void> {
  console.log(`Pulling your last ${SCAN_BATCH_SIZE} sent emails...`);
  const gmail = loadGmailClient();

  const list = await gmail.users.messages.list({
    userId: "me",
    q: "in:sent",
    maxResults: SCAN_BATCH_SIZE,
  });
  const messages = list.data.messages ?? [];
  if (messages.length < VOICE_EXEMPLAR_COUNT) {
    console.warn(
      `Only ${messages.length} sent emails found. Need at least ${VOICE_EXEMPLAR_COUNT} for confident voice-match.`
    );
    console.warn(
      "Continuing in degraded mode — drafts will use generic-but-professional tone until your sent folder grows."
    );
  }

  const exemplars: VoiceExemplar[] = [];
  for (const msg of messages.slice(0, VOICE_EXEMPLAR_COUNT)) {
    if (!msg.id) continue;
    const full = await gmail.users.messages.get({ userId: "me", id: msg.id, format: "full" });
    const headers = full.data.payload?.headers;
    const body = extractPlainBody(full.data.payload);
    if (!body || body.length < 30) continue;
    exemplars.push({
      id: msg.id,
      subject: getHeader(headers, "Subject") || "(no subject)",
      body: body.trim().slice(0, 4000),
      to: getHeader(headers, "To") || "",
      date: getHeader(headers, "Date") || "",
    });
  }

  writeFileSync(
    EXEMPLARS_PATH,
    exemplars.map((e) => JSON.stringify(e)).join("\n") + "\n"
  );
  console.log(`Wrote ${exemplars.length} voice exemplars to ${EXEMPLARS_PATH}.`);
  console.log("Next: `bun run triage` to run the daily classify+draft pass.");
}

function readTriageEvents(): TriageEvent[] {
  if (!existsSync(TRIAGE_EVENTS_PATH)) return [];
  return readFileSync(TRIAGE_EVENTS_PATH, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as TriageEvent);
}

function pivotGateReport(): void {
  const events = readTriageEvents();
  if (events.length === 0) {
    console.log("No triage events yet. Run `bun run triage` first.");
    return;
  }

  const now = Date.now();
  const fiveDaysAgo = now - 5 * 24 * 60 * 60 * 1000;
  const recent = events.filter((e) => Date.parse(e.ts) >= fiveDaysAgo);

  if (recent.length === 0) {
    console.log("No triage events in the last 5 days. Run `bun run triage` to populate.");
    return;
  }

  const totals = {
    send_as_is: recent.filter((e) => e.action === "send_as_is").length,
    edit_send: recent.filter((e) => e.action === "edit_send").length,
    reject: recent.filter((e) => e.action === "reject").length,
    skip: recent.filter((e) => e.action === "skip").length,
  };
  const drafts = recent.length;
  const approveWithoutModRate = drafts > 0 ? (totals.send_as_is / drafts) * 100 : 0;
  const passes = approveWithoutModRate >= 40;

  const sortedTs = recent.map((e) => Date.parse(e.ts)).sort();
  const startDate = new Date(sortedTs[0] ?? now).toISOString().slice(0, 10);
  const endDate = new Date(sortedTs[sortedTs.length - 1] ?? now).toISOString().slice(0, 10);

  const pct = (n: number) => drafts > 0 ? `${((n / drafts) * 100).toFixed(0)}%` : "0%";

  console.log("");
  console.log("─────────────────────────────────────────────────────────────");
  console.log("  PIVOT GATE — 5-day voice-match self-test");
  console.log("");
  console.log(`  Period:                ${startDate} → ${endDate}`);
  console.log(`  Drafts emitted:        ${drafts}`);
  console.log(`  Send-as-is:            ${totals.send_as_is} (${pct(totals.send_as_is)})`);
  console.log(`  Edit-and-send:         ${totals.edit_send} (${pct(totals.edit_send)})`);
  console.log(`  Rejected:              ${totals.reject}`);
  console.log(`  Skipped:               ${totals.skip}`);
  console.log("");
  console.log(`  Approve-without-modification rate: ${approveWithoutModRate.toFixed(1)}%`);
  console.log(`  Pivot gate threshold (>= 40%):     ${passes ? "PASS" : "FAIL"}`);
  console.log("");
  console.log("  ────");
  if (passes) {
    console.log("  IF PASS: ship it. Email-triage is the v0 hero.");
  } else {
    console.log("  IF FAIL: pivot to meeting-notes-summarizer (v0 fallback).");
  }
  console.log("─────────────────────────────────────────────────────────────");
  console.log("");
}

export function loadVoiceExemplars(): VoiceExemplar[] {
  if (!existsSync(EXEMPLARS_PATH)) return [];
  return readFileSync(EXEMPLARS_PATH, "utf8")
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l) as VoiceExemplar);
}

export function appendTriageEvent(event: TriageEvent): void {
  appendFileSync(TRIAGE_EVENTS_PATH, JSON.stringify(event) + "\n");
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args.includes("--bootstrap")) {
    bootstrapExemplars().catch((err) => {
      console.error("Bootstrap failed:", err.message);
      process.exit(1);
    });
  } else {
    pivotGateReport();
  }
}
