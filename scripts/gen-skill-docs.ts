#!/usr/bin/env bun
/**
 * gen-skill-docs — substitute {{TAG}} placeholders in SKILL.md.tmpl files.
 *
 * Run: bun run gen:skill-docs   (or `bun run scripts/gen-skill-docs.ts`)
 * Run: bun run gen:skill-docs --check   (CI mode: exit 1 if any file would change)
 *
 * Reads each .claude/skills/smestack/<skill>/SKILL.md.tmpl, replaces every
 * {{TAG}} with the corresponding string from the resolver map below, and
 * writes the result to SKILL.md alongside the template.
 *
 * The generated SKILL.md is what gets read at runtime by:
 *   - the slash-command symlinks at ~/.claude/skills/smestack-*
 *   - the web GUI's lib/skills.ts (which Anthropic streams as system prompt)
 *
 * So: edit the .tmpl + the resolver, NOT the .md. The .md is build output.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PREAMBLE } from "./resolvers/preamble";
import { PUSHBACK } from "./resolvers/pushback";
import { HANDLEIDINGEN_RESOLVER } from "./resolvers/handleidingen";

const SKILLS_DIR = ".claude/skills/smestack";
const CHECK = process.argv.includes("--check");

const RESOLVERS: Record<string, string> = {
  PREAMBLE,
  PUSHBACK,
  HANDLEIDINGEN: HANDLEIDINGEN_RESOLVER,
};

function substitute(template: string, file: string): string {
  return template.replace(/\{\{(\w+)\}\}/g, (full, tag) => {
    if (!(tag in RESOLVERS)) {
      throw new Error(`[${file}] Unknown placeholder: ${full}`);
    }
    return RESOLVERS[tag];
  });
}

function main() {
  if (!existsSync(SKILLS_DIR)) {
    throw new Error(`Skills dir not found: ${SKILLS_DIR}. Are you in the smestack repo root?`);
  }

  const skills = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  let written = 0;
  let unchanged = 0;
  let drift = 0;

  for (const skill of skills) {
    const tmplPath = join(SKILLS_DIR, skill, "SKILL.md.tmpl");
    const outPath = join(SKILLS_DIR, skill, "SKILL.md");
    if (!existsSync(tmplPath)) {
      // No .tmpl — skill is hand-maintained or not yet templated. Leave alone.
      console.log(`  ${skill}/SKILL.md (no .tmpl, skipping)`);
      continue;
    }

    const tmpl = readFileSync(tmplPath, "utf8");
    const out = substitute(tmpl, `${skill}/SKILL.md.tmpl`);

    const existing = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";

    if (out === existing) {
      unchanged++;
      console.log(`= ${skill}/SKILL.md (unchanged)`);
      continue;
    }

    if (CHECK) {
      drift++;
      console.error(`✗ ${skill}/SKILL.md is stale (run: bun run gen:skill-docs)`);
      continue;
    }

    writeFileSync(outPath, out);
    written++;
    console.log(`✓ ${skill}/SKILL.md  (${out.length.toLocaleString()} chars)`);
  }

  console.log("");
  if (CHECK) {
    if (drift > 0) {
      console.error(`${drift} file(s) out of sync with templates. Failing.`);
      process.exit(1);
    }
    console.log(`✓ All ${unchanged} skill(s) up to date.`);
  } else {
    console.log(`Generated ${written} file(s), ${unchanged} unchanged.`);
  }
}

main();
