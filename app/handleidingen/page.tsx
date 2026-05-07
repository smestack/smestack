"use client";

import Link from "next/link";
import { LocaleToggle } from "@/components/LocaleToggle";
import { useLocale, t, type Locale } from "@/lib/i18n";
import {
  HANDLEIDINGEN,
  handleidingHref,
  type Handleiding,
} from "@/lib/handleidingen-catalog";

export default function HandleidingenIndex() {
  const [locale] = useLocale();
  return (
    <main className="min-h-screen">
      <header className="border-b border-cream-200 px-6 py-4 flex items-center justify-between gap-3">
        <Link href="/" className="mono text-sm uppercase tracking-wider">
          {t(locale, "brand.name")}
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/intake"
            className="mono text-xs uppercase tracking-wider text-zinc-600 hover:text-amber-700"
          >
            {t(locale, "nav.start")}
          </Link>
          <Link
            href="/voorstellen"
            className="mono text-xs uppercase tracking-wider text-zinc-600 hover:text-amber-700"
          >
            {t(locale, "nav.proposals")}
          </Link>
          <LocaleToggle />
        </div>
      </header>

      <section className="px-6 py-16">
        <div className="max-w-prose mx-auto">
          <div className="mono text-xs uppercase tracking-wider text-zinc-600 mb-3">
            {locale === "nl" ? "handleidingen" : "guides"}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold leading-tight mb-6">
            {locale === "nl"
              ? "Stap-voor-stap, met schermafbeeldingen"
              : "Step by step, with screenshots"}
          </h1>
          <p className="text-lg text-zinc-700 leading-relaxed">
            {locale === "nl"
              ? "Voor elke tool die MKBStack koppelt aan jouw bedrijf is er één rustige handleiding. Geen voorkennis nodig — je hoeft alleen mee te klikken."
              : "For every tool MKBStack connects to your business there's one calm guide. No prior knowledge needed — just click along."}
          </p>
        </div>
      </section>

      <div className="max-w-prose mx-auto px-6 pb-24 space-y-6">
        {HANDLEIDINGEN.map((g) => (
          <GuideCard key={g.slug} guide={g} locale={locale} />
        ))}
      </div>
    </main>
  );
}

function GuideCard({ guide, locale }: { guide: Handleiding; locale: Locale }) {
  const title = locale === "nl" ? guide.title_nl : guide.title_en;
  const summary = locale === "nl" ? guide.summary_nl : guide.summary_en;
  const duration = locale === "nl" ? guide.duration_nl : guide.duration_en;

  return (
    <a
      href={handleidingHref(guide.slug)}
      className="block border border-cream-200 rounded-lg p-6 hover:border-amber-600 hover:shadow-sm transition-all bg-white"
    >
      <div className="flex items-baseline justify-between gap-4 mb-2">
        <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
        <span className="mono text-xs uppercase tracking-wider text-amber-700 whitespace-nowrap">
          {duration}
        </span>
      </div>
      <p className="text-zinc-700 leading-relaxed">{summary}</p>
      <p className="mt-3 text-sm text-amber-700 mono">
        {locale === "nl" ? "Lees handleiding →" : "Read guide →"}
      </p>
    </a>
  );
}
