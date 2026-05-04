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
          SmeStack
        </Link>
        <Link
          href="/intake"
          className="mono text-xs uppercase tracking-wider text-zinc-600 hover:text-amber-700"
        >
          ← Intake
        </Link>
      </header>

      <div className="max-w-prose mx-auto px-6 py-12">
        <div className="mono text-xs uppercase tracking-wider text-zinc-600 mb-2">
          your prescriptions
        </div>
        <h1 className="text-3xl font-semibold mb-6">What I'd recommend</h1>
        <p className="text-zinc-600 mb-8 leading-relaxed">
          Each card is one specific automation I've thought through for your
          business. Approve to install, modify if you want a tweak, or reject
          if it's not right. I'll never install anything without your one-tap
          approval.
        </p>

        {loading && <p className="text-zinc-600">Loading…</p>}

        {!loading && prescriptions.length === 0 && (
          <div className="border border-cream-200 rounded-md p-8 text-center">
            <p className="text-zinc-600 mb-4">
              No prescriptions yet. Run through the intake first.
            </p>
            <Link
              href="/intake"
              className="inline-block min-h-[44px] px-6 py-3 rounded-md font-medium bg-amber-600 text-white hover:bg-amber-700"
            >
              Start the intake
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
