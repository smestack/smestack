import type { Metadata } from "next";

// Mock content until real customer stories land. Keep search engines and
// AI-search out so the demo numbers don't get indexed and quoted as fact.
export const metadata: Metadata = {
  title: "Klantverhalen — MKBStack",
  description:
    "Vier MKB-ondernemers vertellen wat er gebeurde nadat ze MKBStack lieten installeren. Loodgieter, interieurontwerpster, glaszetter, elektricien.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function KlantverhalenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
