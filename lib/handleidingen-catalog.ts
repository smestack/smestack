/**
 * Handleidingen catalog — single source of truth for available guides.
 *
 * Used by:
 *   - app/handleidingen/page.tsx (the index page)
 *   - components/PrescriptionCard.tsx (renders /handleidingen/<slug> as a button)
 *   - scripts/resolvers/handleidingen.ts (injects the catalog into skill prompts
 *     so the AI knows which guides it can reference instead of writing manual
 *     credential-fetching instructions)
 *
 * Adding a new guide:
 *   1. Run bun run gen:guide <skill.json> --output public/handleidingen/<slug>.html
 *   2. Add an entry to HANDLEIDINGEN below.
 *   3. Run bun run gen:skill-docs so the skill prompts pick up the new entry.
 */

export interface Handleiding {
  /** URL slug — file path is /handleidingen/<slug>.html */
  slug: string;
  /** Tool keyword(s) the AI should match against (e.g., owner says "Moneybird"). */
  tools: string[];
  /** Plain-Dutch title (NL is the canonical language; EN is supplementary). */
  title_nl: string;
  title_en: string;
  /** What the guide solves — used in card link + index page. */
  summary_nl: string;
  summary_en: string;
  /** Estimated read+do time. */
  duration_nl: string;
  duration_en: string;
  /**
   * What kind of credential the owner ends up with — token, access, login.
   * Tells the AI WHAT this guide enables, so the AI knows when to reference it.
   */
  produces_nl: string;
  produces_en: string;
}

export const HANDLEIDINGEN: Handleiding[] = [
  {
    slug: "moneybird-api-sleutel",
    tools: ["moneybird"],
    title_nl: "Een API-sleutel uit Moneybird halen",
    title_en: "Getting an API key from Moneybird",
    summary_nl:
      "Voor elke automatisering die Moneybird-data leest of schrijft. Je logt in op Moneybird, maakt een persoonlijke API-sleutel aan, en plakt 'm in MKBStack.",
    summary_en:
      "For any automation that reads or writes Moneybird data. You log into Moneybird, create a personal API key, and paste it into MKBStack.",
    duration_nl: "~5 minuten",
    duration_en: "~5 minutes",
    produces_nl: "een Moneybird API-token (persoonlijk, met alleen de toegang die jij aanvinkt)",
    produces_en: "a Moneybird API token (personal, only the access you tick)",
  },
];

export function findHandleiding(input: string): Handleiding | undefined {
  // Match /handleidingen/<slug>(.html)? or just <slug>
  const slugMatch = input.match(/\/handleidingen\/([a-z0-9-]+)(?:\.html)?/i);
  const candidate = slugMatch ? slugMatch[1] : input.trim();
  return HANDLEIDINGEN.find((h) => h.slug === candidate);
}

export function handleidingHref(slug: string): string {
  return `/handleidingen/${slug}.html`;
}
