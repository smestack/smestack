/**
 * Loads SKILL.md files from .claude/skills/smestack/<name>/ at runtime.
 *
 * The slash commands and the GUI are alternative interfaces to the SAME
 * skill prose — the SKILL.md is the source of truth. This module is what
 * lets the GUI consume them.
 *
 * Frontmatter is stripped before passing to the model; the prose is the prompt.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const SKILLS_DIR = join(process.cwd(), ".claude", "skills", "smestack");

export function loadSkill(name: string): string {
  const path = join(SKILLS_DIR, name, "SKILL.md");
  if (!existsSync(path)) {
    throw new Error(`Skill not found: ${name} (looked at ${path})`);
  }
  const raw = readFileSync(path, "utf8");
  // Strip YAML frontmatter
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  return match ? match[2] : raw;
}

export function loadBusinessMd(): string {
  const path = join(process.cwd(), "workspace", "business.md");
  if (!existsSync(path)) {
    return "(no business profile yet — this is a fresh intake)";
  }
  return readFileSync(path, "utf8");
}
