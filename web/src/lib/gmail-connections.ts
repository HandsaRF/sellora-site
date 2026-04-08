import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { GmailConnectionRecord, GmailConnectionStatus } from "@/lib/sellora";

type GmailConnectionStore = Record<string, GmailConnectionRecord>;

type GmailConnectionPayload = {
  gmail_account_email?: string | null;
  connection_status: GmailConnectionStatus;
  inbox_label?: string | null;
  sync_notes?: string | null;
  last_synced_at?: string | null;
};

const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const GMAIL_CONNECTIONS_PATH = path.join(DATA_DIR, "web-gmail-connections.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readStore(): Promise<GmailConnectionStore> {
  await ensureDataDir();

  try {
    const raw = await fs.readFile(GMAIL_CONNECTIONS_PATH, "utf8");
    const parsed = JSON.parse(raw) as GmailConnectionStore;
    return parsed ?? {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

async function writeStore(store: GmailConnectionStore) {
  await ensureDataDir();
  await fs.writeFile(GMAIL_CONNECTIONS_PATH, JSON.stringify(store, null, 2), "utf8");
}

function cleanOptionalText(value?: string | null) {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildDefaultRecord(storeId: number): GmailConnectionRecord {
  return {
    store_id: storeId,
    gmail_account_email: null,
    connection_status: "Not Connected",
    inbox_label: null,
    sync_notes: null,
    last_synced_at: null,
    updated_at: null,
  };
}

export async function getGmailConnectionForStore(storeId: number) {
  const store = await readStore();
  return store[String(storeId)] ?? buildDefaultRecord(storeId);
}

export async function upsertGmailConnectionForStore(
  storeId: number,
  payload: GmailConnectionPayload,
) {
  const store = await readStore();
  const record: GmailConnectionRecord = {
    store_id: storeId,
    gmail_account_email: cleanOptionalText(payload.gmail_account_email),
    connection_status: payload.connection_status,
    inbox_label: cleanOptionalText(payload.inbox_label),
    sync_notes: cleanOptionalText(payload.sync_notes),
    last_synced_at: cleanOptionalText(payload.last_synced_at),
    updated_at: new Date().toISOString(),
  };

  store[String(storeId)] = record;
  await writeStore(store);
  return record;
}
