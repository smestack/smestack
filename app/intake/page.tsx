import { ChatShell } from "@/components/ChatShell";
import Link from "next/link";

export default function IntakePage() {
  // Opener matches the SKILL.md tone — terse, warm, sets up that this is a
  // senior consultant, not a chatbot. Dutch.
  const opener =
    "Ik ben MKBStack — laten we ~20 minuten nemen om helder te krijgen wat jouw bedrijf doet. " +
    "Wat doet jouw bedrijf eigenlijk, in één zin — zoals je het tegen iemand op een borrel zou uitleggen?";

  return (
    <main className="min-h-screen">
      <header className="border-b border-cream-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="mono text-sm uppercase tracking-wider">
          MKBStack
        </Link>
        <Link
          href="/prescriptions"
          className="mono text-xs uppercase tracking-wider text-zinc-600 hover:text-amber-700"
        >
          Voorstellen →
        </Link>
      </header>

      <ChatShell
        skillName="business-intake"
        initialPrompt={opener}
        rightRailBullets={[]}
      />

      <div className="text-center pb-8 px-6">
        <Link
          href="/"
          className="text-sm text-zinc-600 underline hover:text-amber-700"
        >
          Pauzeer en hervat later
        </Link>
      </div>
    </main>
  );
}
