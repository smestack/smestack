#!/usr/bin/env bash
# SmeStack setup — installs Bun deps and registers the 3 skills with Claude Code.
# Idempotent: safe to re-run.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_SKILLS_DIR="${HOME}/.claude/skills"

echo "==> SmeStack setup"
echo "    Repo: ${REPO_DIR}"
echo "    Claude skills dir: ${CLAUDE_SKILLS_DIR}"
echo ""

# 1. Bun availability check
if ! command -v bun >/dev/null 2>&1; then
  echo "ERROR: bun not found on PATH."
  echo "Install: https://bun.sh — then re-run ./setup.sh"
  exit 1
fi

# 2. Install dependencies
echo "==> Installing dependencies (bun install)..."
( cd "${REPO_DIR}" && bun install )
echo ""

# 3. Make sure Claude Code's skills directory exists
mkdir -p "${CLAUDE_SKILLS_DIR}"

# 4. Register each skill via real-directory + SKILL.md symlink.
#    Why: Claude Code discovers top-level skill directories with a SKILL.md
#    inside. We create the dir for real and symlink only the SKILL.md so that
#    edits to this repo flow through immediately.
register_skill() {
  local skill_name="$1"
  local source_skill_md="${REPO_DIR}/.claude/skills/smestack/${skill_name}/SKILL.md"
  local target_dir="${CLAUDE_SKILLS_DIR}/smestack-${skill_name}"
  local target_skill_md="${target_dir}/SKILL.md"

  if [[ ! -f "${source_skill_md}" ]]; then
    echo "    SKIP smestack-${skill_name} (source SKILL.md not found)"
    return
  fi

  mkdir -p "${target_dir}"

  # Replace any existing SKILL.md (file or symlink) with a fresh symlink.
  if [[ -e "${target_skill_md}" || -L "${target_skill_md}" ]]; then
    rm -f "${target_skill_md}"
  fi
  ln -s "${source_skill_md}" "${target_skill_md}"

  echo "    OK   smestack-${skill_name}  →  ${source_skill_md}"
}

echo "==> Registering skills with Claude Code..."
register_skill business-intake
register_skill prescription-engine
register_skill email-triage
echo ""

# 5. Verify .env exists (or remind to create it)
if [[ ! -f "${REPO_DIR}/.env" ]]; then
  echo "==> Reminder: copy .env.example to .env and fill in your credentials."
  echo "    cp .env.example .env"
  echo ""
fi

# 6. Make sure workspace/ exists
mkdir -p "${REPO_DIR}/workspace"

echo "==> Done."
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env, fill in ANTHROPIC_API_KEY + Google OAuth creds"
echo "  2. Run 'bun run auth:gmail' to authorize Gmail (one-time)"
echo "  3. Run 'bun run voice:check --bootstrap' to learn your voice from sent folder"
echo "  4. Open Claude Code in this repo and run /smestack-business-intake"
echo "  5. After 5 days of triage runs: 'bun run voice:check' for the pivot gate"
echo ""
