import { ChatShell } from "@/components/ChatShell";
import Link from "next/link";

export default function IntakePage() {
  // The opening line is set up to match the SKILL.md tone — terse, warm,
  // sets up that this is a senior consultant, not a chatbot.
  const opener =
    "I'm SmeStack — let's spend ~20 minutes getting clear on your business. " +
    "What does your business actually do, in one sentence — the way you'd " +
    "describe it to a stranger at a borrel?";

  return (
    <main className="min-h-screen">
      <header className="border-b border-cream-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="mono text-sm uppercase tracking-wider">
          SmeStack
        </Link>
        <Link
          href="/prescriptions"
          className="mono text-xs uppercase tracking-wider text-zinc-600 hover:text-amber-700"
        >
          Prescriptions →
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
          Pause and resume later
        </Link>
      </div>
    </main>
  );
}
