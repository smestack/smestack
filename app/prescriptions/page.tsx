"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PrescriptionCard, type PrescriptionCardProps } from "@/components/PrescriptionCard";
import { LocaleToggle } from "@/components/LocaleToggle";
import { useLocale, t, type Locale } from "@/lib/i18n";

interface PrescriptionFromApi extends PrescriptionCardProps {
  id: string;
  status: string;
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [locale] = useLocale();

  async function load() {
    try {
      const res = await fetch("/api/prescriptions");
      const data = await res.json();
      setPrescriptions(data.prescriptions ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAction(
    id: string,
    action: "approve" | "modify" | "reject",
    payload?: string
  ): Promise<void> {
    await fetch(`/api/prescriptions/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payload }),
    });
    await load();
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-cream-200 px-6 py-4 flex items-center justify-between gap-3">
        <Link href="/" className="mono text-sm uppercase tracking-wider">
          {t(locale, "brand.name")}
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/intake"
            className="mono text-xs uppercase tracking-wider text-zinc-600 hover:text-amber-700"
          >
            {t(locale, "rx.header.intake_link")}
          </Link>
          <LocaleToggle />
        </div>
      </header>

      <div className="max-w-prose mx-auto px-6 py-12">
        <div className="mono text-xs uppercase tracking-wider text-zinc-600 mb-2">
          {t(locale, "rx.eyebrow")}
        </div>
        <h1 className="text-3xl font-semibold mb-6">{t(locale, "rx.title")}</h1>
        <p className="text-zinc-600 mb-8 leading-relaxed">{t(locale, "rx.intro")}</p>

        {loading && <p className="text-zinc-600">{t(locale, "common.loading")}</p>}

        {!loading && prescriptions.length === 0 && (
          <div className="border border-cream-200 rounded-md p-8 text-center">
            <p className="text-zinc-600 mb-4">{t(locale, "rx.empty.body")}</p>
            <Link
              href="/intake"
              className="inline-block min-h-[44px] px-6 py-3 rounded-md font-medium bg-amber-600 text-white hover:bg-amber-700"
            >
              {t(locale, "common.start_intake")}
            </Link>
          </div>
        )}

        {!loading &&
          prescriptions.map((p) => (
            <PrescriptionCard
              key={p.id}
              {...p}
              onAction={(action, payload) => handleAction(p.id, action, payload)}
            />
          ))}

        {!loading && prescriptions.some((p) => p.status === "approved") && (
          <NextStepsBlock
            approvedCount={prescriptions.filter((p) => p.status === "approved").length}
            locale={locale}
          />
        )}
      </div>
    </main>
  );
}

function NextStepsBlock({
  approvedCount,
  locale,
}: {
  approvedCount: number;
  locale: Locale;
}) {
  const subject = encodeURIComponent(
    t(locale, "next.path2.email_subject", approvedCount)
  );
  const body = encodeURIComponent(
    t(locale, "next.path2.email_body", approvedCount)
  );
  const mailto = `mailto:hallo@mkbstack.nl?subject=${subject}&body=${body}`;

  return (
    <section className="mt-16 pt-12 border-t border-cream-200">
      <h2 className="text-2xl font-semibold mb-3">{t(locale, "next.title")}</h2>
      <p className="text-zinc-600 mb-8 leading-relaxed">
        {t(locale, "next.intro", approvedCount)}
      </p>

      <div className="space-y-6">
        {/* Path 1: DIY */}
        <article className="border border-cream-200 rounded-lg p-6 bg-white">
          <div className="mono text-xs uppercase tracking-wider text-zinc-600 mb-2">
            {t(locale, "next.path1.eyebrow")}
          </div>
          <h3 className="text-xl font-semibold mb-3">{t(locale, "next.path1.title")}</h3>
          <p className="text-zinc-800 leading-relaxed mb-4">
            {t(locale, "next.path1.body")}
          </p>
          <a
            href="https://github.com/mkbstack/mkbstack#quickstart"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-amber-700 underline hover:text-amber-800"
          >
            {t(locale, "next.path1.cta")}
          </a>
        </article>

        {/* Path 2: Hire */}
        <article className="border border-cream-200 rounded-lg p-6 bg-amber-50">
          <div className="mono text-xs uppercase tracking-wider text-amber-700 mb-2">
            {t(locale, "next.path2.eyebrow")}
          </div>
          <h3 className="text-xl font-semibold mb-3">{t(locale, "next.path2.title")}</h3>
          <p className="text-zinc-800 leading-relaxed mb-4">
            {t(locale, "next.path2.body", approvedCount)}
          </p>
          <a
            href={mailto}
            className="inline-block min-h-[44px] px-6 py-3 rounded-md font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
          >
            {t(locale, "next.path2.cta")}
          </a>
          <p className="mt-4 text-xs text-zinc-600 italic">
            {t(locale, "next.path2.microcopy")}
          </p>
        </article>
      </div>
    </section>
  );
}
