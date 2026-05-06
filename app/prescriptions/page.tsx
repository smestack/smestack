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
      </div>
    </main>
  );
}
