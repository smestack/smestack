"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PrescriptionCard, type PrescriptionCardProps } from "@/components/PrescriptionCard";
import { LocaleToggle } from "@/components/LocaleToggle";
import { useLocale, t, type Locale } from "@/lib/i18n";
import {
  loadPrescriptions,
  setPrescriptionStatus,
  captureLeadEvent,
  type ClientPrescription,
} from "@/lib/prescription-store";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<ClientPrescription[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [locale] = useLocale();

  // Load from localStorage on mount. Re-load when storage changes (e.g.,
  // user has /intake open in another tab).
  useEffect(() => {
    setPrescriptions(loadPrescriptions());
    setHydrated(true);

    function onStorage(ev: StorageEvent) {
      if (ev.key === "mkbstack-prescriptions") {
        setPrescriptions(loadPrescriptions());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  async function handleAction(
    id: string,
    action: "approve" | "modify" | "reject",
    payload?: string
  ): Promise<void> {
    // Update local state immediately (optimistic).
    const updated = setPrescriptionStatus(id, action as any);
    setPrescriptions(updated);

    // Find the prescription that just got actioned, send it to lead-capture.
    const card = updated.find((p) => p.id === id);
    if (card) {
      const eventName =
        action === "approve"
          ? "prescription_approved"
          : action === "modify"
          ? "prescription_modified"
          : "prescription_rejected";
      await captureLeadEvent({
        event: eventName,
        prescription: card,
        meta: { locale, payload },
      });
    }
  }

  return (
    <main className="min-h-screen">
      <header className="border-b border-cream-200 px-6 py-4 flex items-center justify-between gap-3">
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

        {!hydrated && <p className="text-zinc-600">{t(locale, "common.loading")}</p>}

        {hydrated && prescriptions.length === 0 && (
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

        {hydrated &&
          prescriptions.map((p) => (
            <PrescriptionCard
              key={p.id}
              {...(p as unknown as PrescriptionCardProps)}
              onAction={(action, payload) => handleAction(p.id, action, payload)}
            />
          ))}

        {hydrated && prescriptions.some((p) => p.status === "approve") && (
          <NextStepsBlock
            approvedCount={prescriptions.filter((p) => p.status === "approve").length}
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
  const subject = encodeURIComponent(t(locale, "next.path2.email_subject", approvedCount));
  const body = encodeURIComponent(t(locale, "next.path2.email_body", approvedCount));
  const mailto = `mailto:hallo@mkbstack.nl?subject=${subject}&body=${body}`;

  // When the user clicks the quote-request CTA, also fire a lead event.
  const onQuoteClick = () => {
    captureLeadEvent({
      event: "quote_requested",
      meta: { locale, approvedCount },
    });
  };

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
            onClick={onQuoteClick}
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
