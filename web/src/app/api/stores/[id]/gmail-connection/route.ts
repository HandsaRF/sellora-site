import { NextRequest, NextResponse } from "next/server";

import { getGmailConnectionForStore, upsertGmailConnectionForStore } from "@/lib/gmail-connections";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const storeId = Number(id);
  const connection = await getGmailConnectionForStore(storeId);
  return NextResponse.json(connection);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const storeId = Number(id);
    const payload = await request.json();
    const connection = await upsertGmailConnectionForStore(storeId, payload);
    return NextResponse.json(connection);
  } catch (error) {
    return NextResponse.json(
      {
        detail:
          error instanceof Error && error.message.trim()
            ? error.message
            : "Unable to save the Gmail connection state.",
      },
      { status: 400 },
    );
  }
}
