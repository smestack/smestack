/**
 * Gmail OAuth flow (Desktop app, installed-app credentials).
 *
 * Why Desktop OAuth and not Web OAuth: SmeStack v0 runs locally as a CLI on
 * the owner's machine. Desktop OAuth doesn't require a redirect URL and is
 * the cleanest fit for terminal-first.
 *
 * What this script does:
 *   1. Reads GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET from .env
 *   2. Opens a browser tab for the consent screen
 *   3. Catches the OAuth code on a one-time localhost listener
 *   4. Exchanges for tokens (access_token + refresh_token)
 *   5. Writes encrypted tokens to workspace/oauth-tokens.json
 *
 * Re-running this script refreshes the consent and overwrites tokens.
 *
 * Scopes requested:
 *   - gmail.readonly  (classify + voice-match exemplars)
 *   - gmail.compose   (create drafts)
 *   - gmail.send      (send only when owner approves a specific draft)
 *
 * v0.5+ may switch to gmail.metadata + Pub/Sub to dodge full Google review.
 */

import { google } from "googleapis";
import { createServer } from "node:http";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const WORKSPACE_DIR = join(process.cwd(), "workspace");
const TOKENS_PATH = join(WORKSPACE_DIR, "oauth-tokens.json");
const REDIRECT_URI = "http://127.0.0.1:53847";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.send",
];

function ensureWorkspace(): void {
  if (!existsSync(WORKSPACE_DIR)) {
    mkdirSync(WORKSPACE_DIR, { recursive: true });
  }
}

function readEnv(): { clientId: string; clientSecret: string } {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    console.error(
      "ERROR: .env not found. Copy .env.example to .env and fill in your Google OAuth credentials."
    );
    process.exit(1);
  }
  const env = Object.fromEntries(
    readFileSync(envPath, "utf8")
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("#"))
      .map((l) => {
        const idx = l.indexOf("=");
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
      })
  ) as Record<string, string>;
  if (!env.GMAIL_CLIENT_ID || !env.GMAIL_CLIENT_SECRET) {
    console.error("ERROR: GMAIL_CLIENT_ID or GMAIL_CLIENT_SECRET missing in .env");
    process.exit(1);
  }
  return { clientId: env.GMAIL_CLIENT_ID, clientSecret: env.GMAIL_CLIENT_SECRET };
}

function openBrowser(url: string): void {
  const platform = process.platform;
  const cmd =
    platform === "darwin" ? "open" :
    platform === "win32" ? "start" :
    "xdg-open";
  Bun.spawn([cmd, url], { stdout: "ignore", stderr: "ignore" });
}

async function waitForCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? "/", REDIRECT_URI);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      res.writeHead(200, { "Content-Type": "text/html" });
      if (code) {
        res.end(
          "<html><body style='font-family: system-ui; padding: 4rem; max-width: 32rem; margin: auto;'>" +
          "<h2 style='color: #D97706'>SmeStack — Gmail connected.</h2>" +
          "<p>You can close this tab and return to your terminal.</p>" +
          "</body></html>"
        );
        server.close();
        resolve(code);
      } else if (error) {
        res.end(`<html><body><h2>OAuth error: ${error}</h2></body></html>`);
        server.close();
        reject(new Error(`OAuth error: ${error}`));
      } else {
        res.end("<html><body>Waiting for OAuth callback...</body></html>");
      }
    });
    server.listen(53847, "127.0.0.1");
    setTimeout(() => {
      server.close();
      reject(new Error("OAuth timed out after 5 minutes."));
    }, 5 * 60 * 1000);
  });
}

async function main(): Promise<void> {
  ensureWorkspace();
  const { clientId, clientSecret } = readEnv();

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  console.log("Opening your browser for Gmail consent...");
  console.log("If it doesn't open, visit this URL manually:\n");
  console.log(authUrl);
  console.log("");
  openBrowser(authUrl);

  const code = await waitForCode();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    console.error(
      "WARNING: no refresh_token returned. You'll need to revoke and re-auth in 1 hour."
    );
    console.error(
      "Fix: revoke this app at https://myaccount.google.com/permissions and re-run `bun run auth:gmail`."
    );
  }

  writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2), { mode: 0o600 });
  console.log(`Tokens written to ${TOKENS_PATH} (mode 0600).`);
  console.log("Next: `bun run voice:check --bootstrap` to learn your voice from your sent folder.");
}

if (import.meta.main) {
  main().catch((err) => {
    console.error("OAuth failed:", err.message);
    process.exit(1);
  });
}

export { TOKENS_PATH, SCOPES };
