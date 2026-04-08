import { NextRequest, NextResponse } from "next/server";

import { getApiUrl, ListingRecord } from "@/lib/sellora";
import {
  deleteDummyTransactionForStore,
  updateDummyTransactionForStore,
} from "@/lib/dummy-transactions";

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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; transactionId: string }> },
) {
  try {
    const { id, transactionId } = await context.params;
    const storeId = Number(id);
    const transactionRowId = Number(transactionId);
    const payload = await request.json();
    const listings = await getStoreListings(storeId);
    const transaction = await updateDummyTransactionForStore(
      storeId,
      transactionRowId,
      payload,
      listings,
    );

    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json(
      {
        detail:
          error instanceof Error && error.message.trim()
            ? error.message
            : "Unable to update dummy transaction.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; transactionId: string }> },
) {
  try {
    const { id, transactionId } = await context.params;
    const storeId = Number(id);
    const transactionRowId = Number(transactionId);
    const transaction = await deleteDummyTransactionForStore(storeId, transactionRowId);

    return NextResponse.json(transaction);
  } catch (error) {
    return NextResponse.json(
      {
        detail:
          error instanceof Error && error.message.trim()
            ? error.message
            : "Unable to delete dummy transaction.",
      },
      { status: 400 },
    );
  }
}
