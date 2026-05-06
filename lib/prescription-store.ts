/**
 * Client-side prescription store. Lives in browser memory + localStorage.
 *
 * Replaces the previous server-side `prescriptions` table. The model emits
 * propose_prescription tool calls; useChat surfaces them in messages; we
 * extract them into this store; /prescriptions reads from here.
 *
 * Per-browser session ID is stable across refreshes (used for lead-capture
 * dedupe + as the primary key in the lead store).
 *
 * This module is client-only (uses localStorage + crypto.randomUUID via
 * window). All functions are no-ops on server-side.
 */

"use client";

import type { PrescriptionPayload } from "@/lib/db";

const STORAGE_KEY_SESSION = "mkbstack-session-id";
const STORAGE_KEY_PRESCRIPTIONS = "mkbstack-prescriptions";
const STORAGE_KEY_MESSAGES = "mkbstack-intake-messages";
const STORAGE_KEY_PROGRESS = "mkbstack-intake-progress";

export type PrescriptionAction = "approve" | "modify" | "reject" | null;

export interface ClientPrescription extends PrescriptionPayload {
  /** Stable per-card ID (the tool-call ID from useChat). */
  id: string;
  /** Owner's action on this card; null until they click. */
  status: PrescriptionAction extends infer S
    ? S extends null
      ? "pending"
      : S extends string
      ? S
      : never
    : never;
  createdAt: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getSessionId(): string {
  if (!isBrowser()) return "ssr-noop";
  let id = localStorage.getItem(STORAGE_KEY_SESSION);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY_SESSION, id);
  }
  return id;
}

export function clearSession(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY_SESSION);
  localStorage.removeItem(STORAGE_KEY_PRESCRIPTIONS);
  localStorage.removeItem(STORAGE_KEY_MESSAGES);
}

export function loadPrescriptions(): ClientPrescription[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(STORAGE_KEY_PRESCRIPTIONS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ClientPrescription[];
  } catch {
    return [];
  }
}

export function savePrescriptions(list: ClientPrescription[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY_PRESCRIPTIONS, JSON.stringify(list));
}

/**
 * Add a prescription if it's not already present (deduped by tool-call ID).
 * Returns the updated list.
 */
export function upsertPrescription(input: ClientPrescription): ClientPrescription[] {
  const list = loadPrescriptions();
  const idx = list.findIndex((p) => p.id === input.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...input };
  } else {
    list.push(input);
  }
  savePrescriptions(list);
  return list;
}

export function setPrescriptionStatus(
  id: string,
  status: ClientPrescription["status"]
): ClientPrescription[] {
  const list = loadPrescriptions();
  const idx = list.findIndex((p) => p.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], status };
    savePrescriptions(list);
  }
  return list;
}

// ─── Intake messages — backed up to localStorage so refresh doesn't lose them
export interface StoredMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool" | "data";
  content: string;
  toolCalls?: unknown;
}

export function loadMessages(): StoredMessage[] {
  if (!isBrowser()) return [];
  const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredMessage[];
  } catch {
    return [];
  }
}

export function saveMessages(messages: StoredMessage[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
}

// ─── Intake wizard progress ──────────────────────────────
// Populated from the model's mark_progress tool calls. Side panel reads
// from this; stepper reads currentStep + completedSteps.

export type IntakeFieldKey =
  | "what_business_does"
  | "size"
  | "customers"
  | "pricing"
  | "day_shape"
  | "leak"
  | "fire"
  | "tools"
  | "pretender"
  | "wish"
  | "no_go"
  | "one_promise";

export interface IntakeProgress {
  currentStep: number; // 1..12
  completedSteps: number[];
  fields: Array<{ key: IntakeFieldKey; value: string }>;
}

export const EMPTY_PROGRESS: IntakeProgress = {
  currentStep: 1,
  completedSteps: [],
  fields: [],
};

export const INTAKE_STEP_TOTAL = 12;

export function loadProgress(): IntakeProgress {
  if (!isBrowser()) return EMPTY_PROGRESS;
  const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
  if (!raw) return EMPTY_PROGRESS;
  try {
    return JSON.parse(raw) as IntakeProgress;
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(p: IntakeProgress): void {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(p));
}

// ─── Lead-capture client-side helper. Wraps fetch /api/answers.
export async function captureLeadEvent(payload: {
  event:
    | "intake_complete"
    | "prescription_proposed"
    | "prescription_approved"
    | "prescription_modified"
    | "prescription_rejected"
    | "quote_requested";
  conversation?: Array<{ role: string; content: string }>;
  prescription?: unknown;
  meta?: Record<string, unknown>;
}): Promise<void> {
  if (!isBrowser()) return;
  try {
    await fetch("/api/answers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: getSessionId(),
        ...payload,
      }),
    });
  } catch (err) {
    // Don't surface to UI — lead-capture failures shouldn't block UX.
    // Logged for dev visibility.
    console.error("[lead-capture] failed:", err);
  }
}
