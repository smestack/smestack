/**
 * POST /api/answers — write-only lead-capture endpoint.
 *
 * Called from the client whenever a lead-significant event happens:
 *   - intake completes (full conversation snapshot)
 *   - a prescription is approved / modified / rejected
 *   - the owner clicks "Request a quote" (path 2 on /prescriptions)
 *
 * Body matches LeadPayload from lib/leads.ts. The endpoint validates the
 * event type and forwards to the storage adapter.
 *
 * Returns: { ok: true, storage: 'kv' | 'local' } on success.
 *
 * No reads — by design. Reading leads happens out of band (Vercel dashboard,
 * `kv` CLI, or a one-off admin tool).
 */

import { NextRequest } from "next/server";
import { captureLead, type LeadPayload } from "@/lib/leads";

export const runtime = "nodejs";

const VALID_EVENTS = new Set([
  "intake_complete",
  "prescription_approved",
  "prescription_modified",
  "prescription_rejected",
  "quote_requested",
]);

export async function POST(req: NextRequest) {
  let body: Partial<LeadPayload>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.sessionId || typeof body.sessionId !== "string") {
    return Response.json({ ok: false, error: "sessionId required" }, { status: 400 });
  }
  if (!body.event || !VALID_EVENTS.has(body.event)) {
    return Response.json(
      { ok: false, error: `event must be one of: ${Array.from(VALID_EVENTS).join(", ")}` },
      { status: 400 }
    );
  }

  const payload: LeadPayload = {
    sessionId: body.sessionId,
    ts: new Date().toISOString(),
    event: body.event,
    conversation: body.conversation,
    prescription: body.prescription,
    meta: body.meta,
  };

  const result = await captureLead(payload);
  return Response.json(result);
}
