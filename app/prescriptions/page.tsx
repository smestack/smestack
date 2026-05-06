"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PrescriptionCard, type PrescriptionCardProps } from "@/components/PrescriptionCard";

interface PrescriptionFromApi extends PrescriptionCardProps {
  id: string;
  status: string;
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionFromApi[]>([]);
  const [loading, setLoading] = useState(true);

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
      <header className="border-b border-cream-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="mono text-sm uppercase tracking-wider">
          MKBStack
        </Link>
        <Link
          href="/intake"
          className="mono text-xs uppercase tracking-wider text-zinc-600 hover:text-amber-700"
        >
          ← Gesprek
        </Link>
      </header>

      <div className="max-w-prose mx-auto px-6 py-12">
        <div className="mono text-xs uppercase tracking-wider text-zinc-600 mb-2">
          jouw voorstellen
        </div>
        <h1 className="text-3xl font-semibold mb-6">Wat ik je zou aanraden</h1>
        <p className="text-zinc-600 mb-8 leading-relaxed">
          Elk kaartje is één specifieke automatisering die ik voor jouw bedrijf heb
          uitgedacht. Goedkeuren om te installeren, aanpassen als je iets wilt
          tweaken, of afwijzen als het niet klopt. Ik installeer nooit iets zonder
          jouw expliciete goedkeuring.
        </p>

        {loading && <p className="text-zinc-600">Laden…</p>}

        {!loading && prescriptions.length === 0 && (
          <div className="border border-cream-200 rounded-md p-8 text-center">
            <p className="text-zinc-600 mb-4">
              Nog geen voorstellen. Doe eerst het intake-gesprek.
            </p>
            <Link
              href="/intake"
              className="inline-block min-h-[44px] px-6 py-3 rounded-md font-medium bg-amber-600 text-white hover:bg-amber-700"
            >
              Start het gesprek
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

        {/* Hoe nu verder? — only when there's at least one approved prescription */}
        {!loading && prescriptions.some((p) => p.status === "approved") && (
          <NextStepsBlock approvedCount={prescriptions.filter((p) => p.status === "approved").length} />
        )}
      </div>
    </main>
  );
}

interface NextStepsBlockProps {
  approvedCount: number;
}

/**
 * Closing handoff after approve. Two paths:
 *   1. Doe het zelf (DIY) — free, OSS, link to GitHub setup docs
 *   2. Laat MKBStack het installeren — paid implementation service, mailto offerte
 *
 * Honest framing: both paths visible, no pressure, no upsell language.
 * The mailto subject line carries the approved-skill names so the founders
 * can quote intelligently without needing a separate form.
 */
function NextStepsBlock({ approvedCount }: NextStepsBlockProps) {
  const subject = encodeURIComponent(
    `Offerte aanvraag — ${approvedCount} goedgekeurde MKBStack-automatisering${approvedCount === 1 ? "" : "en"}`
  );
  const body = encodeURIComponent(
    `Hoi MKBStack-team,\n\n` +
      `Ik heb het intake-gesprek gedaan en ${approvedCount} voorstel${approvedCount === 1 ? "" : "len"} goedgekeurd. ` +
      `Ik zou graag een offerte ontvangen voor de installatie.\n\n` +
      `[Korte beschrijving van mijn bedrijf, indien gewenst]\n\n` +
      `Bel me terug op: [telefoonnummer]\n\n` +
      `Groeten,\n[naam]`
  );
  const mailto = `mailto:hallo@mkbstack.nl?subject=${subject}&body=${body}`;

  return (
    <section className="mt-16 pt-12 border-t border-cream-200">
      <h2 className="text-2xl font-semibold mb-3">Hoe nu verder?</h2>
      <p className="text-zinc-600 mb-8 leading-relaxed">
        Je hebt {approvedCount} voorstel{approvedCount === 1 ? "" : "len"}{" "}
        goedgekeurd. Twee paden:
      </p>

      <div className="space-y-6">
        {/* Path 1: DIY */}
        <article className="border border-cream-200 rounded-lg p-6 bg-white">
          <div className="mono text-xs uppercase tracking-wider text-zinc-600 mb-2">
            pad 1 — gratis
          </div>
          <h3 className="text-xl font-semibold mb-3">
            Ik installeer het zelf
          </h3>
          <p className="text-zinc-800 leading-relaxed mb-4">
            MKBStack is open source. De stappen onder elk goedgekeurd voorstel
            tellen op tot een handleiding die je in je eigen tempo kunt
            doorlopen. Je betaalt alleen rechtstreeks aan de leveranciers van
            de tools (Twilio, Anthropic, etc.).
          </p>
          <a
            href="https://github.com/mkbstack/mkbstack#quickstart"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-amber-700 underline hover:text-amber-800"
          >
            Bekijk de installatie-documentatie →
          </a>
        </article>

        {/* Path 2: Hire */}
        <article className="border border-cream-200 rounded-lg p-6 bg-amber-50">
          <div className="mono text-xs uppercase tracking-wider text-amber-700 mb-2">
            pad 2 — betaalde implementatie
          </div>
          <h3 className="text-xl font-semibold mb-3">
            Laat het MKBStack-team het installeren
          </h3>
          <p className="text-zinc-800 leading-relaxed mb-4">
            Geen tijd, geen technische achtergrond, of liever in één keer goed?
            Wij installeren de goedgekeurde voorstellen voor je en zorgen dat
            ze daadwerkelijk werken op jouw situatie. Je krijgt een offerte
            voor exact deze {approvedCount} automatisering
            {approvedCount === 1 ? "" : "en"} — geen abonnement, geen retainer.
          </p>
          <a
            href={mailto}
            className="inline-block min-h-[44px] px-6 py-3 rounded-md font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
          >
            Vraag een offerte aan
          </a>
          <p className="mt-4 text-xs text-zinc-600 italic">
            Geen verplichting. We bellen je terug binnen 1 werkdag, je beslist
            daarna of je verder wilt.
          </p>
        </article>
      </div>
    </section>
  );
}
