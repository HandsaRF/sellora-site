import { NextRequest, NextResponse } from "next/server";

import { upsertListingProfile } from "@/lib/listing-profiles";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string; listingId: string }> },
) {
  try {
    const { id, listingId } = await context.params;
    const storeId = Number(id);
    const listingRecordId = Number(listingId);
    const payload = await request.json();
    const profile = await upsertListingProfile(storeId, listingRecordId, payload);

    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json(
      {
        detail:
          error instanceof Error && error.message.trim()
            ? error.message
            : "Unable to save the listing profile.",
      },
      { status: 400 },
    );
  }
}
