import "server-only";

import { promises as fs } from "fs";
import path from "path";

import type { ListingRecord } from "@/lib/sellora";

type ListingProfileRecord = {
  listing_id: number;
  store_id: number;
  description?: string | null;
  title_aliases?: string[] | null;
  tags?: string[] | null;
  style_options?: string[] | null;
  supplier_link?: string | null;
  supplier_notes?: string | null;
  base_product_cost_usd?: number | null;
  style_cost_overrides?: Record<string, number> | null;
  expected_profit_target_usd?: number | null;
  expected_margin_target_pct?: number | null;
  extra_cost_usd?: number | null;
  updated_at?: string | null;
};

type ListingProfileStore = Record<string, ListingProfileRecord>;

type ListingProfilePayload = Omit<ListingProfileRecord, "listing_id" | "store_id" | "updated_at">;

const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const LISTING_PROFILES_PATH = path.join(DATA_DIR, "web-listing-profiles.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readStore(): Promise<ListingProfileStore> {
  await ensureDataDir();

  try {
    const raw = await fs.readFile(LISTING_PROFILES_PATH, "utf8");
    const parsed = JSON.parse(raw) as ListingProfileStore;
    return parsed ?? {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }

    throw error;
  }
}

async function writeStore(store: ListingProfileStore) {
  await ensureDataDir();
  await fs.writeFile(LISTING_PROFILES_PATH, JSON.stringify(store, null, 2), "utf8");
}

function roundMoney(value?: number | null) {
  if (value === null || value === undefined) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

function cleanOptionalText(value?: string | null) {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanStringList(values?: string[] | null) {
  if (!values) {
    return null;
  }

  const cleaned = values.map((value) => value.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : null;
}

function cleanStyleCostOverrides(overrides?: Record<string, number> | null) {
  if (!overrides) {
    return null;
  }

  const cleanedEntries = Object.entries(overrides)
    .map(([style, value]) => [style.trim(), roundMoney(value)] as const)
    .filter(([style, value]) => style.length > 0 && value !== null && value >= 0);

  if (cleanedEntries.length === 0) {
    return null;
  }

  return Object.fromEntries(cleanedEntries);
}

function normalizePayload(payload: ListingProfilePayload) {
  const baseProductCost = roundMoney(payload.base_product_cost_usd);
  const expectedProfitTarget = roundMoney(payload.expected_profit_target_usd);
  const expectedMarginTarget = roundMoney(payload.expected_margin_target_pct);
  const extraCost = roundMoney(payload.extra_cost_usd);

  if (baseProductCost !== null && baseProductCost < 0) {
    throw new Error("Base product cost cannot be negative.");
  }
  if (expectedProfitTarget !== null && expectedProfitTarget < 0) {
    throw new Error("Expected profit target cannot be negative.");
  }
  if (expectedMarginTarget !== null && expectedMarginTarget < 0) {
    throw new Error("Expected margin target cannot be negative.");
  }
  if (extraCost !== null && extraCost < 0) {
    throw new Error("Extra cost cannot be negative.");
  }

  return {
    description: cleanOptionalText(payload.description),
    title_aliases: cleanStringList(payload.title_aliases),
    tags: cleanStringList(payload.tags),
    style_options: cleanStringList(payload.style_options),
    supplier_link: cleanOptionalText(payload.supplier_link),
    supplier_notes: cleanOptionalText(payload.supplier_notes),
    base_product_cost_usd: baseProductCost,
    style_cost_overrides: cleanStyleCostOverrides(payload.style_cost_overrides),
    expected_profit_target_usd: expectedProfitTarget,
    expected_margin_target_pct: expectedMarginTarget,
    extra_cost_usd: extraCost,
  };
}

export async function enrichListingsWithProfiles(listings: ListingRecord[]) {
  const store = await readStore();

  return listings.map((listing) => ({
    ...listing,
    ...(store[String(listing.id)] ?? {}),
  }));
}

export async function upsertListingProfile(
  storeId: number,
  listingId: number,
  payload: ListingProfilePayload,
) {
  const store = await readStore();
  const normalized = normalizePayload(payload);
  const key = String(listingId);

  const record: ListingProfileRecord = {
    listing_id: listingId,
    store_id: storeId,
    ...normalized,
    updated_at: new Date().toISOString(),
  };

  store[key] = record;
  await writeStore(store);
  return record;
}
