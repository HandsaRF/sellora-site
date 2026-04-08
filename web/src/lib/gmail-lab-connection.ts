import "server-only";

import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

import {
  ETSY_TRANSACTION_QUERY as LAB_QUERY,
  GmailLabConnectionState,
  GOOGLE_GMAIL_READONLY_SCOPE,
} from "@/lib/gmail-parser-lab";

const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const CONNECTION_PATH = path.join(DATA_DIR, "gmail-lab-connection.json");

export const GMAIL_LAB_OAUTH_STATE_COOKIE = "gmail_lab_oauth_state";

type GmailLabStoredConnection = {
  connected_email: string | null;
  access_token: string;
  refresh_token: string | null;
  token_type: string | null;
  scopes: string[];
  token_expires_at: string | null;
  connected_at: string;
  last_synced_at: string | null;
};

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GmailProfileResponse = {
  emailAddress?: string;
};

function getConfiguredRedirectUri(origin: string) {
  const override = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim();
  return override && override.length > 0
    ? override
    : `${origin}/api/gmail-lab/oauth/callback`;
}

function isGmailLabConfigured() {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim(),
  );
}

function normalizeScopes(scopeValue?: string | null) {
  return (scopeValue ?? "")
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0);
}

function computeExpiry(expiresInSeconds?: number) {
  if (!expiresInSeconds || !Number.isFinite(expiresInSeconds)) {
    return null;
  }

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  return expiresAt.toISOString();
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readStoredConnection() {
  await ensureDataDir();

  try {
    const raw = await fs.readFile(CONNECTION_PATH, "utf8");
    const parsed = JSON.parse(raw) as GmailLabStoredConnection;

    if (!parsed || typeof parsed !== "object" || !parsed.access_token) {
      return null;
    }

    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function writeStoredConnection(connection: GmailLabStoredConnection) {
  await ensureDataDir();
  await fs.writeFile(CONNECTION_PATH, JSON.stringify(connection, null, 2), "utf8");
}

export async function clearGmailLabConnection() {
  try {
    await fs.unlink(CONNECTION_PATH);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

export async function getGmailLabConnectionState(): Promise<GmailLabConnectionState> {
  const stored = await readStoredConnection();
  const configured = isGmailLabConfigured();

  return {
    is_configured: configured,
    connected: Boolean(stored && configured),
    status: !configured
      ? "not_configured"
      : stored
        ? "connected"
        : "not_connected",
    connected_email: stored?.connected_email ?? null,
    connected_at: stored?.connected_at ?? null,
    last_synced_at: stored?.last_synced_at ?? null,
    has_refresh_token: Boolean(stored?.refresh_token),
    token_expires_at: stored?.token_expires_at ?? null,
    scopes: stored?.scopes ?? [],
    query: LAB_QUERY,
  };
}

export function buildGoogleOAuthUrl(origin: string, state: string) {
  if (!isGmailLabConfigured()) {
    throw new Error("Google OAuth is not configured for the Gmail lab.");
  }

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID!.trim();
  const redirectUri = getConfiguredRedirectUri(origin);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_GMAIL_READONLY_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  return url.toString();
}

async function fetchGoogleToken(
  origin: string,
  params: URLSearchParams,
): Promise<TokenResponse> {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth client credentials are missing.");
  }

  params.set("client_id", clientId);
  params.set("client_secret", clientSecret);
  params.set("redirect_uri", getConfiguredRedirectUri(origin));

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
    cache: "no-store",
  });

  const data = (await response.json()) as TokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Google token exchange failed.");
  }

  return data;
}

async function fetchGmailProfile(accessToken: string) {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const data = (await response.json()) as GmailProfileResponse;

  if (!response.ok || !data.emailAddress) {
    throw new Error("Could not read the Gmail profile for the connected account.");
  }

  return data;
}

function mergeScopeLists(current: string[], incoming: string[]) {
  return Array.from(new Set([...current, ...incoming]));
}

export async function exchangeAuthorizationCode(origin: string, code: string) {
  const tokenData = await fetchGoogleToken(
    origin,
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
    }),
  );

  const profile = await fetchGmailProfile(tokenData.access_token!);
  const existing = await readStoredConnection();

  const connection: GmailLabStoredConnection = {
    connected_email: profile.emailAddress ?? null,
    access_token: tokenData.access_token!,
    refresh_token: tokenData.refresh_token ?? existing?.refresh_token ?? null,
    token_type: tokenData.token_type ?? existing?.token_type ?? "Bearer",
    scopes: mergeScopeLists(existing?.scopes ?? [], normalizeScopes(tokenData.scope)),
    token_expires_at: computeExpiry(tokenData.expires_in) ?? existing?.token_expires_at ?? null,
    connected_at: existing?.connected_at ?? new Date().toISOString(),
    last_synced_at: existing?.last_synced_at ?? null,
  };

  await writeStoredConnection(connection);
  return getGmailLabConnectionState();
}

async function refreshAccessToken(origin: string, refreshToken: string) {
  const tokenData = await fetchGoogleToken(
    origin,
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  );

  const existing = await readStoredConnection();

  if (!existing) {
    throw new Error("Gmail lab connection was missing during token refresh.");
  }

  const nextConnection: GmailLabStoredConnection = {
    ...existing,
    access_token: tokenData.access_token!,
    refresh_token: tokenData.refresh_token ?? existing.refresh_token,
    token_type: tokenData.token_type ?? existing.token_type,
    scopes: mergeScopeLists(existing.scopes, normalizeScopes(tokenData.scope)),
    token_expires_at: computeExpiry(tokenData.expires_in) ?? existing.token_expires_at,
  };

  await writeStoredConnection(nextConnection);
  return nextConnection;
}

export async function getValidGmailLabAccessToken(origin: string) {
  const stored = await readStoredConnection();

  if (!stored) {
    throw new Error("No Gmail lab connection is saved yet.");
  }

  const expiresAt = stored.token_expires_at ? Date.parse(stored.token_expires_at) : null;
  const isExpired = expiresAt !== null && Number.isFinite(expiresAt) && expiresAt <= Date.now() + 60_000;

  if (isExpired) {
    if (!stored.refresh_token) {
      throw new Error("The Gmail lab token expired and there is no refresh token. Reconnect Gmail.");
    }

    const refreshed = await refreshAccessToken(origin, stored.refresh_token);
    return refreshed.access_token;
  }

  return stored.access_token;
}

export async function markGmailLabSynced(at = new Date().toISOString()) {
  const stored = await readStoredConnection();

  if (!stored) {
    return getGmailLabConnectionState();
  }

  const nextConnection: GmailLabStoredConnection = {
    ...stored,
    last_synced_at: at,
  };

  await writeStoredConnection(nextConnection);
  return getGmailLabConnectionState();
}

export function createGmailLabOAuthState() {
  return randomUUID();
}
