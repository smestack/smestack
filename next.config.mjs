import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Pin the workspace root so the multi-lockfile warning goes quiet.
  // The smestack/ repo lives inside the medan/ worktree by sandbox
  // requirement; we tell Next which one is "ours."
  outputFileTracingRoot: __dirname,

  // Allow API routes to read SKILL.md files via @anthropic-ai/sdk + bun:sqlite.
  // (Renamed from experimental.serverComponentsExternalPackages in Next 15.)
  serverExternalPackages: ["@anthropic-ai/sdk", "better-sqlite3"],

  // Permanent redirect from the old /prescriptions URL to /voorstellen.
  // 'prescriptie' was a clinical-sounding loan word; 'voorstel' is what
  // we actually call them in the UI. Keep the old URL working for any
  // bookmarks or links that landed in the wild.
  async redirects() {
    return [
      { source: "/prescriptions", destination: "/voorstellen", permanent: true },
    ];
  },
};

export default nextConfig;
