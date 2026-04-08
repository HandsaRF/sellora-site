import { NextRequest, NextResponse } from "next/server";

import { appendGmailParserLabRun } from "@/lib/gmail-parser-history";
import { parseEtsyTransactionEmail } from "@/lib/gmail-parser-lab";

type ParseRequestBody = {
  raw_email?: unknown;
};

function normalizeRawEmail(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const joined = value
      .filter((part): part is string => typeof part === "string")
      .join("\n")
      .trim();

    return joined.length > 0 ? joined : "";
  }

  return "";
}

export async function POST(request: NextRequest) {
  let body: ParseRequestBody;

  try {
    body = (await request.json()) as ParseRequestBody;
  } catch {
    return NextResponse.json(
      { detail: "Could not read the Gmail lab payload." },
      { status: 400 },
    );
  }

  const rawEmail = normalizeRawEmail(body.raw_email);

  if (!rawEmail) {
    return NextResponse.json(
      { detail: "Paste a raw Etsy email or upload a .eml file first." },
      { status: 400 },
    );
  }

  const parsed = parseEtsyTransactionEmail(rawEmail);
  const { run } = await appendGmailParserLabRun(parsed);

  return NextResponse.json({ run }, { status: 201 });
}
