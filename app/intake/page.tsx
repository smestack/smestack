"use client";

import Link from "next/link";
import { IntakeFlow } from "@/components/IntakeFlow";
import { LocaleToggle } from "@/components/LocaleToggle";
import { useLocale, t } from "@/lib/i18n";

export default function IntakePage() {
  const [locale] = useLocale();

  return (
    <main className="min-h-screen bg-cream-50">
      <header className="border-b border-cream-200 px-6 py-4 flex items-center justify-between gap-3 bg-white">
        <Link href="/" className="mono text-sm uppercase tracking-wider">
          {t(locale, "brand.name")}
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/klantverhalen"
            className="mono text-xs uppercase tracking-wider text-zinc-600 hover:text-amber-700"
          >
            {t(locale, "nav.stories")}
          </Link>
          <Link
            href="/voorstellen"
            className="mono text-xs uppercase tracking-wider text-zinc-600 hover:text-amber-700"
          >
            {t(locale, "intake.header.proposals_link")}
          </Link>
          <LocaleToggle />
        </div>
      </header>

      <IntakeFlow
        skillName="business-intake"
        initialPrompt={t(locale, "intake.opener")}
      />
    </main>
  );
}
