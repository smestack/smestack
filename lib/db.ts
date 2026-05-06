/**
 * SQLite persistence — workspace/messages.db
 *
 * Schema is small and explicit. P1 = single owner ("local-user").
 * In P2 (hosted), owner_id becomes per-tenant.
 *
 * Tables:
 *   skill_runs    one row per /skill invocation (intake start, etc.)
 *   messages      conversation history per skill run
 *   prescriptions cards proposed by the model
 *   actions       owner actions on cards (approve/modify/reject)
 *
 * The eng review locked: server-side messages table, loaded each turn.
 * That's what this module enables.
 */

import Database from "better-sqlite3";
import type { Database as DatabaseType } from "better-sqlite3";
import { join } from "node:path";
import { mkdirSync, existsSync } from "node:fs";

// NOTE: switched from bun:sqlite to better-sqlite3 in v0.1.
// Reason: Next.js dev/build runs under Node, not the Bun runtime — even
// though `bun run dev` is the launcher. `bun:sqlite` is unavailable to
// Node-loaded modules, so the API routes throw "Cannot find module
// 'bun:sqlite'". better-sqlite3 has identical performance characteristics
// for our query shape and works on both runtimes. The eng-review's bun:sqlite
// decision is overturned; documented as v0.1 amendment.

const WORKSPACE_DIR = join(process.cwd(), "workspace");
const DB_PATH = join(WORKSPACE_DIR, "messages.db");

if (!existsSync(WORKSPACE_DIR)) {
  mkdirSync(WORKSPACE_DIR, { recursive: true });
}

let _db: DatabaseType | null = null;

export function db(): DatabaseType {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS skill_runs (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL DEFAULT 'local-user',
      skill_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_run_id TEXT NOT NULL REFERENCES skill_runs(id),
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      ts TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_run ON messages(skill_run_id, id);

    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      skill_run_id TEXT NOT NULL REFERENCES skill_runs(id),
      proposed_skill_name TEXT NOT NULL,
      headline TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prescription_id TEXT NOT NULL REFERENCES prescriptions(id),
      action TEXT NOT NULL,
      payload TEXT,
      ts TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return _db;
}

// ─── skill_runs ──────────────────────────────────────────

export function getOrCreateSkillRun(skillName: string, ownerId: string = "local-user"): string {
  const _db = db();
  const existing = _db
    .prepare(
      "SELECT id FROM skill_runs WHERE skill_name = ? AND owner_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1"
    )
    .get(skillName, ownerId) as { id: string } | undefined;

  if (existing) return existing.id;

  const id = crypto.randomUUID();
  _db
    .prepare("INSERT INTO skill_runs (id, owner_id, skill_name) VALUES (?, ?, ?)")
    .run(id, ownerId, skillName);
  return id;
}

export function completeSkillRun(skillRunId: string): void {
  db()
    .prepare("UPDATE skill_runs SET status = 'completed' WHERE id = ?")
    .run(skillRunId);
}

// ─── messages ──────────────────────────────────────────

export interface StoredMessage {
  role: "user" | "assistant" | "tool";
  content: string;
}

export function loadMessages(skillRunId: string): StoredMessage[] {
  return db()
    .prepare("SELECT role, content FROM messages WHERE skill_run_id = ? ORDER BY id ASC")
    .all(skillRunId) as StoredMessage[];
}

export function appendMessage(skillRunId: string, role: string, content: string): void {
  db()
    .prepare("INSERT INTO messages (skill_run_id, role, content) VALUES (?, ?, ?)")
    .run(skillRunId, role, content);
}

// ─── prescriptions ──────────────────────────────────────────

export interface PrescriptionPayload {
  proposedSkillName: string;
  headline: string;
  whatGetsAutomated: string[];
  dataFlow: { origin: string; destination: string };
  whatCouldGoWrong: string;
  whyForYou: string;
  effort: "S" | "M" | "L" | "COMING_SOON";
  isStub?: boolean;
  isCustomDesign?: boolean;
  /**
   * What the owner needs to do/provide for this to actually run in real life.
   * Surfaced inline on the prescription card after approve.
   * 2-5 short concrete bullets, not a wall of text.
   * Examples:
   *   "Set up a Twilio sandbox WhatsApp number (~10 min)"
   *   "Paste your Moneybird API token in .env"
   *   "Add your three plumbers' phone numbers to workspace/roster.json"
   * Optional — older prescriptions persisted without this field.
   */
  nextSteps?: string[];
}

export function createPrescription(skillRunId: string, payload: PrescriptionPayload): string {
  const id = crypto.randomUUID();
  db()
    .prepare(
      "INSERT INTO prescriptions (id, skill_run_id, proposed_skill_name, headline, payload) VALUES (?, ?, ?, ?, ?)"
    )
    .run(id, skillRunId, payload.proposedSkillName, payload.headline, JSON.stringify(payload));
  return id;
}

export function listPrescriptions(skillRunId: string): Array<PrescriptionPayload & { id: string; status: string }> {
  const rows = db()
    .prepare("SELECT id, payload, status FROM prescriptions WHERE skill_run_id = ? ORDER BY created_at ASC")
    .all(skillRunId) as Array<{ id: string; payload: string; status: string }>;
  return rows.map((r) => ({ ...JSON.parse(r.payload), id: r.id, status: r.status }));
}

export function recordAction(prescriptionId: string, action: "approve" | "modify" | "reject", payload?: string): void {
  const _db = db();
  _db
    .prepare("INSERT INTO actions (prescription_id, action, payload) VALUES (?, ?, ?)")
    .run(prescriptionId, action, payload ?? null);
  const newStatus = action === "approve" ? "approved" : action === "reject" ? "rejected" : "modifying";
  _db.prepare("UPDATE prescriptions SET status = ? WHERE id = ?").run(newStatus, prescriptionId);
}
