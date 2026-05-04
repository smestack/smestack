import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-prose text-center">
        {/* Brand wordmark */}
        <div className="mono text-sm uppercase tracking-wider text-zinc-600 mb-12">
          SmeStack
        </div>

        {/* The pitch in one sentence */}
        <h1 className="text-4xl sm:text-5xl font-semibold leading-tight mb-6">
          The AI manager, installed at your business.
        </h1>

        <p className="text-lg text-zinc-600 mb-12 leading-relaxed">
          A 20-minute conversation about your business. Then risk-assessed
          prescriptions you approve before anything gets installed.
        </p>

        {/* Single CTA */}
        <Link
          href="/intake"
          className="inline-block min-h-[44px] px-8 py-3 rounded-md font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
        >
          Start the intake
        </Link>

        <p className="mt-6 text-sm text-zinc-600 italic">
          ~20 minutes. Pause and resume any time.
        </p>
      </div>

      {/* Footer */}
      <footer className="mt-24 max-w-prose text-center text-sm text-zinc-600">
        <Link
          href="/prescriptions"
          className="underline hover:text-amber-700"
        >
          See current prescriptions
        </Link>
        {" · "}
        <span className="mono text-xs">v0.1 — local mode</span>
      </footer>
    </main>
  );
}
