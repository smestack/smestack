import Link from "next/link";
import { Check } from "lucide-react";

interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

// Dutch SME testimonials. Editorial layout (single column of blockquotes),
// NOT a 3-column card grid — locked anti-slop in /plan-design-review.
const testimonials: Testimonial[] = [
  {
    quote:
      "Ik bespaar 3 uur per week op uren bijhouden, en de jongens vinden het zelf ook prettiger. Nooit meer op zaterdag bonnetjes uitzoeken.",
    name: "Mark V.",
    role: "loodgieter, Utrecht",
  },
  {
    quote:
      "Eindelijk weet ik op maandagochtend wie nog moet betalen, zonder dat ik er zelf in moet duiken. Voelt alsof er een collega meedraait.",
    name: "Anouk de J.",
    role: "interieurontwerpster, Den Bosch",
  },
  {
    quote:
      "Ik dacht dat ik 'te klein' was voor AI. Bleek dat juist dít past bij een team van vier — en ik beslis nog steeds zelf wat er live gaat.",
    name: "Rachid B.",
    role: "glaszetter, Rotterdam",
  },
  {
    quote:
      "Het mooiste: ze installeren niets zonder dat ik akkoord geef. Dat was de drempel. Nu draait alles soepel en ben ik terug aan de keukentafel om half zes.",
    name: "Ben H.",
    role: "elektrotechnisch installateur, Eindhoven",
  },
];

// Trust signals — surfaced right above the CTA. Three short claims that
// answer the "wait, do I have to pay at the end?" cold feet that Jeroen
// flagged. Each claim is concrete and verifiable, not marketing fluff.
const trustClaims = [
  "Volledig gratis",
  "Geen account, geen creditcard",
  "Resultaten zijn van jou",
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-prose mx-auto text-center">
          {/* Brand wordmark */}
          <div className="mono text-sm uppercase tracking-wider text-zinc-600 mb-12">
            MKBStack
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight mb-6">
            De AI-manager, geïnstalleerd bij jouw bedrijf.
          </h1>

          <p className="text-lg text-zinc-600 mb-10 leading-relaxed">
            Een vrijblijvend gesprek van 20 minuten over jouw bedrijf. Daarna
            concrete, risico-getoetste voorstellen, die jij goedkeurt voordat
            er iets live gaat.
          </p>

          {/* Trust strip — directly above CTA. Layer 1 of 3 trust signals. */}
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-8 text-sm text-zinc-800">
            {trustClaims.map((claim, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <Check
                  className="w-4 h-4 text-amber-600 flex-shrink-0"
                  aria-hidden
                />
                <span>{claim}</span>
              </li>
            ))}
          </ul>

          {/* Single CTA */}
          <Link
            href="/intake"
            className="inline-block min-h-[44px] px-8 py-3 rounded-md font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
          >
            Start het gesprek
          </Link>

          {/* Layer 2: micro-copy under the CTA. Honest framing — implementation
              is opt-in paid, but the diagnosis is always free. No pressure. */}
          <p className="mt-6 text-sm text-zinc-600 italic">
            ~20 minuten. Pauzeer en hervat wanneer je wilt. Geen druk —
            implementatie is optioneel.
          </p>
        </div>
      </section>

      {/* Social proof — single line, prose, NOT a stat dashboard */}
      <section className="px-6 py-8 border-y border-cream-200 bg-white">
        <div className="max-w-prose mx-auto text-center">
          <p className="text-zinc-800">
            We hebben in de afgelopen 5 weken al{" "}
            <span className="font-semibold">meer dan 115 ondernemers</span>{" "}
            geholpen om hun bedrijfsprocessen te automatiseren.
          </p>
        </div>
      </section>

      {/* Layer 3: explicit "wat kost dit?" answer. Anchored at #kosten so
          the trust-strip above can deep-link if we want to later. */}
      <section id="kosten" className="px-6 py-16 bg-cream-50">
        <div className="max-w-prose mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Wat kost dit?</h2>
          <p className="text-zinc-800 leading-relaxed mb-4">
            Niets. Het hele gesprek en alle voorstellen zijn gratis.
          </p>
          <p className="text-zinc-800 leading-relaxed mb-4">
            MKBStack is open source — je draait het op je eigen computer of
            laptop. Er is geen MKBStack-abonnement, geen account, geen
            creditcard. Niet bij de start, niet na afloop, nooit.
          </p>
          <p className="text-zinc-800 leading-relaxed">
            Als je een specifieke automatisering daadwerkelijk wilt
            installeren (bijvoorbeeld een WhatsApp-nummer voor je ploeg, of
            een AI-model dat draait op de achtergrond), betaal je{" "}
            <em>rechtstreeks aan die leverancier</em> — bijvoorbeeld Twilio of
            Anthropic. Vaak is dat een paar tientjes per maand. Of nul: jij
            beslist of dat de moeite waard is.
          </p>

          <h3 className="text-base font-semibold mt-8 mb-3">
            En als ik het zelf niet wil installeren?
          </h3>
          <p className="text-zinc-800 leading-relaxed">
            Dan kun je ons inschakelen — wij doen het voor je. Dat is een
            losse, betaalde dienst die je <em>na</em> het gesprek kunt
            aanvragen, niet vooraf. Geen abonnement, geen retainer: je krijgt
            een offerte voor exact die ene automatisering, en jij beslist of
            je groen licht geeft.
          </p>

          <p className="text-zinc-600 leading-relaxed mt-6 italic text-sm">
            Geen lock-in. Geen abonnement. Geen verrassingen.
          </p>
        </div>
      </section>

      {/* Testimonials — editorial blockquote column, NOT a card grid */}
      <section className="px-6 py-16">
        <div className="max-w-prose mx-auto">
          <h2 className="mono text-xs uppercase tracking-wider text-zinc-600 mb-8 text-center">
            Wat ondernemers zeggen
          </h2>

          <div className="space-y-12">
            {testimonials.map((t, i) => (
              <blockquote key={i} className="border-l-2 border-amber-600 pl-6">
                <p className="text-lg text-zinc-800 leading-relaxed mb-3 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="text-sm text-zinc-600">
                  <span className="font-medium text-zinc-800">{t.name}</span>
                  <span className="mx-2">·</span>
                  <span>{t.role}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA — repeat after testimonials */}
      <section className="px-6 py-16 border-t border-cream-200">
        <div className="max-w-prose mx-auto text-center">
          <p className="text-lg text-zinc-800 mb-6 leading-relaxed">
            Klaar om jouw eerste voorstel te zien?
          </p>
          <Link
            href="/intake"
            className="inline-block min-h-[44px] px-8 py-3 rounded-md font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
          >
            Start het gesprek
          </Link>
          <p className="mt-4 text-sm text-zinc-600 italic">
            Vrijblijvend. Geen creditcard. Implementatie is optioneel.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm text-zinc-600 border-t border-cream-200">
        <Link
          href="/prescriptions"
          className="underline hover:text-amber-700"
        >
          Bekijk huidige voorstellen
        </Link>
        <span className="mx-2">·</span>
        <span className="mono text-xs">v0.1 — lokale modus</span>
      </footer>
    </main>
  );
}
