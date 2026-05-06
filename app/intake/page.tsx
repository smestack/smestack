"use client";

import { ChatShell } from "@/components/ChatShell";
import { LocaleToggle } from "@/components/LocaleToggle";
import { useLocale, t } from "@/lib/i18n";
import Link from "next/link";

export default function IntakePage() {
  const [locale] = useLocale();

  return (
    <main className="min-h-screen">
      <header className="border-b border-cream-200 px-6 py-4 flex items-center justify-between gap-3">
        <Link href="/" className="mono text-sm uppercase tracking-wider">
          {t(locale, "brand.name")}
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/voorstellen"
            className="mono text-xs uppercase tracking-wider text-zinc-600 hover:text-amber-700"
          >
            {t(locale, "intake.header.proposals_link")}
          </Link>
          <LocaleToggle />
        </div>
      </header>

      <ChatShell
        skillName="business-intake"
        initialPrompt={t(locale, "intake.opener")}
        rightRailBullets={[]}
      />

      <div className="text-center pb-8 px-6">
        <Link
          href="/"
          className="text-sm text-zinc-600 underline hover:text-amber-700"
        >
          {t(locale, "intake.pause_link")}
        </Link>
      </div>
    </main>
  );
}
