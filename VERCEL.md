# MKBStack op Vercel zetten

Deze guide zet de site live op `your-project.vercel.app` (of een eigen domein) in
~10 minuten. Geen DB-server nodig — antwoorden landen in Vercel KV (Redis).

> **Architectuur-noot:** v0.1+ houdt alle conversation state aan de browserkant
> (useChat memory + localStorage voor resumability). De server is een pure
> stream-proxy en een schrijf-only `/api/answers` endpoint. Geen SQLite, geen
> server-side sessies. Werkt out-of-the-box op Vercel's serverless runtime.

## Vereisten

- Vercel account (gratis hobby-tier is genoeg)
- Een Anthropic API key (BYOK voor het hosted-model — MKBStack betaalt de
  Claude-tokens voor elke bezoeker)
- ~10 min

## Stap 1: Vercel CLI installeren (eenmalig)

```bash
npm i -g vercel
# of: bun add -g vercel
```

Daarna:

```bash
vercel login
```

## Stap 2: Project linken

Vanuit de smestack-directory:

```bash
cd /Users/karelschorer/conductor/workspaces/gstack/medan/smestack
vercel link
```

Beantwoord de prompts:
- "Set up and deploy?" → `Y`
- "Which scope?" → kies je eigen Vercel-account (of het MKBStack team-scope als
  je Jeroen al geadded hebt)
- "Link to existing project?" → `N` (eerste keer)
- "Project name?" → `mkbstack` (of wat je wilt)
- "In which directory is your code located?" → `./` (current dir)

Vercel maakt nu een `.vercel/` map met je project-link. Die staat al in
`.gitignore` — niet committen.

## Stap 3: Environment variables zetten

Vercel kan je env vars uit een lokaal `.env` lezen, of je kan ze via de UI
zetten. UI is veiliger omdat dan je Anthropic key niet via je shell history
loopt.

**Ga naar:** https://vercel.com/dashboard → je project → Settings → Environment
Variables

**Voeg toe (Production + Preview + Development):**

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | Je Anthropic key. **Let op: dit is de MKBStack-key — alle bezoekers gebruiken deze.** Kostraming: ~$0.50 per voltooide intake op Haiku 4.5. |
| `ANTHROPIC_MODEL` | `claude-haiku-4-5-20251001` (default; goedkoop + goed genoeg) of `claude-sonnet-4-5-20250929` (duurder maar betere consultant-stem) |

## Stap 4: Vercel KV koppelen (voor `/api/answers` lead-capture)

Zonder KV werkt de site nog steeds, maar leads worden naar `/tmp/leads.jsonl`
geschreven en raken daar verloren tussen serverless invocations.

**Ga naar:** Vercel dashboard → je project → Storage tab → Create Database
→ kies "KV (Redis)"

Volg de wizard:
- Database name: `mkbstack-leads`
- Region: kies dichtbij je gebruikers (Frankfurt voor NL/EU)
- Connect to: je `mkbstack` project, alle environments

Vercel injecteert automatisch deze env vars in je project:

```
KV_URL
KV_REST_API_URL
KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN
```

`lib/leads.ts` detecteert deze automatisch en schakelt over van local-jsonl
naar KV. Geen code-wijziging nodig.

## Stap 5: Deployen

```bash
vercel --prod
```

Eerste deploy duurt ~2-3 minuten. Output:

```
✅ Production: https://mkbstack-xxx.vercel.app [copied to clipboard]
```

Open die URL in je browser. Klaar.

## Stap 6: Custom domein (optioneel)

Vercel dashboard → Settings → Domains → Add `mkbstack.nl` (of wat je hebt).
Volg de DNS-instructies. Vercel regelt automatisch SSL.

## Hoe leads bekijken

Antwoorden van elke voltooide intake landen in Vercel KV onder de key
`leads:{ISO-timestamp}:{sessionId}`. Een capped lijst `leads:recent` (laatste
50) geeft snelle toegang.

**Optie A — `bun run leads` (aanbevolen)**

Vanuit de smestack-directory op je laptop:

```bash
bun run leads               # 20 meest recente leads, samenvattend
bun run leads --all         # alle 50 (de cap op leads:recent)
bun run leads <key>         # volledige JSON-payload van één lead
bun run leads --refresh-env # opnieuw env vars pullen na een Vercel-rotatie
```

De eerste keer pulled het script automatisch je production env vars via
`vercel env pull .env.production.local`. Dat bestand is gitignored (zit niet
in je commits). Daarna leest het script direct uit de cache.

Voorbeeld output:

```
=== 5 recent leads ===

  2026-05-06T20:34:11Z  abc12345  intake_complete           —
    ↳ 12 conversation turns
  2026-05-06T20:34:55Z  abc12345  prescription_approved     hours-sentinel
    ↳ Auto-prompt plumbers to log hours via WhatsApp...
  2026-05-06T20:35:08Z  abc12345  prescription_approved     invoice-chase-automation
  2026-05-06T20:35:42Z  def67890  intake_complete           —
    ↳ 8 conversation turns
  2026-05-06T20:36:01Z  def67890  quote_requested           —
```

Voor de volledige payload:

```bash
bun run leads "leads:2026-05-06T20:34:55Z:abc12345-..."
```

**Optie B — Vercel dashboard:**

Project → Storage → klik de Redis store → er is een ingebouwde Data Browser
waar je `LRANGE leads:recent 0 49` en `GET <key>` direct kan typen.

**Optie C — een mini admin-page bouwen (v0.6 idee):**

Een `/admin/leads` route die KV leest en de leads als tabel rendert. Beveiligd
met een simple shared password (basic auth) — niet voor v0.1.

> **Let op:** de `vercel kv ...` CLI subcommands bestaan niet meer in de
> huidige Vercel CLI (waren onderdeel van het oude @vercel/kv beta-pad). De
> CLI interpreteert `kv` als een deploy-path-argument en geeft "Can't deploy
> more than one path" — een misleidende error. Gebruik `bun run leads` of
> de dashboard data browser.

## Wat niet op Vercel werkt (en waarom)

- **`/smestack-email-triage` CLI** (`bun run triage`): die gebruikt nog
  `bun:sqlite` voor voice-exemplars + Gmail OAuth via een lokale callback. Werkt
  alleen op je laptop. Op Vercel is dit niet nodig — de email-triage skill is
  alleen een terminal-tool, niet onderdeel van de web GUI.
- **`workspace/business.md`**: bestaat alleen lokaal. Op Vercel is de business
  context volledig in de browser-conversation; de server houdt geen
  bestandsstaat.
- **De vier `/smestack-*` Claude Code slash-commands**: dat is voor power-users
  die SmeStack lokaal in hun terminal draaien. Heeft niets met de web deploy te
  maken.

## Troubleshooting

**Fout: "Cannot find module '@vercel/kv'"**
→ Run `bun install` voordat je deployed.

**`/api/answers` returnt `{ok:true, storage:"local"}` op Vercel**
→ De KV env vars zijn niet correct gezet. Check Vercel dashboard → Settings →
Environment Variables; `KV_REST_API_URL` en `KV_REST_API_TOKEN` moeten beide
present zijn.

**Pages werken, maar `/intake` chat hangt**
→ `ANTHROPIC_API_KEY` ontbreekt of is verkeerd. Check de Vercel deployment
logs (Functions tab → klik op `/api/skill/[name]`).

**Kosten exploderen**
→ Een bezoeker kan ~$0.50 aan Claude-tokens verbruiken per voltooide intake. Bij
100 bezoekers ≈ $50. Voor de demo OK; voor productie wil je rate-limiting +
mogelijk een captcha. Open issue voor v0.6.

## Waar je naar kijkt na de eerste deploy

1. Open de gedeployde URL → zie de Dutch landing page met de 115+ counter
2. Klik "Start het gesprek" → check dat de chat streamt (Haiku 4.5 antwoord
   binnen ~1.5s)
3. Doorloop een korte intake (3-4 vragen) → het model emitteert een
   `propose_prescription` tool call → de banner "Ik heb voorstellen voor je"
   verschijnt onder in de chat
4. Klik door naar `/prescriptions` → de kaart wordt gerendered uit
   `localStorage`
5. Klik "Goedkeuren" → check dat een lead-event in Vercel KV verschijnt:
   `vercel kv lrange leads:recent 0 0`

Als alle 5 ✅, dan staat MKBStack live.
