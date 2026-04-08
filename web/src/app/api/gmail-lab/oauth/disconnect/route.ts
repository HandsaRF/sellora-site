import { NextResponse } from "next/server";

import {
  clearGmailLabConnection,
  getGmailLabConnectionState,
} from "@/lib/gmail-lab-connection";

export async function POST() {
  await clearGmailLabConnection();
  const connection = await getGmailLabConnectionState();

  return NextResponse.json({ connection }, { status: 200 });
}
