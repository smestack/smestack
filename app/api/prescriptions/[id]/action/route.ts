/**
 * POST /api/prescriptions/[id]/action — record approve/modify/reject.
 *
 * Body: { action: 'approve' | 'modify' | 'reject', payload?: string }
 *
 * On approve: marks the prescription as approved. The actual install handoff
 * (e.g., wiring up Gmail OAuth) is owner-driven and happens in the terminal
 * for v0 — we surface clear next-step instructions in the success state.
 */

import { NextRequest } from "next/server";
import { recordAction } from "@/lib/db";

const VALID = new Set(["approve", "modify", "reject"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const action = body.action;
  const payload = body.payload;

  if (!VALID.has(action)) {
    return Response.json(
      { ok: false, error: "Invalid action. Must be one of: approve, modify, reject." },
      { status: 400 }
    );
  }

  recordAction(id, action, payload);

  return Response.json({ ok: true });
}
