import { NextRequest, NextResponse } from "next/server";

import { getApiUrl, ListingRecord } from "@/lib/sellora";
import { createDummyTransactionForStore } from "@/lib/dummy-transactions";

async function getStoreListings(storeId: number): Promise<ListingRecord[]> {
  try {
    const response = await fetch(getApiUrl(`/stores/${storeId}/listings`), { cache: "no-store" });
    if (!response.ok) {
      return [];
    }

    return (await response.json()) as ListingRecord[];
  } catch {
    return [];
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const storeId = Number(id);
    const payload = await request.json();
    const listings = await getStoreListings(storeId);
    const transaction = await createDummyTransactionForStore(storeId, payload, listings);

    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json(
      {
        detail:
          error instanceof Error && error.message.trim()
            ? error.message
            : "Unable to create dummy transaction.",
      },
      { status: 400 },
    );
  }
}
