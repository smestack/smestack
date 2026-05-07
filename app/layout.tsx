import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { LocaleProvider } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mkbstack.nl";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "MKBStack — De AI-manager, geïnstalleerd bij jouw bedrijf",
    template: "%s — MKBStack",
  },
  description:
    "MKBStack is een open-source AI-manager voor MKB-ondernemers. Gratis intake-gesprek, concrete voorstellen die jij goedkeurt voordat er iets live gaat. Geen abonnement, geen lock-in.",
  applicationName: "MKBStack",
  authors: [{ name: "Karel Schorer" }, { name: "Jeroen" }],
  keywords: [
    "AI voor MKB",
    "AI-manager",
    "automatisering MKB",
    "open source AI",
    "Nederlands MKB",
    "ondernemers automatisering",
    "ZZP automatisering",
    "AI assistent bedrijf",
  ],
  alternates: {
    canonical: "/",
    languages: {
      "nl-NL": "/",
      "en-US": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "nl_NL",
    alternateLocale: "en_US",
    siteName: "MKBStack",
    title: "MKBStack — De AI-manager, geïnstalleerd bij jouw bedrijf",
    description:
      "Open-source AI-manager voor MKB-ondernemers. Gratis intake, concrete voorstellen die jij goedkeurt.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "MKBStack — De AI-manager, geïnstalleerd bij jouw bedrijf",
    description:
      "Open-source AI-manager voor MKB-ondernemers. Gratis intake, concrete voorstellen die jij goedkeurt.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "MKBStack",
  url: SITE_URL,
  description:
    "Open-source AI-manager voor MKB-ondernemers. Gratis intake-gesprek, concrete risico-getoetste automatiseringen die de ondernemer expliciet goedkeurt.",
  founder: [
    { "@type": "Person", name: "Karel Schorer" },
    { "@type": "Person", name: "Jeroen" },
  ],
  email: "hallo@mkbstack.nl",
  sameAs: ["https://github.com/mkbstack/mkbstack"],
  areaServed: { "@type": "Country", name: "Netherlands" },
  knowsLanguage: ["nl", "en"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </head>
      <body className="min-h-screen">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
