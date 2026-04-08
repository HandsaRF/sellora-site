import { NextRequest, NextResponse } from "next/server";

import {
  getValidGmailLabAccessToken,
  getGmailLabConnectionState,
  markGmailLabSynced,
} from "@/lib/gmail-lab-connection";
import { appendGmailParserLabRun, listGmailParserLabRuns } from "@/lib/gmail-parser-history";
import {
  ETSY_TRANSACTION_QUERY,
  parseEtsyTransactionEmail,
} from "@/lib/gmail-parser-lab";

type SyncBody = {
  max_results?: unknown;
};

type GmailMessageListResponse = {
  messages?: Array<{
    id: string;
    threadId?: string;
  }>;
  nextPageToken?: string;
};

type GmailRawMessageResponse = {
  id?: string;
  raw?: string;
};

function normalizeMaxResults(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(250, Math.max(1, Math.trunc(value)));
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);

    if (Number.isFinite(parsed)) {
      return Math.min(250, Math.max(1, parsed));
    }
  }

  return 100;
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

async function fetchJson<T>(url: string, accessToken: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const data = (await response.json()) as T & { error?: { message?: string } };

  if (!response.ok) {
    throw new Error(data.error?.message || "Gmail API request failed.");
  }

  return data;
}

export async function POST(request: NextRequest) {
  let body: SyncBody = {};

  try {
    body = (await request.json()) as SyncBody;
  } catch {
    body = {};
  }

  const connection = await getGmailLabConnectionState();

  if (!connection.connected) {
    return NextResponse.json(
      { detail: "Connect Gmail in the parser lab before syncing Etsy emails." },
      { status: 400 },
    );
  }

  const maxResults = normalizeMaxResults(body.max_results);

  try {
    const accessToken = await getValidGmailLabAccessToken(request.nextUrl.origin);
    const messages: Array<{ id: string; threadId?: string }> = [];
    let nextPageToken: string | undefined;
    let pageCount = 0;

    while (messages.length < maxResults) {
      const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
      listUrl.searchParams.set("q", ETSY_TRANSACTION_QUERY);
      listUrl.searchParams.set("maxResults", String(Math.min(100, maxResults - messages.length)));

      if (nextPageToken) {
        listUrl.searchParams.set("pageToken", nextPageToken);
      }

      const listResponse = await fetchJson<GmailMessageListResponse>(listUrl.toString(), accessToken);
      messages.push(...(listResponse.messages ?? []));
      nextPageToken = listResponse.nextPageToken;
      pageCount += 1;

      if (!nextPageToken) {
        break;
      }
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const message of messages.slice(0, maxResults)) {
      const detailUrl = new URL(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
      );
      detailUrl.searchParams.set("format", "raw");

      const detail = await fetchJson<GmailRawMessageResponse>(detailUrl.toString(), accessToken);

      if (!detail.raw) {
        skippedCount += 1;
        continue;
      }

      const parsed = parseEtsyTransactionEmail(decodeBase64Url(detail.raw));
      const { created } = await appendGmailParserLabRun(parsed, {
        sourceMessageId: detail.id ?? message.id,
      });

      if (created) {
        importedCount += 1;
      } else {
        skippedCount += 1;
      }
    }

    const nextConnection = await markGmailLabSynced();
    const runs = await listGmailParserLabRuns();

    return NextResponse.json(
      {
        imported_count: importedCount,
        skipped_count: skippedCount,
        fetched_count: messages.length,
        page_count: pageCount,
        has_more: Boolean(nextPageToken),
        connection: nextConnection,
        runs,
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not sync Etsy Gmail messages yet.";

    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
