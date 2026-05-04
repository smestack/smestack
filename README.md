# SmeStack

> The AI manager, installed at SMEs.

SmeStack is what you get when you fork [gstack](https://github.com/garrytan/gstack)
and point it at small-and-medium enterprises instead of developers. It's a
diagnosis-driven AI manager: a 20-minute conversation about your business, then
risk-assessed prescriptions you approve before anything gets installed.

This is **v0.1** — local-first. Two ways to use it: a **web GUI** at localhost:3002 (the path to non-technical owners) or **Claude Code slash commands** in your terminal (for power users). Both share the same skills and the same business profile.

## Status

🚧 v0.1 — local-first hackathon scaffold. GUI runs on `bun dev`, no hosted version yet.

## What this ships

**Four skills** registered both as Claude Code slash commands AND as backends for the web GUI:

- `/smestack-business-intake` — 20-30 minute consultant-style interview. Writes `workspace/business.md`.
- `/smestack-prescription-engine` — proposes risk-assessed prescriptions as cards. You approve / modify / reject. Routes to skill-design when no catalog match exists for the owner's #1 pain.
- `/smestack-email-triage` — Gmail OAuth + voice-matched draft replies. Cards live in your terminal until you approve a send.
- `/smestack-skill-design` — co-designs a brand-new skill when the catalog comes up short. Decomposes the owner's #1 pain into the smallest safely-automatable atom, drafts SKILL.md, stubs the runner.

**A web GUI** with three pages:
- `/` — landing
- `/intake` — conversational chat (Vercel AI SDK + Claude Sonnet, BYOK, prompt caching on the static prefix)
- `/prescriptions` — prescription cards rendered as the model emits them via tool calls

**One runnable Bun command** for power users:
- `bun run triage` — daily email-triage batch on your authed Gmail inbox. Drafts replies in your voice. Never auto-sends.

## Quickstart — GUI mode (recommended for first-time use)

Requires:
- [Bun](https://bun.sh) ≥ 1.1
- Anthropic API key (`ANTHROPIC_API_KEY` env var) — BYOK
- For email-triage only: a Google Cloud project with Gmail API enabled (free tier)

```bash
git clone <your-fork-url> smestack
cd smestack
bun install
cp .env.example .env
# Edit .env: paste your ANTHROPIC_API_KEY=sk-ant-...

bun run dev
# Open http://localhost:3002 in your browser
```

You'll land on a single-screen "Start the intake" page. Click through, have the 20-minute conversation, see prescriptions appear at `/prescriptions`. No terminal commands required after `bun run dev`.

## Quickstart — CLI mode (Claude Code slash commands)

```bash
bash setup.sh   # registers the skills with Claude Code

# Then in any directory:
claude /smestack-business-intake
```

After the intake completes, prescriptions appear. Approve email-triage to wire
up Gmail OAuth and run the first daily batch.

## The pivot gate

The v0 hero is **email triage with voice-matched drafts.** It either works on
your own inbox at >= 40% approve-without-modification rate over 5 days, or we
swap to `meeting-notes-summarizer` as the v0 hero.

```bash
# After install + intake + email-triage approval:
bun run triage    # run on today's inbox
bun run voice:check    # report 5-day approve-rate (the pivot-gate metric)
```

## Architecture

```
smestack/
├── .claude/skills/smestack/    # Claude Code reads these
│   ├── business-intake/SKILL.md
│   ├── prescription-engine/SKILL.md
│   └── email-triage/SKILL.md
├── src/email-triage/           # Bun TypeScript
│   ├── gmail-oauth.ts          # OAuth flow + token storage
│   ├── voice-match.ts          # 20-exemplar few-shot prompt assembly
│   └── run.ts                  # daily triage entry point
├── workspace/                  # local state (gitignored)
│   ├── business.md             # what the AI knows about your business
│   ├── messages.db             # SQLite, conversation history
│   └── oauth-tokens.json       # encrypted Gmail tokens
└── setup.sh                    # registers skills with Claude Code
```

## Lineage

SmeStack inherits the structured-thinking DNA from gstack — slash commands that
encode opinionated workflows, role-based AI agents, shared business context.
The fork strips gstack's developer-tooling skills (qa, ship, autoplan, etc.)
and adds three SME-focused skills with the diagnosis-then-prescribe pattern.

The skill-template system from gstack (gen-skill-docs, resolvers, preamble) is
**deliberately not yet adopted** in v0 — we're shipping plain SKILL.md files
to keep the v0 hackathon footprint small. Adopting the template machinery is
a v0.5 decision, gated on the v0 demo loop landing.

## License

MIT. Forked from [gstack](https://github.com/garrytan/gstack), © Garry Tan.
SmeStack © 2026 Karel Schorer.
