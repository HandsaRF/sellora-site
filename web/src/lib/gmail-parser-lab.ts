export const ETSY_TRANSACTION_SENDER = "transaction@etsy.com";
export const ETSY_TRANSACTION_QUERY = "from:transaction@etsy.com";
export const GOOGLE_GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export type ParserEventType =
  | "sale"
  | "processing"
  | "refund_completed"
  | "refund_failed"
  | "unknown";
export type ParserConfidence = "High" | "Medium" | "Low" | "Unsupported";

export type ParsedSaleLineItem = {
  transaction_id: string | null;
  listing_title: string | null;
  style: string | null;
  quantity: number | null;
  item_price_usd: number | null;
};

export type ParsedSaleFields = {
  store_name: string | null;
  seller_name: string | null;
  item_count: number;
  subtotal_usd: number | null;
};

export type ParsedRefundFields = {
  order_number: string | null;
  refund_amount_usd: number | null;
  refund_status: "completed" | "failed" | null;
  affects_finance: boolean | null;
  transaction_id: string | null;
  listing_title: string | null;
  refund_reason: string | null;
};

export type GmailParserLabResult = {
  sender: string | null;
  subject: string | null;
  received_at: string | null;
  event_type: ParserEventType;
  sender_match: boolean;
  parsed_fields: ParsedSaleFields;
  refund_fields: ParsedRefundFields;
  line_items: ParsedSaleLineItem[];
  matched_fields: string[];
  missing_fields: string[];
  confidence: ParserConfidence;
  notes: string[];
  normalized_preview: string;
};

export type GmailParserLabRun = {
  id: string;
  source_message_id?: string | null;
  created_at: string;
  event_type: ParserEventType;
  confidence: ParserConfidence;
  sender: string | null;
  subject: string | null;
  received_at: string | null;
  parsed_fields: ParsedSaleFields;
  refund_fields: ParsedRefundFields;
  line_items: ParsedSaleLineItem[];
  matched_fields: string[];
  missing_fields: string[];
  notes: string[];
  normalized_preview: string;
};

export type GmailLabConnectionStatus =
  | "not_configured"
  | "not_connected"
  | "connected"
  | "needs_reauth";

export type GmailLabConnectionState = {
  is_configured: boolean;
  connected: boolean;
  status: GmailLabConnectionStatus;
  connected_email: string | null;
  connected_at: string | null;
  last_synced_at: string | null;
  has_refresh_token: boolean;
  token_expires_at: string | null;
  scopes: string[];
  query: string;
};

type ParserHints = {
  sender?: string | null;
  subject?: string | null;
  received_at?: string | null;
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function decodeQuotedPrintable(value: string) {
  const withoutSoftBreaks = value.replace(/=(\r?\n)/g, "");

  return withoutSoftBreaks.replace(/=([A-Fa-f0-9]{2})/g, (_match, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
}

function extractHeader(raw: string, headerName: string) {
  const escapedName = headerName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = raw.match(
    new RegExp(`^${escapedName}:\\s*([^\\n]*(?:\\n[ \\t][^\\n]*)*)`, "im"),
  );

  if (!match?.[1]) {
    return null;
  }

  return normalizeWhitespace(match[1].replace(/\n[ \t]+/g, " "));
}

function extractPlainTextBody(raw: string) {
  const normalized = raw.replace(/\r\n/g, "\n");
  const plainIndex = normalized.search(/Content-Type:\s*text\/plain/i);

  if (plainIndex === -1) {
    return normalized;
  }

  const boundaryMatch = normalized.match(/boundary="([^"]+)"/i);
  const plainSection = normalized.slice(plainIndex);
  const contentStart = plainSection.search(/\n\n/);

  if (contentStart === -1) {
    return plainSection;
  }

  const content = plainSection.slice(contentStart + 2);

  if (!boundaryMatch?.[1]) {
    return content;
  }

  const boundary = `\n--${boundaryMatch[1]}`;
  const boundaryIndex = content.indexOf(boundary);

  if (boundaryIndex === -1) {
    return content;
  }

  return content.slice(0, boundaryIndex);
}

function extractCurrencyValue(value: string | null) {
  if (!value) {
    return null;
  }

  const numericValue = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(numericValue) ? numericValue : null;
}

function extractNumber(value: string | null) {
  if (!value) {
    return null;
  }

  const numericValue = Number.parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function extractLineValue(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return normalizeWhitespace(match[1]);
    }
  }

  return null;
}

function extractRepeatedValues(text: string, pattern: RegExp) {
  const values: string[] = [];

  for (const match of text.matchAll(pattern)) {
    const value = match[1] ? normalizeWhitespace(match[1]) : "";
    if (value) {
      values.push(value);
    }
  }

  return values;
}

function pickMostCommonValue(values: string[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  let winner: string | null = null;
  let winnerCount = -1;

  for (const [value, count] of counts.entries()) {
    if (count > winnerCount) {
      winner = value;
      winnerCount = count;
    }
  }

  return winner;
}

function extractStorefrontName(decodedEmail: string, sellerName: string | null) {
  const rawCandidates = extractRepeatedValues(decodedEmail, /Shop:\s*([^<\r\n]+)/gi)
    .map((candidate) => candidate.replace(/^Shop:\s*/i, "").trim())
    .filter((candidate) => candidate.length > 0 && !candidate.includes("@"));

  const filteredCandidates = rawCandidates.filter((candidate) => {
    if (!sellerName) {
      return true;
    }

    return candidate.toLowerCase() !== sellerName.toLowerCase();
  });

  return pickMostCommonValue(filteredCandidates) ?? sellerName;
}

function extractRefundListingTitle(decodedEmail: string) {
  for (const match of decodedEmail.matchAll(
    /href\s*=\s*["'][^"']*transaction\/[0-9]+\?[^"']*["'][^>]*>\s*([^<]+?)\s*<\/a>/gi,
  )) {
    const value = match[1] ? normalizeWhitespace(match[1]) : "";

    if (value && !/^transaction id:/i.test(value)) {
      return value;
    }
  }

  return null;
}

function extractRefundReason(plainText: string) {
  return extractLineValue(plainText, [
    /Refund reason\s*([\s\S]*?)(?=\n\s*(?:Message to buyer:|Don't recognize this transaction\?|Thanks, Etsy))/i,
  ]);
}

function extractRefundAmount(plainText: string, decodedEmail: string) {
  return extractCurrencyValue(
    extractLineValue(plainText, [
      /refund of\s*\$([0-9.,]+)/i,
      /We've refunded[\s\S]*?\$([0-9.,]+)\s*USD/i,
    ]) ??
      extractLineValue(decodedEmail, [
        /currency-value['"]>\s*([0-9.,]+)\s*<\/span>\s*for Order/i,
      ]),
  );
}

function extractLineItems(plainText: string): ParsedSaleLineItem[] {
  const sections = plainText
    .split(/(?=Transaction ID:\s*\d+)/i)
    .slice(1);

  return sections
    .map((section) => {
      const transactionId = extractLineValue(section, [/Transaction ID:\s*([0-9]+)/i]);
      const listingTitle = extractLineValue(section, [
        /Item:\s*([\s\S]*?)(?=\s*(?:Style:|Personalization:|Quantity:|Item price:))/i,
      ]);
      const style = extractLineValue(section, [/Style:\s*([^\n]+)/i]);
      const quantity = extractNumber(extractLineValue(section, [/Quantity:\s*([0-9]+)/i]));
      const itemPrice = extractCurrencyValue(
        extractLineValue(section, [/Item price:\s*(?:US\$|\$)\s*([0-9.,]+)/i]),
      );

      if (!transactionId && !listingTitle) {
        return null;
      }

      return {
        transaction_id: transactionId,
        listing_title: listingTitle,
        style,
        quantity,
        item_price_usd: itemPrice,
      };
    })
    .filter((item): item is ParsedSaleLineItem => item !== null);
}

function buildNotes(
  eventType: ParserEventType,
  senderMatch: boolean,
  lineItems: ParsedSaleLineItem[],
  refundFields: ParsedRefundFields,
  missingFields: string[],
) {
  const notes: string[] = [];

  if (senderMatch) {
    notes.push(`Sender matches ${ETSY_TRANSACTION_SENDER}.`);
  } else {
    notes.push("Sender does not match the official Etsy transaction sender yet.");
  }

  if (eventType === "refund_completed") {
    notes.push("This looks like a completed refund email and should affect finance.");
  } else if (eventType === "refund_failed") {
    notes.push("This looks like a failed refund email and should not reduce finance.");
  } else if (eventType === "processing") {
    notes.push("This looks like a processing order email and should stay outside income until payment is approved.");
  } else if (eventType === "unknown") {
    notes.push("The parser could not confidently classify this email as a sale yet.");
  } else {
    notes.push("This looks like a sale email and the parser is checking the core workspace fields only.");
  }

  if (eventType === "sale" || eventType === "processing") {
    notes.push(
      lineItems.length === 1
        ? "The order currently contains 1 parsed line item."
        : `The order currently contains ${lineItems.length} parsed line items.`,
    );
  }

  if (eventType === "refund_completed" || eventType === "refund_failed") {
    notes.push(
      refundFields.order_number
        ? `Refund is linked to order #${refundFields.order_number}.`
        : "Refund order number is still missing.",
    );

    if (refundFields.affects_finance === true) {
      notes.push("This refund should reduce finance totals.");
    } else if (refundFields.affects_finance === false) {
      notes.push("This refund is only an alert until Etsy actually completes the charge.");
    }
  }

  if (missingFields.length > 0) {
    notes.push(`Still missing: ${missingFields.join(", ")}.`);
  } else if (eventType === "sale") {
    notes.push("All core Gmail-first sale fields were found.");
  }

  return notes;
}

function determineConfidence(
  eventType: ParserEventType,
  senderMatch: boolean,
  storeName: string | null,
  subtotalUsd: number | null,
  lineItems: ParsedSaleLineItem[],
  refundFields: ParsedRefundFields,
): ParserConfidence {
  const hasCompleteItems =
    lineItems.length > 0 &&
    lineItems.every(
      (item) =>
        Boolean(item.transaction_id) &&
        Boolean(item.listing_title) &&
        item.quantity !== null,
    );

  if (
    (eventType === "sale" || eventType === "processing") &&
    senderMatch &&
    Boolean(storeName) &&
    subtotalUsd !== null &&
    hasCompleteItems
  ) {
    return "High";
  }

  if (
    (eventType === "sale" || eventType === "processing") &&
    senderMatch &&
    lineItems.length > 0 &&
    subtotalUsd !== null
  ) {
    return "Medium";
  }

  if (
    (eventType === "refund_completed" || eventType === "refund_failed") &&
    senderMatch &&
    Boolean(refundFields.order_number) &&
    refundFields.refund_amount_usd !== null
  ) {
    return "High";
  }

  if (eventType === "refund_completed" || eventType === "refund_failed") {
    return "Medium";
  }

  return "Low";
}

export function parseEtsyTransactionEmail(
  rawEmail: string,
  hints: ParserHints = {},
): GmailParserLabResult {
  const decodedEmail = decodeQuotedPrintable(rawEmail.replace(/\r\n/g, "\n"));
  const plainText = decodeQuotedPrintable(extractPlainTextBody(rawEmail));
  const normalizedPreview = normalizeWhitespace(plainText).slice(0, 320);

  const sender = hints.sender ?? extractHeader(decodedEmail, "From");
  const subject = hints.subject ?? extractHeader(decodedEmail, "Subject");
  const receivedAt = hints.received_at ?? extractHeader(decodedEmail, "Date");
  const senderMatch = (sender ?? "").toLowerCase().includes(ETSY_TRANSACTION_SENDER);
  const subjectLower = (subject ?? "").toLowerCase();
  const bodyLower = plainText.toLowerCase();

  let eventType: ParserEventType = "unknown";

  if (subjectLower.includes("processing etsy order")) {
    eventType = "processing";
  } else if (
    subjectLower.includes("made a sale on etsy") ||
    (bodyLower.includes("transaction id:") && bodyLower.includes("subtotal:"))
  ) {
    eventType = "sale";
  } else if (
    subjectLower.includes("issued a refund") ||
    bodyLower.includes("you have issued") && bodyLower.includes("refund of")
  ) {
    eventType = "refund_completed";
  } else if (
    subjectLower.includes("regarding your refund") ||
    bodyLower.includes("unable to process the refund")
  ) {
    eventType = "refund_failed";
  }

  const sellerName = extractLineValue(plainText, [/Shop:\s*(.+)/i]);
  const lineItems = extractLineItems(plainText);
  const storefrontName = extractStorefrontName(decodedEmail, sellerName);
  const refundFields: ParsedRefundFields = {
    order_number:
      extractLineValue(plainText, [/Order #\s*([0-9]+)/i]) ??
      extractLineValue(subject ?? "", [/Order #\s*([0-9]+)/i]) ??
      extractLineValue(decodedEmail, [/Order #\s*([0-9]+)/i]),
    refund_amount_usd: extractRefundAmount(plainText, decodedEmail),
    refund_status:
      eventType === "refund_completed"
        ? "completed"
        : eventType === "refund_failed"
          ? "failed"
          : null,
    affects_finance:
      eventType === "refund_completed"
        ? true
        : eventType === "refund_failed"
          ? false
          : null,
    transaction_id:
      extractLineValue(decodedEmail, [/transaction\/([0-9]+)\?/i]) ??
      extractLineValue(decodedEmail, [/Transaction ID:\s*([0-9]+)/i]),
    listing_title: extractRefundListingTitle(decodedEmail),
    refund_reason: extractRefundReason(plainText),
  };
  const parsedFields: ParsedSaleFields = {
    store_name: storefrontName,
    seller_name: sellerName,
    item_count: lineItems.length,
    subtotal_usd: extractCurrencyValue(
      extractLineValue(plainText, [/Subtotal:\s*(?:US\$|\$)\s*([0-9.,]+)/i]),
    ),
  };

  const matchedFields: string[] = [];
  const missingFields: string[] = [];

  if (eventType === "sale" || eventType === "processing") {
    const fieldOrder: Array<keyof ParsedSaleFields> = [
      "store_name",
      "seller_name",
      "item_count",
      "subtotal_usd",
    ];

    for (const field of fieldOrder) {
      const value = parsedFields[field];
      if (value !== null && value !== "" && value !== 0) {
        matchedFields.push(field);
      } else {
        missingFields.push(field);
      }
    }

    if (lineItems.length > 0) {
      matchedFields.push("line_items");
    } else {
      missingFields.push("line_items");
    }
  } else if (eventType === "refund_completed" || eventType === "refund_failed") {
    if (refundFields.order_number) {
      matchedFields.push("order_number");
    } else {
      missingFields.push("order_number");
    }

    if (refundFields.refund_amount_usd !== null) {
      matchedFields.push("refund_amount_usd");
    } else {
      missingFields.push("refund_amount_usd");
    }

    if (refundFields.refund_status) {
      matchedFields.push("refund_status");
    } else {
      missingFields.push("refund_status");
    }

    if (refundFields.affects_finance !== null) {
      matchedFields.push("affects_finance");
    } else {
      missingFields.push("affects_finance");
    }

    if (refundFields.transaction_id) {
      matchedFields.push("transaction_id");
    } else {
      missingFields.push("transaction_id");
    }

    if (refundFields.listing_title) {
      matchedFields.push("listing_title");
    } else {
      missingFields.push("listing_title");
    }
  }

  const confidence = determineConfidence(
    eventType,
    senderMatch,
    parsedFields.store_name,
    parsedFields.subtotal_usd,
    lineItems,
    refundFields,
  );

  return {
    sender,
    subject,
    received_at: receivedAt,
    event_type: eventType,
    sender_match: senderMatch,
    parsed_fields: parsedFields,
    refund_fields: refundFields,
    line_items: lineItems,
    matched_fields: matchedFields,
    missing_fields: missingFields,
    confidence,
    notes: buildNotes(eventType, senderMatch, lineItems, refundFields, missingFields),
    normalized_preview: normalizedPreview,
  };
}
