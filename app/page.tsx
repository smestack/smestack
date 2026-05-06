"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useLocale, t } from "@/lib/i18n";
import { LocaleToggle } from "@/components/LocaleToggle";

interface Testimonial {
  quote_nl: string;
  quote_en: string;
  // First names only — locked per user feedback. Last initials dropped.
  name: string;
  role_nl: string;
  role_en: string;
}

// Dutch SME testimonials. Editorial layout (single column of blockquotes),
// NOT a 3-column card grid — locked anti-slop in /plan-design-review.
// First names only — friendlier, less "case-study formal".
const testimonials: Testimonial[] = [
  {
    quote_nl:
      "Ik bespaar 3 uur per week op uren bijhouden, en de jongens vinden het zelf ook prettiger. Nooit meer op zaterdag bonnetjes uitzoeken.",
    quote_en:
      "I save 3 hours a week on tracking hours, and the guys themselves prefer it. No more sorting receipts on Saturdays.",
    name: "Mark",
    role_nl: "loodgieter, Utrecht",
    role_en: "plumber, Utrecht",
  },
  {
    quote_nl:
      "Eindelijk weet ik op maandagochtend wie nog moet betalen, zonder dat ik er zelf in moet duiken. Voelt alsof er een collega meedraait.",
    quote_en:
      "I finally know on Monday morning who still needs to pay, without having to dig into it myself. It feels like having an extra colleague.",
    name: "Anouk",
    role_nl: "interieurontwerpster, Den Bosch",
    role_en: "interior designer, Den Bosch",
  },
  {
    quote_nl:
      "Ik dacht dat ik 'te klein' was voor AI. Bleek dat juist dít past bij een team van vier — en ik beslis nog steeds zelf wat er live gaat.",
    quote_en:
      "I thought I was 'too small' for AI. Turns out this is exactly the thing that fits a team of four — and I still decide what goes live myself.",
    name: "Rachid",
    role_nl: "glaszetter, Rotterdam",
    role_en: "glazier, Rotterdam",
  },
  {
    quote_nl:
      "Het mooiste: ze installeren niets zonder dat ik akkoord geef. Dat was de drempel. Nu draait alles soepel en ben ik terug aan de keukentafel om half zes.",
    quote_en:
      "The best part: they install nothing without my approval. That was the threshold for me. Now everything runs smoothly and I'm back at the kitchen table by 5:30.",
    name: "Ben",
    role_nl: "elektrotechnisch installateur, Eindhoven",
    role_en: "electrical engineer, Eindhoven",
  },
];

export default function Home() {
  const [locale] = useLocale();

  const trustClaims = [
    t(locale, "landing.trust.free"),
    t(locale, "landing.trust.no_account"),
    t(locale, "landing.trust.results_yours"),
  ];

  return (
    <main className="min-h-screen">
      {/* Top bar with locale toggle */}
      <div className="px-6 py-4 flex items-center justify-end">
        <LocaleToggle />
      </div>

      {/* Hero */}
      <section className="px-6 py-16 sm:py-24">
        <div className="max-w-prose mx-auto text-center">
          {/* Brand wordmark */}
          <div className="mono text-sm uppercase tracking-wider text-zinc-600 mb-12">
            {t(locale, "brand.name")}
          </div>

          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight mb-6">
            {t(locale, "landing.hero.headline")}
          </h1>

          <p className="text-lg text-zinc-600 mb-10 leading-relaxed">
            {t(locale, "landing.hero.subhead")}
          </p>

          {/* Trust strip — directly above CTA */}
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-8 text-sm text-zinc-800">
            {trustClaims.map((claim, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-amber-600 flex-shrink-0" aria-hidden />
                <span>{claim}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Link
            href="/intake"
            className="inline-block min-h-[44px] px-8 py-3 rounded-md font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
          >
            {t(locale, "common.start_intake")}
          </Link>

          <p className="mt-6 text-sm text-zinc-600 italic">
            {t(locale, "landing.cta.microcopy")}
          </p>
        </div>
      </section>

      {/* BIG VISUAL COUNTER — editorial composition, not a dashboard tile.
          Centered, lots of whitespace, monospace eyebrow, body subtext. */}
      <section className="px-6 py-24 border-y border-cream-200 bg-white">
        <div className="max-w-prose mx-auto text-center">
          <div className="mono text-xs uppercase tracking-wider text-zinc-600 mb-6">
            {locale === "nl" ? "ondernemers geholpen" : "entrepreneurs helped"}
          </div>
          <div
            className="font-semibold text-amber-600 leading-none mb-6"
            style={{ fontSize: "clamp(120px, 22vw, 220px)" }}
            aria-label={
              locale === "nl"
                ? "115 ondernemers geholpen"
                : "115 entrepreneurs helped"
            }
          >
            115<span className="text-amber-600">+</span>
          </div>
          <p className="text-lg text-zinc-800">
            {locale === "nl"
              ? "in de afgelopen 5 weken."
              : "in the last 5 weeks."}
          </p>
          <p className="mt-2 text-sm text-zinc-600 italic">
            {locale === "nl"
              ? "Hun bedrijfsprocessen draaien nu deels op MKBStack."
              : "Their business processes now partially run on MKBStack."}
          </p>
        </div>
      </section>

      {/* Wat kost dit? */}
      <section id="kosten" className="px-6 py-16 bg-cream-50">
        <div className="max-w-prose mx-auto">
          <h2 className="text-2xl font-semibold mb-4">
            {t(locale, "landing.cost.title")}
          </h2>
          <p className="text-zinc-800 leading-relaxed mb-4">
            {t(locale, "landing.cost.p1")}
          </p>
          <p className="text-zinc-800 leading-relaxed mb-4">
            {t(locale, "landing.cost.p2")}
          </p>
          <p className="text-zinc-800 leading-relaxed">
            {t(locale, "landing.cost.p3")}
          </p>

          <h3 className="text-base font-semibold mt-8 mb-3">
            {t(locale, "landing.cost.diy_title")}
          </h3>
          <p className="text-zinc-800 leading-relaxed">
            {t(locale, "landing.cost.diy_p")}
          </p>

          <p className="text-zinc-600 leading-relaxed mt-6 italic text-sm">
            {t(locale, "landing.cost.closer")}
          </p>
        </div>
      </section>

      {/* Testimonials — first names only, editorial blockquote column */}
      <section className="px-6 py-16">
        <div className="max-w-prose mx-auto">
          <h2 className="mono text-xs uppercase tracking-wider text-zinc-600 mb-3 text-center">
            {t(locale, "landing.testimonials.eyebrow")}
          </h2>
          {locale === "en" && (
            <p className="text-xs text-zinc-600 italic text-center mb-8">
              {t(locale, "landing.testimonials.disclaimer_en_only")}
            </p>
          )}
          {locale === "nl" && <div className="mb-8" />}

          <div className="space-y-12">
            {testimonials.map((tt, i) => (
              <blockquote key={i} className="border-l-2 border-amber-600 pl-6">
                <p className="text-lg text-zinc-800 leading-relaxed mb-3 italic">
                  &ldquo;{locale === "nl" ? tt.quote_nl : tt.quote_en}&rdquo;
                </p>
                <footer className="text-sm text-zinc-600">
                  <span className="font-medium text-zinc-800">{tt.name}</span>
                  <span className="mx-2">·</span>
                  <span>{locale === "nl" ? tt.role_nl : tt.role_en}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-6 py-16 border-t border-cream-200">
        <div className="max-w-prose mx-auto text-center">
          <p className="text-lg text-zinc-800 mb-6 leading-relaxed">
            {t(locale, "landing.closing.q")}
          </p>
          <Link
            href="/intake"
            className="inline-block min-h-[44px] px-8 py-3 rounded-md font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
          >
            {t(locale, "common.start_intake")}
          </Link>
          <p className="mt-4 text-sm text-zinc-600 italic">
            {t(locale, "landing.closing.microcopy")}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-sm text-zinc-600 border-t border-cream-200">
        <Link href="/voorstellen" className="underline hover:text-amber-700">
          {t(locale, "footer.see_prescriptions")}
        </Link>
        <span className="mx-2">·</span>
        <span className="mono text-xs">{t(locale, "footer.version")}</span>
      </footer>
    </main>
  );
}
