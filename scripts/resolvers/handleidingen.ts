/**
 * HANDLEIDINGEN — catalog of available step-by-step guides, injected as
 * prose into prescription-engine + skill-design.
 *
 * Single-source-of-truth lives in lib/handleidingen-catalog.ts. We import
 * from there so the AI's mental model and the rendered UI never drift.
 *
 * The point of this resolver: when the AI builds a prescription card with
 * `nextSteps`, and one of those steps requires the owner to obtain a
 * credential / token / API key for a tool that has a handleiding, the AI
 * should write `/handleidingen/<slug>` as a SINGLE step entry — NOT a
 * 3-bullet list of "log in, find the menu, click the button." The
 * PrescriptionCard component renders any handleidingen-linked step as a
 * styled link-button with the guide's title, duration, and CTA.
 *
 * That keeps the owner-facing UX clean (one click → guided walkthrough)
 * AND keeps the AI honest (it acknowledges the credential-fetch is the
 * AI's job to walk through, not the owner's job to figure out).
 */

import { HANDLEIDINGEN } from "../../lib/handleidingen-catalog";

function bullet(): string {
  return HANDLEIDINGEN.map((h) => {
    const tools = h.tools.map((t) => `"${t}"`).join(", ");
    return `- **\`/handleidingen/${h.slug}\`** — ${h.title_nl}. Triggers when the owner mentions ${tools}. Produces ${h.produces_nl}. Estimated duration: ${h.duration_nl}.`;
  }).join("\n");
}

export const HANDLEIDINGEN_RESOLVER = `## Handleidingen catalog (use these instead of writing manual setup steps)

When a prescription requires the owner to fetch a credential — API token, OAuth, login — for a tool that has a handleiding listed below, the corresponding \`nextSteps[]\` entry MUST be a single line containing the handleiding path. The frontend renders this as a one-click link-card with the guide's title and an "Open the guide" CTA.

**Available guides:**
${bullet()}

### How to use this in nextSteps

GOOD (single-step handleiding reference):
\`\`\`
nextSteps: [
  "/handleidingen/moneybird-api-sleutel",
  "Stuur me het token zodra je 'm hebt — ik koppel hem aan de skill en draai een testbericht."
]
\`\`\`

BAD (manual instructions when a handleiding exists):
\`\`\`
nextSteps: [
  "Log in op Moneybird en ga naar Instellingen > Integraties > API",
  "Genereer een API-token (kopiëren en bewaren)",
  "Geef mij dat token — ik zet het veilig in en test de verbinding"
]
\`\`\`

The bad version makes the owner do work the guide already explains visually with screenshots. The good version delegates the explanation to the guide and keeps your remaining steps focused on YOUR follow-up actions.

### Rules

1. **Match on tool names, not on guesses.** If the owner says "Moneybird," the moneybird handleiding applies. If they say "boekhouding" generically, ASK which tool before referencing a handleiding.
2. **Never mix.** A nextSteps entry is EITHER a handleiding path (\`/handleidingen/<slug>\`) OR plain prose. Never combine: don't write "Volg /handleidingen/moneybird-api-sleutel — log in, klik op X..." — that defeats the rendering.
3. **One handleiding per credential.** Don't reference the same guide twice in one prescription's nextSteps.
4. **If no handleiding exists for the tool the owner needs, write plain prose steps but FLAG it for yourself:** the absence of a handleiding for a commonly-needed tool is a backlog item — mention it once in your closing summary so the owner knows the next install will be smoother once that guide is written.
`;
