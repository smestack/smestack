import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start het gesprek — MKBStack",
  description:
    "Een vrijblijvend gesprek van ~20 minuten over jouw MKB-bedrijf. Daarna concrete, risico-getoetste voorstellen die jij goedkeurt voordat er iets live gaat.",
  // The intake itself shouldn't rank — it's an interactive flow, not content.
  // Index the landing page instead.
  robots: { index: false, follow: true },
};

export default function IntakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
