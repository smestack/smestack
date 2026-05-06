/**
 * Lead-capture write adapter.
 *
 * On Vercel: writes to @vercel/kv (Redis). The KV_REST_API_URL +
 * KV_REST_API_TOKEN env vars are auto-injected by Vercel when you attach a
 * KV store to the project.
 *
 * Local dev (no KV env): appends to workspace/leads.jsonl. Same payload
 * shape, queryable with `cat workspace/leads.jsonl | jq`.
 *
 * Why write-only: leads are append-only audit data. Reads happen out-of-band
 * (you query KV from the Vercel dashboard or a small script). The site
 * itself never reads from this store — keeps the lead pipeline isolated
 * from runtime correctness.
 *
 * Key shape on KV:
 *   leads:{ISO-timestamp}:{uuid}  → JSON payload (the full lead snapshot)
 *   leads:recent                  → list, push only, capped at 50 (for fast
 *                                   dashboard queries without scanning)
 */

import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const WORKSPACE_DIR = join(process.cwd(), "workspace");
const LEADS_PATH = join(WORKSPACE_DIR, "leads.jsonl");

export interface LeadPayload {
  /** Stable per-browser session ID, generated client-side. */
  sessionId: string;
  /** ISO timestamp when this lead event fired. */
  ts: string;
  /** What kind of write this is. */
  event:
    | "intake_complete"
    | "prescription_approved"
    | "prescription_modified"
    | "prescription_rejected"
    | "quote_requested";
  /**
   * Full intake conversation snapshot (the answers). Always present on
   * `intake_complete`; on prescription events, present if available.
   */
  conversation?: Array<{ role: string; content: string }>;
  /** The prescription card payload (full) for prescription_* events. */
  prescription?: unknown;
  /** Free-form fields the client wants to attach (locale, name, etc.). */
  meta?: Record<string, unknown>;
}

function isVercelKvAvailable(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function writeKv(payload: LeadPayload): Promise<void> {
  // Dynamic import so local dev (without @vercel/kv credentials) doesn't
  // crash on missing env at import time.
  const { kv } = await import("@vercel/kv");
  const key = `leads:${payload.ts}:${payload.sessionId}`;
  await Promise.all([
    kv.set(key, payload),
    // Push to a capped recent-list for fast dashboard queries.
    kv.lpush("leads:recent", key),
    kv.ltrim("leads:recent", 0, 49),
  ]);
}

function writeLocal(payload: LeadPayload): void {
  if (!existsSync(WORKSPACE_DIR)) {
    mkdirSync(WORKSPACE_DIR, { recursive: true });
  }
  appendFileSync(LEADS_PATH, JSON.stringify(payload) + "\n");
}

export async function captureLead(payload: LeadPayload): Promise<{ ok: true; storage: "kv" | "local" }> {
  if (isVercelKvAvailable()) {
    try {
      await writeKv(payload);
      return { ok: true, storage: "kv" };
    } catch (err) {
      // Don't lose the lead. If KV fails, write locally so we can replay.
      // (Local writes on Vercel land in /tmp and are ephemeral; this is a
      // best-effort on Vercel and a real persistence on local dev.)
      console.error("KV write failed; falling back to local:", err);
      writeLocal(payload);
      return { ok: true, storage: "local" };
    }
  }
  writeLocal(payload);
  return { ok: true, storage: "local" };
}
