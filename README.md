# SmeStack

> The AI manager, installed at SMEs.

SmeStack is what you get when you fork [gstack](https://github.com/garrytan/gstack)
and point it at small-and-medium enterprises instead of developers. It's a
diagnosis-driven AI manager: a 20-minute conversation about your business, then
risk-assessed prescriptions you approve before anything gets installed.

This is **v0** — terminal-first. You run it from your own terminal via Claude
Code slash commands. No web GUI yet. The pivot gate is the email-triage skill
running on your own inbox for 5 days.

## Status

🚧 v0 — terminal-first hackathon scaffold. Not yet usable by non-technical owners.

## What this ships

Three skills that Claude Code can invoke:

- `/business-intake` — 20-30 minute consultant-style interview. Writes
  `workspace/business.md`.
- `/prescription-engine` — given the business profile, proposes 3-5
  risk-assessed prescriptions as cards. You approve / modify / reject.
- `/email-triage` — Gmail OAuth + voice-matched draft replies. Cards live in
  your terminal until you approve a send.

Plus one runnable Bun command:

- `bun run triage` — runs the email-triage daily batch on your authed Gmail
  inbox. Drafts replies in your voice. Never auto-sends.

## Quickstart

Requires:
- [Bun](https://bun.sh) ≥ 1.1
- [Claude Code](https://claude.com/claude-code) (the CLI agent SmeStack runs inside)
- Anthropic API key (`ANTHROPIC_API_KEY` env var) — BYOK
- Google Cloud project with Gmail API enabled (free tier; for the OAuth flow)

```bash
git clone <your-fork-url> smestack
cd smestack
bun install
bash setup.sh   # registers the 3 skills with Claude Code

# Then in any directory:
claude /business-intake
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
