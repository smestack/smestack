/**
 * Tiny i18n. NL default. Persisted to localStorage.
 *
 * No route shuffling, no SSR locale negotiation — for a marketing-y intake
 * site with two locales, that's overkill. A toggle in the header writes a
 * locale flag to localStorage; pages read it via useLocale() and look up
 * strings in the dict below.
 *
 * Testimonials stay in Dutch on the EN locale: the Dutch SME provenance
 * (Utrecht, Den Bosch, etc.) is the authenticity signal — translating them
 * weakens it. We add a small disclaimer in EN mode instead.
 */

"use client";

import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
  type ReactNode,
} from "react";

export type Locale = "nl" | "en";

export const DEFAULT_LOCALE: Locale = "nl";
export const LOCALE_STORAGE_KEY = "mkbstack-locale";

// All UI strings live here. Add a key, add both translations.
// Keep keys in dot.notation grouped by surface (landing.hero.title, etc.)
// for grep-ability.
const dict = {
  // ─── shared ─────────────────────────────────────────
  "brand.name": { nl: "MKBStack", en: "MKBStack" },
  "common.continue": { nl: "Verder", en: "Continue" },
  "common.start_intake": { nl: "Start het gesprek", en: "Start the conversation" },
  "common.back_to_home": { nl: "Terug naar start", en: "Back to home" },
  "common.loading": { nl: "Laden…", en: "Loading…" },
  "common.you_said": { nl: "jouw antwoord", en: "your answer" },
  "common.input_placeholder": { nl: "Typ je antwoord…", en: "Type your reply…" },
  "common.right_rail_title": {
    nl: "Wat ik tot nu toe over je heb geleerd",
    en: "What I've learned about you so far",
  },

  // ─── landing page ───────────────────────────────────
  "landing.hero.headline": {
    nl: "De AI-manager, geïnstalleerd bij jouw bedrijf.",
    en: "The AI manager, installed at your business.",
  },
  "landing.hero.subhead": {
    nl: "Een vrijblijvend gesprek van 20 minuten over jouw bedrijf. Daarna concrete, risico-getoetste voorstellen, die jij goedkeurt voordat er iets live gaat.",
    en: "A no-strings 20-minute conversation about your business. Afterward, concrete, risk-assessed proposals you approve before anything goes live.",
  },
  "landing.trust.free": { nl: "Volledig gratis", en: "Completely free" },
  "landing.trust.no_account": {
    nl: "Geen account, geen creditcard",
    en: "No account, no credit card",
  },
  "landing.trust.results_yours": {
    nl: "Resultaten zijn van jou",
    en: "Results are yours to keep",
  },
  "landing.cta.microcopy": {
    nl: "~20 minuten. Pauzeer en hervat wanneer je wilt. Geen druk — implementatie is optioneel.",
    en: "~20 minutes. Pause and resume any time. No pressure — implementation is optional.",
  },

  "landing.social_proof": {
    nl: "We hebben in de afgelopen 5 weken al meer dan 115 ondernemers geholpen om hun bedrijfsprocessen te automatiseren.",
    en: "In the last 5 weeks we've already helped more than 115 entrepreneurs automate their business processes.",
  },

  "landing.cost.title": { nl: "Wat kost dit?", en: "What does this cost?" },
  "landing.cost.p1": {
    nl: "Niets. Het hele gesprek en alle voorstellen zijn gratis.",
    en: "Nothing. The whole conversation and all proposals are free.",
  },
  "landing.cost.p2": {
    nl: "MKBStack is open source — je draait het op je eigen computer of laptop. Er is geen MKBStack-abonnement, geen account, geen creditcard. Niet bij de start, niet na afloop, nooit.",
    en: "MKBStack is open source — you run it on your own computer or laptop. There's no MKBStack subscription, no account, no credit card. Not at the start, not at the end, ever.",
  },
  "landing.cost.p3": {
    nl: "Als je een specifieke automatisering daadwerkelijk wilt installeren (bijvoorbeeld een WhatsApp-nummer voor je ploeg, of een AI-model dat draait op de achtergrond), betaal je rechtstreeks aan die leverancier — bijvoorbeeld Twilio of Anthropic. Vaak is dat een paar tientjes per maand. Of nul: jij beslist of dat de moeite waard is.",
    en: "If you actually want to install a specific automation (for example a WhatsApp number for your crew, or an AI model running in the background), you pay the provider directly — Twilio, Anthropic, etc. Usually that's a few tens of euros a month. Or zero: you decide whether it's worth it.",
  },
  "landing.cost.diy_title": {
    nl: "En als ik het zelf niet wil installeren?",
    en: "And if I don't want to install it myself?",
  },
  "landing.cost.diy_p": {
    nl: "Dan kun je ons inschakelen — wij doen het voor je. Dat is een losse, betaalde dienst die je na het gesprek kunt aanvragen, niet vooraf. Geen abonnement, geen retainer: je krijgt een offerte voor exact die ene automatisering, en jij beslist of je groen licht geeft.",
    en: "Then you can hire us — we'll do it for you. That's a separate, paid service you can request after the conversation, not before. No subscription, no retainer: you get a quote for exactly that one automation, and you decide whether to green-light it.",
  },
  "landing.cost.closer": {
    nl: "Geen lock-in. Geen abonnement. Geen verrassingen.",
    en: "No lock-in. No subscription. No surprises.",
  },

  "landing.testimonials.eyebrow": {
    nl: "Wat ondernemers zeggen",
    en: "What entrepreneurs say",
  },
  "landing.testimonials.disclaimer_en_only": {
    nl: "",
    en: "Quotes from Dutch SMEs, kept in original language.",
  },

  "landing.closing.q": {
    nl: "Klaar om jouw eerste voorstel te zien?",
    en: "Ready to see your first proposal?",
  },
  "landing.closing.microcopy": {
    nl: "Vrijblijvend. Geen creditcard. Implementatie is optioneel.",
    en: "No strings. No credit card. Implementation is optional.",
  },

  "footer.see_prescriptions": {
    nl: "Bekijk huidige voorstellen",
    en: "View current proposals",
  },
  "footer.see_stories": {
    nl: "Lees klantverhalen",
    en: "Read customer stories",
  },
  "footer.see_guides": {
    nl: "Bekijk handleidingen",
    en: "View guides",
  },
  "footer.version": { nl: "v0.1 — lokale modus", en: "v0.1 — local mode" },

  // ─── nav ────────────────────────────────────────────
  "nav.stories": { nl: "Klantverhalen", en: "Stories" },
  "nav.proposals": { nl: "Voorstellen", en: "Proposals" },
  "nav.start": { nl: "Start gesprek", en: "Start conversation" },

  // ─── wizard / intake flow ───────────────────────────
  "wizard.step_of": {
    nl: (n: number) => `stap ${n} van 12`,
    en: (n: number) => `step ${n} of 12`,
  },
  "wizard.thinking": { nl: "MKBStack denkt na…", en: "MKBStack is thinking…" },
  "wizard.placeholder": {
    nl: "Schrijf je antwoord hier. Eén of twee zinnen is genoeg.",
    en: "Write your answer here. One or two sentences is enough.",
  },
  "wizard.continue": { nl: "Verder →", en: "Continue →" },
  "wizard.pause": { nl: "Pauzeer", en: "Pause" },
  "wizard.side_title": { nl: "Wat ik weet", en: "What I know" },
  "wizard.side_empty": {
    nl: "Nog niets — het vult zich vanzelf terwijl we praten.",
    en: "Nothing yet — it'll fill in as we talk.",
  },
  "wizard.complete_title": {
    nl: "Klaar — voorstellen worden uitgewerkt",
    en: "Done — proposals are being prepared",
  },
  "wizard.complete_body": {
    nl: "Je intake is compleet. Zodra de eerste voorstellen klaarstaan, zie je ze rechts.",
    en: "Your intake is complete. The first proposals will appear shortly.",
  },
  "wizard.field.what_business_does": { nl: "Bedrijfstype", en: "Business type" },
  "wizard.field.size": { nl: "Grootte", en: "Size" },
  "wizard.field.customers": { nl: "Klanten", en: "Customers" },
  "wizard.field.pricing": { nl: "Prijsmodel", en: "Pricing model" },
  "wizard.field.day_shape": { nl: "Dagindeling", en: "Day shape" },
  "wizard.field.leak": { nl: "De leak", en: "The leak" },
  "wizard.field.fire": { nl: "De fire", en: "The fire" },
  "wizard.field.tools": { nl: "Tools", en: "Tools" },
  "wizard.field.pretender": { nl: "Stille zorg", en: "Quiet worry" },
  "wizard.field.wish": { nl: "Wens", en: "Wish" },
  "wizard.field.no_go": { nl: "No-go zones", en: "No-go zones" },
  "wizard.field.one_promise": { nl: "De ene belofte", en: "The one promise" },

  // ─── intake page ────────────────────────────────────
  "intake.opener": {
    nl: "Ik ben MKBStack — laten we ~20 minuten nemen om helder te krijgen wat jouw bedrijf doet. Wat doet jouw bedrijf eigenlijk, in één zin — zoals je het tegen iemand op een borrel zou uitleggen?",
    en: "I'm MKBStack — let's take ~20 minutes to get clear on what your business actually does. What does your business do, in one sentence — the way you'd describe it to a stranger at a party?",
  },
  "intake.header.proposals_link": { nl: "Voorstellen →", en: "Proposals →" },
  "intake.pause_link": { nl: "Pauzeer en hervat later", en: "Pause and resume later" },

  // ─── prescriptions page ─────────────────────────────
  "rx.eyebrow": { nl: "jouw voorstellen", en: "your proposals" },
  "rx.title": { nl: "Wat ik je zou aanraden", en: "What I'd recommend" },
  "rx.intro": {
    nl: "Elk kaartje is één specifieke automatisering die ik voor jouw bedrijf heb uitgedacht. Goedkeuren om te installeren, aanpassen als je iets wilt tweaken, of afwijzen als het niet klopt. Ik installeer nooit iets zonder jouw expliciete goedkeuring.",
    en: "Each card is one specific automation I've thought through for your business. Approve to install, modify if you want a tweak, or reject if it's not right. I never install anything without your explicit approval.",
  },
  "rx.empty.body": {
    nl: "Nog geen voorstellen. Doe eerst het intake-gesprek.",
    en: "No proposals yet. Do the intake conversation first.",
  },
  "rx.header.intake_link": { nl: "← Gesprek", en: "← Conversation" },

  // ─── prescription card ──────────────────────────────
  "card.eyebrow.proposal": { nl: "voorstel", en: "proposal" },
  "card.eyebrow.custom_design": { nl: "voorstel op maat", en: "custom proposal" },
  "card.eyebrow.coming_soon": { nl: "binnenkort", en: "coming soon" },
  "card.section.what_automated": {
    nl: "Wat wordt geautomatiseerd",
    en: "What gets automated",
  },
  "card.section.data_flow": { nl: "Datastroom", en: "Data flow" },
  "card.section.risk": { nl: "risico", en: "risk" },
  "card.section.why": { nl: "Waarom dit, voor jou", en: "Why this, for you" },
  "card.section.next_steps": { nl: "Volgende stappen", en: "Next steps" },
  "card.action.approve": { nl: "Goedkeuren", en: "Approve" },
  "card.action.modify": { nl: "Aanpassen", en: "Modify" },
  "card.action.reject": { nl: "Afwijzen", en: "Reject" },
  "card.status.approved": { nl: "Goedgekeurd", en: "Approved" },
  "card.status.rejected": { nl: "Afgewezen", en: "Rejected" },
  "card.next_steps.outro": {
    nl: "Pak ze in je eigen tempo op. Niets gaat live tot jij groen licht geeft.",
    en: "Tackle them at your own pace. Nothing goes live until you green-light it.",
  },
  "card.coming_soon.note": {
    nl: "Op de v0.5 roadmap. Voer /mkbstack-prescription-engine opnieuw uit als deze beschikbaar is.",
    en: "On the v0.5 roadmap. Run /mkbstack-prescription-engine again when it's available.",
  },
  "card.modify.note": {
    nl: "→ wijzig-modus. Vertel in de chat wat er moet veranderen.",
    en: "→ modify mode. Tell the chat what should change.",
  },
  "card.reject.note": {
    nl: "→ afgewezen. Komt niet terug tenzij je het vraagt.",
    en: "→ rejected. Won't come back unless you ask.",
  },
  "card.approved.no_steps": {
    nl: "→ goedgekeurd. (Volgende stappen worden getoond zodra ze beschikbaar zijn.)",
    en: "→ approved. (Next steps will appear once available.)",
  },

  // ─── next-steps block (DIY vs hire) ─────────────────
  "next.title": { nl: "Hoe nu verder?", en: "What's next?" },
  "next.intro": {
    nl: (n: number) => `Je hebt ${n} voorstel${n === 1 ? "" : "len"} goedgekeurd. Twee paden:`,
    en: (n: number) => `You've approved ${n} proposal${n === 1 ? "" : "s"}. Two paths:`,
  },
  "next.path1.eyebrow": { nl: "pad 1 — gratis", en: "path 1 — free" },
  "next.path1.title": { nl: "Ik installeer het zelf", en: "I'll install it myself" },
  "next.path1.body": {
    nl: "MKBStack is open source. De stappen onder elk goedgekeurd voorstel tellen op tot een handleiding die je in je eigen tempo kunt doorlopen. Je betaalt alleen rechtstreeks aan de leveranciers van de tools (Twilio, Anthropic, etc.).",
    en: "MKBStack is open source. The steps under each approved proposal add up to a guide you can follow at your own pace. You pay only the providers directly (Twilio, Anthropic, etc.).",
  },
  "next.path1.cta": {
    nl: "Bekijk de installatie-documentatie →",
    en: "View the installation docs →",
  },
  "next.path2.eyebrow": {
    nl: "pad 2 — betaalde implementatie",
    en: "path 2 — paid implementation",
  },
  "next.path2.title": {
    nl: "Laat het MKBStack-team het installeren",
    en: "Let the MKBStack team install it",
  },
  "next.path2.body": {
    nl: (n: number) =>
      `Geen tijd, geen technische achtergrond, of liever in één keer goed? Wij installeren de goedgekeurde voorstellen voor je en zorgen dat ze daadwerkelijk werken op jouw situatie. Je krijgt een offerte voor exact deze ${n} automatisering${n === 1 ? "" : "en"} — geen abonnement, geen retainer.`,
    en: (n: number) =>
      `No time, no technical background, or just want it done right the first time? We'll install the approved proposals for you and make sure they actually work in your situation. You'll get a quote for exactly these ${n} automation${n === 1 ? "" : "s"} — no subscription, no retainer.`,
  },
  "next.path2.cta": { nl: "Vraag een offerte aan", en: "Request a quote" },
  "next.path2.microcopy": {
    nl: "Geen verplichting. We bellen je terug binnen 1 werkdag, je beslist daarna of je verder wilt.",
    en: "No obligation. We'll call you back within 1 business day, then you decide if you want to proceed.",
  },
  "next.path2.email_subject": {
    nl: (n: number) =>
      `Offerte aanvraag — ${n} goedgekeurde MKBStack-automatisering${n === 1 ? "" : "en"}`,
    en: (n: number) =>
      `Quote request — ${n} approved MKBStack automation${n === 1 ? "" : "s"}`,
  },
  "next.path2.email_body": {
    nl: (n: number) =>
      `Hoi MKBStack-team,\n\nIk heb het intake-gesprek gedaan en ${n} voorstel${n === 1 ? "" : "len"} goedgekeurd. Ik zou graag een offerte ontvangen voor de installatie.\n\n[Korte beschrijving van mijn bedrijf, indien gewenst]\n\nBel me terug op: [telefoonnummer]\n\nGroeten,\n[naam]`,
    en: (n: number) =>
      `Hi MKBStack team,\n\nI've completed the intake and approved ${n} proposal${n === 1 ? "" : "s"}. I'd like to receive a quote for the installation.\n\n[Short description of my business, if relevant]\n\nCall me back at: [phone number]\n\nRegards,\n[name]`,
  },

  // ─── customer stories page ──────────────────────────
  "stories.eyebrow": { nl: "klantverhalen", en: "customer stories" },
  "stories.title": {
    nl: "Wat er gebeurt nadat ondernemers groen licht geven",
    en: "What happens after entrepreneurs give the green light",
  },
  "stories.intro": {
    nl: "Vier MKB-ondernemers, vier verschillende pijnpunten, vier kleine automatiseringen die nu draaien op de achtergrond. Geen enterprise-roll-out, geen consultant-traject — gewoon één concreet probleem per keer.",
    en: "Four SME entrepreneurs, four different pain points, four small automations now running in the background. No enterprise roll-out, no consultant track — just one concrete problem at a time.",
  },
  "stories.disclaimer": {
    nl: "Deze verhalen zijn samengesteld op basis van echte intake-gesprekken. Namen en specifieke cijfers zijn versluierd of representatief gemaakt.",
    en: "These stories are composed from real intake conversations. Names and specific numbers are obscured or made representative.",
  },
  "stories.section.situation": { nl: "De situatie", en: "The situation" },
  "stories.section.built": { nl: "Wat we hebben gebouwd", en: "What we built" },
  "stories.section.result": { nl: "Het resultaat", en: "The outcome" },
  "stories.numbers.label": { nl: "in cijfers", en: "by the numbers" },
  "stories.cta.headline": {
    nl: "Wat zou jouw verhaal zijn?",
    en: "What would your story be?",
  },
  "stories.cta.body": {
    nl: "Het intake-gesprek is waar het begint. ~20 minuten, vrijblijvend, geen creditcard.",
    en: "The intake conversation is where it starts. ~20 minutes, no strings, no credit card.",
  },

  // ─── locale toggle ──────────────────────────────────
  "toggle.aria": { nl: "Wissel taal", en: "Switch language" },
} as const;

export type DictKey = keyof typeof dict;

type DictValue = (typeof dict)[DictKey][Locale];
type StringDictValue = string;
type FnDictValue = (n: number) => string;

// String overload
export function t(locale: Locale, key: DictKey): StringDictValue;
// Function overload — for keys whose value is a (n) => string
export function t<K extends DictKey>(
  locale: Locale,
  key: K,
  arg: number
): StringDictValue;
export function t(locale: Locale, key: DictKey, arg?: number): string {
  const entry = dict[key];
  if (!entry) return key;
  const value = entry[locale];
  if (typeof value === "function") {
    return (value as FnDictValue)(arg ?? 0);
  }
  return value as StringDictValue;
}

// React Context so the locale state is shared across every component on the
// page. Without this, each useLocale() call creates its own useState
// instance — switching the toggle only updated the toggle's own state and
// left the rest of the page untranslated. Now there's one Provider at the
// root and every consumer sees the same value.

type LocaleContextValue = readonly [Locale, (l: Locale) => void];

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "nl" || stored === "en") setLocale(stored);
  }, []);

  const setAndPersist = useCallback((l: Locale) => {
    setLocale(l);
    localStorage.setItem(LOCALE_STORAGE_KEY, l);
    // Update the html lang attribute so screen readers + browsers know.
    if (typeof document !== "undefined") {
      document.documentElement.lang = l;
    }
  }, []);

  const value: LocaleContextValue = [locale, setAndPersist];
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  // Safety: if a component uses useLocale outside of a Provider, fall back
  // to the default locale and a no-op setter. Logs a warning so it's
  // findable in dev.
  if (!ctx) {
    if (typeof window !== "undefined") {
      console.warn(
        "[i18n] useLocale() called outside <LocaleProvider>. Falling back to default locale."
      );
    }
    return [DEFAULT_LOCALE, () => {}] as const;
  }
  return ctx;
}
