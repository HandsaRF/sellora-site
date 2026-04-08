import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

import type { ListingRecord, PurchaseTransactionRecord } from "@/lib/sellora";

type DummyTransactionPayload = {
  matched_listing_id?: number | null;
  listing_title: string;
  style?: string | null;
  transaction_id: string;
  quantity: number;
  subtotal_usd: number;
  product_cost_snapshot_usd?: number | null;
  supplier_shipping_cost_usd?: number | null;
  estimated_fees_usd?: number | null;
  extra_cost_usd?: number | null;
  event_date?: string | null;
  review_notes?: string | null;
};

type DummyTransactionStore = Record<string, PurchaseTransactionRecord[]>;

const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const DUMMY_TRANSACTIONS_PATH = path.join(DATA_DIR, "web-dummy-transactions.json");

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readStore(): Promise<DummyTransactionStore> {
  await ensureDataDir();

  try {
    const raw = await readFile(DUMMY_TRANSACTIONS_PATH, "utf8");
    const parsed = JSON.parse(raw) as DummyTransactionStore;
    return parsed ?? {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

async function writeStore(store: DummyTransactionStore) {
  await ensureDataDir();
  await writeFile(DUMMY_TRANSACTIONS_PATH, JSON.stringify(store, null, 2), "utf8");
}

function roundMoney(value?: number | null) {
  if (value === null || value === undefined) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

function calculateEstimatedProfit(payload: DummyTransactionPayload) {
  const totalCost =
    (payload.product_cost_snapshot_usd ?? 0) +
    (payload.supplier_shipping_cost_usd ?? 0) +
    (payload.estimated_fees_usd ?? 0) +
    (payload.extra_cost_usd ?? 0);

  return roundMoney(payload.subtotal_usd - totalCost) ?? 0;
}

function deriveConfidence(payload: DummyTransactionPayload) {
  if (!payload.matched_listing_id) {
    return "Needs Review";
  }

  if (payload.supplier_shipping_cost_usd === null || payload.supplier_shipping_cost_usd === undefined) {
    return "Missing Shipping Cost";
  }

  return "Estimated";
}

function normalizePayload(payload: DummyTransactionPayload) {
  const listingTitle = payload.listing_title.trim();
  const transactionId = payload.transaction_id.trim();

  if (!listingTitle) {
    throw new Error("Listing title is required.");
  }

  if (!transactionId) {
    throw new Error("Transaction ID is required.");
  }

  if (!Number.isFinite(payload.quantity) || payload.quantity < 1) {
    throw new Error("Quantity must be at least 1.");
  }

  if (!Number.isFinite(payload.subtotal_usd) || payload.subtotal_usd < 0) {
    throw new Error("Subtotal must be zero or greater.");
  }

  const normalized: DummyTransactionPayload = {
    matched_listing_id: payload.matched_listing_id ?? null,
    listing_title: listingTitle,
    style: payload.style?.trim() || null,
    transaction_id: transactionId,
    quantity: payload.quantity,
    subtotal_usd: roundMoney(payload.subtotal_usd) ?? 0,
    product_cost_snapshot_usd: roundMoney(payload.product_cost_snapshot_usd),
    supplier_shipping_cost_usd: roundMoney(payload.supplier_shipping_cost_usd),
    estimated_fees_usd: roundMoney(payload.estimated_fees_usd),
    extra_cost_usd: roundMoney(payload.extra_cost_usd),
    event_date: payload.event_date?.trim() || new Date().toISOString().slice(0, 10),
    review_notes: payload.review_notes?.trim() || null,
  };

  return {
    ...normalized,
    estimated_profit_usd: calculateEstimatedProfit(normalized),
    confidence_state: deriveConfidence(normalized),
  };
}

function resolveMatchedListingName(
  matchedListingId: number | null | undefined,
  listings: ListingRecord[],
) {
  if (!matchedListingId) {
    return null;
  }

  return listings.find((listing) => listing.id === matchedListingId)?.product_name ?? null;
}

export async function getDummyTransactionsForStore(storeId: number) {
  const store = await readStore();
  return store[String(storeId)] ?? [];
}

export async function createDummyTransactionForStore(
  storeId: number,
  payload: DummyTransactionPayload,
  listings: ListingRecord[],
) {
  const store = await readStore();
  const key = String(storeId);
  const transactions = store[key] ?? [];
  const normalized = normalizePayload(payload);

  if (transactions.some((transaction) => transaction.transaction_id === normalized.transaction_id)) {
    throw new Error("This store already has a transaction with the same transaction ID.");
  }

  const now = new Date().toISOString();
  const nextId =
    transactions.reduce((maxId, transaction) => Math.max(maxId, transaction.id), 0) + 1;

  const record: PurchaseTransactionRecord = {
    id: nextId,
    store_id: storeId,
    matched_listing_id: normalized.matched_listing_id ?? null,
    matched_listing_name: resolveMatchedListingName(normalized.matched_listing_id, listings),
    source_type: "dummy",
    transaction_id: normalized.transaction_id,
    listing_title: normalized.listing_title,
    style: normalized.style ?? null,
    quantity: normalized.quantity,
    subtotal_usd: normalized.subtotal_usd,
    product_cost_snapshot_usd: normalized.product_cost_snapshot_usd ?? null,
    supplier_shipping_cost_usd: normalized.supplier_shipping_cost_usd ?? null,
    estimated_fees_usd: normalized.estimated_fees_usd ?? null,
    extra_cost_usd: normalized.extra_cost_usd ?? null,
    estimated_profit_usd: normalized.estimated_profit_usd,
    confidence_state: normalized.confidence_state,
    event_date: normalized.event_date ?? null,
    review_notes: normalized.review_notes ?? null,
    created_at: now,
    updated_at: now,
  };

  store[key] = [record, ...transactions];
  await writeStore(store);
  return record;
}

export async function updateDummyTransactionForStore(
  storeId: number,
  transactionId: number,
  payload: DummyTransactionPayload,
  listings: ListingRecord[],
) {
  const store = await readStore();
  const key = String(storeId);
  const transactions = store[key] ?? [];
  const normalized = normalizePayload(payload);
  const existing = transactions.find((transaction) => transaction.id === transactionId);

  if (!existing) {
    throw new Error("Transaction not found.");
  }

  if (
    transactions.some(
      (transaction) =>
        transaction.id !== transactionId &&
        transaction.transaction_id === normalized.transaction_id,
    )
  ) {
    throw new Error("This store already has a transaction with the same transaction ID.");
  }

  const updated: PurchaseTransactionRecord = {
    ...existing,
    matched_listing_id: normalized.matched_listing_id ?? null,
    matched_listing_name: resolveMatchedListingName(normalized.matched_listing_id, listings),
    transaction_id: normalized.transaction_id,
    listing_title: normalized.listing_title,
    style: normalized.style ?? null,
    quantity: normalized.quantity,
    subtotal_usd: normalized.subtotal_usd,
    product_cost_snapshot_usd: normalized.product_cost_snapshot_usd ?? null,
    supplier_shipping_cost_usd: normalized.supplier_shipping_cost_usd ?? null,
    estimated_fees_usd: normalized.estimated_fees_usd ?? null,
    extra_cost_usd: normalized.extra_cost_usd ?? null,
    estimated_profit_usd: normalized.estimated_profit_usd,
    confidence_state: normalized.confidence_state,
    event_date: normalized.event_date ?? null,
    review_notes: normalized.review_notes ?? null,
    updated_at: new Date().toISOString(),
  };

  store[key] = transactions.map((transaction) =>
    transaction.id === transactionId ? updated : transaction,
  );
  await writeStore(store);
  return updated;
}

export async function deleteDummyTransactionForStore(storeId: number, transactionId: number) {
  const store = await readStore();
  const key = String(storeId);
  const transactions = store[key] ?? [];
  const existing = transactions.find((transaction) => transaction.id === transactionId);

  if (!existing) {
    throw new Error("Transaction not found.");
  }

  const remaining = transactions.filter((transaction) => transaction.id !== transactionId);

  if (remaining.length > 0) {
    store[key] = remaining;
  } else {
    delete store[key];
  }

  await writeStore(store);
  return existing;
}
