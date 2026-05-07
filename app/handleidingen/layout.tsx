import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Handleidingen — MKBStack",
  description:
    "Stap-voor-stap handleidingen voor de tools die MKBStack koppelt aan jouw bedrijf. Geen voorkennis nodig, met schermafbeeldingen.",
  // Real, evergreen content — index this.
  robots: { index: true, follow: true },
};

export default function HandleidingenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
