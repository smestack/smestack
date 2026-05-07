import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voorstellen — MKBStack",
  description:
    "Concrete, risico-getoetste automatiseringen voor jouw MKB-bedrijf. Goedkeuren, aanpassen of afwijzen. Niets gaat live zonder jouw expliciete groen licht.",
  // Voorstellen is per-user state from localStorage — nothing to index.
  robots: { index: false, follow: true },
};

export default function VoorstellenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
