/**
 * bun run leads
 *
 * Lists recent leads from the production Vercel KV (Redis) store.
 *
 * On first run it pulls your production env vars via `vercel env pull` and
 * caches them in `.env.production.local` (gitignored). Subsequent runs read
 * directly from that file.
 *
 * Usage:
 *   bun run leads               # list 20 most recent
 *   bun run leads --all         # list all 50 (the cap on leads:recent)
 *   bun run leads <key>         # full payload for a specific key
 *   bun run leads --refresh-env # re-pull Vercel env (use after rotating keys)
 */

import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const REPO_ROOT = process.cwd();
const ENV_FILE = ".env.production.local";
const ENV_PATH = join(REPO_ROOT, ENV_FILE);

const args = process.argv.slice(2);
const flagAll = args.includes("--all");
const flagRefresh = args.includes("--refresh-env");
const specificKey = args.find((a) => a.startsWith("leads:"));

function pullEnvIfMissing() {
  if (existsSync(ENV_PATH) && !flagRefresh) return;
  console.log(
    flagRefresh
      ? "Refreshing env from Vercel..."
      : "First run — pulling Vercel production env vars to .env.production.local..."
  );
  const result = spawnSync(
    "vercel",
    ["env", "pull", ENV_FILE, "--environment", "production", "--yes"],
    { stdio: "inherit", cwd: REPO_ROOT }
  );
  if (result.status !== 0) {
    console.error(
      "\nFailed to pull env. Make sure you've run `vercel link` and `vercel login` first."
    );
    process.exit(1);
  }
}

async function main() {
  pullEnvIfMissing();

  // Bun should have loaded the env file via --env-file in package.json. If
  // someone ran the script directly with bare `bun`, prompt them.
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    console.error(
      "ERROR: KV_REST_API_URL or KV_REST_API_TOKEN missing. Use:\n  bun run leads"
    );
    console.error(
      "(Don't run scripts/leads.ts directly — the wrapper loads .env.production.local)"
    );
    process.exit(1);
  }

  const { kv } = await import("@vercel/kv");

  if (specificKey) {
    const lead = await kv.get(specificKey);
    if (!lead) {
      console.log(`Key not found: ${specificKey}`);
      return;
    }
    console.log(JSON.stringify(lead, null, 2));
    return;
  }

  const limit = flagAll ? 49 : 19;
  const keys = await kv.lrange<string>("leads:recent", 0, limit);

  if (!keys || keys.length === 0) {
    console.log("No leads in leads:recent yet.");
    console.log(
      "Tip: do an intake at the live URL and click approve on a prescription."
    );
    return;
  }

  console.log(`\n=== ${keys.length} recent lead${keys.length === 1 ? "" : "s"} ===\n`);

  for (const key of keys) {
    const lead = (await kv.get(key)) as
      | {
          ts: string;
          event: string;
          sessionId: string;
          prescription?: { proposedSkillName?: string; headline?: string };
          conversation?: Array<{ role: string; content: string }>;
          meta?: Record<string, unknown>;
        }
      | null;
    if (!lead) {
      console.log(`  ⚠ ${key} (key in list but value missing)`);
      continue;
    }
    const session8 = lead.sessionId.slice(0, 8);
    const skill = lead.prescription?.proposedSkillName ?? "—";
    const headline = lead.prescription?.headline ?? "";
    const turns = lead.conversation?.length ?? 0;
    console.log(`  ${lead.ts}  ${session8}  ${lead.event.padEnd(24)}  ${skill}`);
    if (headline) console.log(`    ↳ ${headline}`);
    if (lead.event === "intake_complete" && turns > 0) {
      console.log(`    ↳ ${turns} conversation turns`);
    }
  }

  console.log(
    `\nFor full payload: bun run leads ${keys[0]}\n` +
      `Show all 50: bun run leads --all`
  );
}

main().catch((err) => {
  console.error("\nFailed:", err.message ?? err);
  process.exit(1);
});
