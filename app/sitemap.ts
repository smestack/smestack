import type { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mkbstack.nl";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/handleidingen`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/handleidingen/moneybird-api-sleutel.html`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    // Klantverhalen is mock — keep it out of the sitemap until real.
    // Intake + voorstellen are interactive flows; no SEO value in indexing.
  ];
}
