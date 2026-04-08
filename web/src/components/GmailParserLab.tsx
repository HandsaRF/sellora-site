"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import styles from "./gmail-parser-lab.module.css";
import {
  ETSY_TRANSACTION_QUERY,
  GmailLabConnectionState,
  GmailParserLabRun,
} from "@/lib/gmail-parser-lab";
import {
  getMutationErrorMessage,
  readApiErrorMessage,
} from "@/lib/sellora";

type GmailParserLabProps = {
  initialRuns: GmailParserLabRun[];
  initialConnection: GmailLabConnectionState;
};

function formatDisplayDate(value?: string | null) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function getConfidenceClass(confidence: GmailParserLabRun["confidence"]) {
  switch (confidence) {
    case "High":
      return styles.statusHigh;
    case "Medium":
      return styles.statusMedium;
    case "Low":
      return styles.statusLow;
    default:
      return styles.statusUnsupported;
  }
}

function getEventClass(eventType: GmailParserLabRun["event_type"]) {
  switch (eventType) {
    case "sale":
      return styles.eventSale;
    case "processing":
      return styles.eventProcessing;
    case "refund_completed":
      return styles.eventRefundCompleted;
    case "refund_failed":
      return styles.eventRefundIssue;
    default:
      return styles.eventUnknown;
  }
}

function getEventLabel(eventType: GmailParserLabRun["event_type"]) {
  switch (eventType) {
    case "sale":
      return "Sale email";
    case "processing":
      return "Pending approval";
    case "refund_completed":
      return "Refund completed";
    case "refund_failed":
      return "Refund issue";
    default:
      return "Unknown email";
  }
}

function getConnectionLabel(connection: GmailLabConnectionState) {
  switch (connection.status) {
    case "connected":
      return "Connected";
    case "needs_reauth":
      return "Needs re-auth";
    case "not_configured":
      return "Missing Google setup";
    default:
      return "Not connected";
  }
}

function getOAuthNotice(code: string | null, detail: string | null) {
  switch (code) {
    case "connected":
      return {
        kind: "success" as const,
        title: "Gmail connected",
        body: "The Gmail lab can now search Etsy transaction emails from the real inbox.",
      };
    case "missing-config":
      return {
        kind: "error" as const,
        title: "Google OAuth is not configured yet",
        body:
          "Add GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in web/.env.local before connecting Gmail.",
      };
    case "connect-failed":
      return {
        kind: "error" as const,
        title: "Google OAuth did not finish cleanly",
        body: detail || "The token exchange failed or Gmail profile lookup did not succeed.",
      };
    case "state-mismatch":
      return {
        kind: "error" as const,
        title: "Google OAuth state mismatch",
        body: "The login state expired or did not match. Start the Gmail connect flow again.",
      };
    case "access_denied":
      return {
        kind: "error" as const,
        title: "Google access was denied",
        body: "Google permission was not granted, so the lab could not connect to Gmail.",
      };
    default:
      return null;
  }
}

export function GmailParserLab({ initialRuns, initialConnection }: GmailParserLabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [runs, setRuns] = useState(initialRuns);
  const [connection, setConnection] = useState(initialConnection);
  const [rawEmail, setRawEmail] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState("");
  const [importedFileName, setImportedFileName] = useState("");
  const [actionNotice, setActionNotice] = useState("");

  const latestRun = useMemo(() => runs[0] ?? null, [runs]);
  const latestLineItems = latestRun?.line_items ?? [];
  const oauthNotice = useMemo(
    () => getOAuthNotice(searchParams.get("oauth"), searchParams.get("detail")),
    [searchParams],
  );

  async function handleParse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsParsing(true);
    setError("");

    try {
      const response = await fetch("/api/gmail-lab/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw_email: rawEmail,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            "Could not parse the Etsy email in the Gmail lab.",
          ),
        );
      }

      const body = (await response.json()) as { run: GmailParserLabRun };
      setRuns((current) => [body.run, ...current.filter((run) => run.id !== body.run.id)]);
      setActionNotice("Saved this manual parser run to the Gmail lab history.");
      startTransition(() => {
        router.refresh();
      });
    } catch (caughtError) {
      setError(
        getMutationErrorMessage(
          caughtError,
          "Could not parse the Gmail lab email input.",
        ),
      );
    } finally {
      setIsParsing(false);
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const text = await file.text();
    setRawEmail(text);
    setImportedFileName(file.name);
  }

  function resetInput() {
    setRawEmail("");
    setImportedFileName("");
    setError("");
  }

  async function handleSync() {
    setIsSyncing(true);
    setError("");

    try {
      const response = await fetch("/api/gmail-lab/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          max_results: 100,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            "Could not sync Etsy Gmail messages in the parser lab.",
          ),
        );
      }

      const body = (await response.json()) as {
        fetched_count: number;
        imported_count: number;
        skipped_count: number;
        page_count: number;
        has_more: boolean;
        connection: GmailLabConnectionState;
        runs: GmailParserLabRun[];
      };

      setConnection(body.connection);
      setRuns(body.runs);
      setActionNotice(
        body.fetched_count === 0
          ? "No Etsy transaction emails were found in the connected Gmail inbox yet."
          : `Fetched ${body.fetched_count} Etsy emails across ${body.page_count} Gmail page${body.page_count === 1 ? "" : "s"}, imported ${body.imported_count}, skipped ${body.skipped_count}${body.has_more ? ", and there are still more Etsy emails beyond this sync batch." : "."}`,
      );
      startTransition(() => {
        router.refresh();
      });
    } catch (caughtError) {
      setError(
        getMutationErrorMessage(
          caughtError,
          "Could not sync the Gmail lab with Google yet.",
        ),
      );
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleDisconnect() {
    setIsDisconnecting(true);
    setError("");

    try {
      const response = await fetch("/api/gmail-lab/oauth/disconnect", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(
            response,
            "Could not disconnect Gmail from the parser lab.",
          ),
        );
      }

      const body = (await response.json()) as {
        connection: GmailLabConnectionState;
      };

      setConnection(body.connection);
      setActionNotice("Disconnected the Gmail lab from Google. Manual .eml parsing still works.");
      startTransition(() => {
        router.refresh();
      });
    } catch (caughtError) {
      setError(
        getMutationErrorMessage(
          caughtError,
          "Could not disconnect the Gmail lab Gmail account.",
        ),
      );
    } finally {
      setIsDisconnecting(false);
    }
  }

  return (
    <div className={styles.labShell}>
      <div className={styles.labInner}>
        <section className={styles.hero}>
          <div className={styles.heroCard}>
            <span className={styles.eyebrow}>Separate Gmail Parser Lab</span>
            <h1 className={styles.title}>Test Etsy Gmail parsing before it ever touches Sellora.</h1>
            <p className={styles.subtitle}>
              This lab is the safe place to prove Gmail parsing, inspect real Etsy
              transaction emails, and confirm that we can reliably extract the core
              sales fields you actually care about.
            </p>

            <div className={styles.metaGrid}>
              <div className={styles.metaCard}>
                <span className={styles.metaLabel}>Target Sender</span>
                <strong className={styles.metaValue}>transaction@etsy.com</strong>
              </div>
              <div className={styles.metaCard}>
                <span className={styles.metaLabel}>Core Fields</span>
                <strong className={styles.metaValue}>title, style, transaction ID, qty, subtotal</strong>
              </div>
              <div className={styles.metaCard}>
                <span className={styles.metaLabel}>Current Phase</span>
                <strong className={styles.metaValue}>Raw parser first, Google OAuth next</strong>
              </div>
            </div>
          </div>

          <aside className={`${styles.heroCard} ${styles.heroAside}`}>
            <h2>Why this stays separate</h2>
            <p>
              We are proving the parser in isolation first, so mistakes in Google auth,
              Gmail filtering, or Etsy email parsing do not muddy the main store workspace.
            </p>

            <div className={styles.queryPill}>{ETSY_TRANSACTION_QUERY}</div>

            <ul className={styles.heroList}>
              <li>Upload a saved Etsy transaction <code>.eml</code> file or paste the raw source.</li>
              <li>The lab extracts only the fields your Gmail-first workflow needs.</li>
              <li>Each parse run is saved locally so we can compare accuracy over time.</li>
            </ul>
          </aside>
        </section>

        <section className={styles.connectionPanel}>
          <div className={styles.connectionHeader}>
            <div>
              <span className={styles.eyebrow}>Google Gmail Connection</span>
              <h2 className={styles.connectionTitle}>Move from uploaded `.eml` files to real Etsy inbox sync.</h2>
              <p className={styles.connectionSubtitle}>
                This lab stays separate on purpose. We connect Gmail here first, search
                only for Etsy transaction mail, and prove the parser before touching the
                main Sellora workspace.
              </p>
            </div>
            <div className={styles.connectionActions}>
              <a
                className={styles.primaryLinkAction}
                href={connection.is_configured ? "/api/gmail-lab/oauth/start" : "#"}
                onClick={(event) => {
                  if (!connection.is_configured) {
                    event.preventDefault();
                  }
                }}
              >
                {connection.connected ? "Reconnect Gmail" : "Connect Gmail"}
              </a>
              <button
                className={styles.secondaryAction}
                disabled={!connection.connected || isSyncing}
                onClick={handleSync}
                type="button"
              >
                {isSyncing ? "Syncing..." : "Sync Etsy Emails"}
              </button>
              <button
                className={styles.secondaryAction}
                disabled={!connection.connected || isDisconnecting}
                onClick={handleDisconnect}
                type="button"
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          </div>

          <div className={styles.connectionGrid}>
            <div className={styles.connectionCard}>
              <span className={styles.resultFieldLabel}>Connection State</span>
              <div className={styles.connectionValue}>{getConnectionLabel(connection)}</div>
              <p className={styles.connectionHelper}>
                {connection.connected
                  ? "The Gmail lab can search the connected inbox for Etsy transaction emails."
                  : "Manual .eml parsing works right now. Gmail sync unlocks live inbox testing next."}
              </p>
            </div>
            <div className={styles.connectionCard}>
              <span className={styles.resultFieldLabel}>Connected Gmail</span>
              <div className={styles.connectionValue}>{connection.connected_email || "-"}</div>
              <p className={styles.connectionHelper}>
                Scope: {connection.scopes.length > 0 ? connection.scopes.join(", ") : "Not granted yet"}
              </p>
            </div>
            <div className={styles.connectionCard}>
              <span className={styles.resultFieldLabel}>Last Sync</span>
              <div className={styles.connectionValue}>
                {connection.last_synced_at ? formatDisplayDate(connection.last_synced_at) : "-"}
              </div>
              <p className={styles.connectionHelper}>Query: {connection.query}</p>
            </div>
            <div className={styles.connectionCard}>
              <span className={styles.resultFieldLabel}>Google Setup</span>
              <div className={styles.connectionValue}>
                {connection.is_configured ? "Ready" : "Needs env vars"}
              </div>
              <p className={styles.connectionHelper}>
                {connection.is_configured
                  ? "OAuth client credentials were found for the Gmail lab."
                  : "Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in web/.env.local."}
              </p>
            </div>
          </div>

          {oauthNotice && (
            <div className={oauthNotice.kind === "success" ? styles.success : styles.error}>
              <strong>{oauthNotice.title}</strong>
              <div>{oauthNotice.body}</div>
            </div>
          )}

          {actionNotice && (
            <div className={styles.success}>
              <strong>Lab update</strong>
              <div>{actionNotice}</div>
            </div>
          )}
        </section>

        <section className={styles.workbench}>
          <form className={styles.panel} onSubmit={handleParse}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Parser Workbench</h2>
                <p>
                  Start with real Etsy emails first. Google OAuth will replace manual input
                  once the raw parser proves itself.
                </p>
              </div>
              <div className={styles.connectStub}>
                Google OAuth is intentionally deferred until the parser shape is stable.
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.fieldRow}>
                <span className={styles.helperText}>
                  Use the raw email source, not the pretty Gmail view.
                </span>
                <label className={styles.fileLabel}>
                  <input
                    className={styles.hiddenInput}
                    accept=".eml,.txt,message/rfc822"
                    onChange={handleFileChange}
                    type="file"
                  />
                  {importedFileName ? `Loaded: ${importedFileName}` : "Upload .eml file"}
                </label>
              </div>

              <div className={styles.field}>
                <label htmlFor="gmail-lab-raw-email">Raw Etsy Email</label>
                <textarea
                  className={styles.textarea}
                  id="gmail-lab-raw-email"
                  onChange={(event) => setRawEmail(event.target.value)}
                  placeholder="Paste the full Etsy transaction email source here..."
                  value={rawEmail}
                />
              </div>
            </div>

            {error && (
              <div className={styles.error}>
                <strong>Could not parse this email</strong>
                <div>{error}</div>
              </div>
            )}

            <div className={styles.actions}>
              <button className={styles.primaryAction} disabled={isParsing} type="submit">
                {isParsing ? "Parsing..." : "Parse Etsy Email"}
              </button>
              <button
                className={styles.secondaryAction}
                disabled={isParsing}
                onClick={resetInput}
                type="button"
              >
                Clear
              </button>
            </div>
          </form>

          <div className={styles.resultCard}>
            <div className={styles.sectionHeader}>
              <div>
                <h2>Latest Parse Result</h2>
                <p>
                  This is the exact field set we want before anything gets wired into the
                  real store workspace.
                </p>
              </div>
            </div>

            {latestRun ? (
              <>
                <div className={styles.statusRow}>
                  <span className={getConfidenceClass(latestRun.confidence)}>
                    {latestRun.confidence} confidence
                  </span>
                  <span className={getEventClass(latestRun.event_type)}>
                    {getEventLabel(latestRun.event_type)}
                  </span>
                </div>

                {(latestRun.event_type === "sale" || latestRun.event_type === "processing") && (
                  <>
                    <div className={styles.fieldGrid}>
                      <div className={styles.resultField}>
                        <span className={styles.resultFieldLabel}>Storefront</span>
                        <div className={styles.resultFieldValue}>
                          {latestRun.parsed_fields.store_name || "-"}
                        </div>
                      </div>
                      <div className={styles.resultField}>
                        <span className={styles.resultFieldLabel}>Seller / Owner</span>
                        <div className={styles.resultFieldValue}>
                          {latestRun.parsed_fields.seller_name || "-"}
                        </div>
                      </div>
                      <div className={styles.resultField}>
                        <span className={styles.resultFieldLabel}>Items In Order</span>
                        <div className={styles.resultFieldValue}>
                          {latestRun.parsed_fields.item_count}
                        </div>
                      </div>
                      <div className={styles.resultField}>
                        <span className={styles.resultFieldLabel}>Subtotal</span>
                        <div className={styles.resultFieldValue}>
                          {latestRun.parsed_fields.subtotal_usd == null
                            ? "-"
                            : `$${latestRun.parsed_fields.subtotal_usd.toFixed(2)}`}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className={styles.resultFieldLabel}>Order Items</span>
                      <div className={styles.itemList}>
                        {latestLineItems.length === 0 ? (
                          <div className={styles.emptyState}>No line items were parsed from this order.</div>
                        ) : (
                          latestLineItems.map((item, index) => (
                            <div key={`${item.transaction_id ?? "item"}-${index}`} className={styles.itemCard}>
                              <div className={styles.itemCardHeader}>
                                <strong className={styles.itemTitle}>{item.listing_title || "-"}</strong>
                                <span className={styles.itemMeta}>
                                  Transaction {item.transaction_id || "-"}
                                </span>
                              </div>
                              <div className={styles.itemDetails}>
                                <div className={styles.itemDetail}>
                                  <span className={styles.itemDetailLabel}>Style</span>
                                  <span>{item.style || "-"}</span>
                                </div>
                                <div className={styles.itemDetail}>
                                  <span className={styles.itemDetailLabel}>Quantity</span>
                                  <span>{item.quantity ?? "-"}</span>
                                </div>
                                <div className={styles.itemDetail}>
                                  <span className={styles.itemDetailLabel}>Item Price</span>
                                  <span>
                                    {item.item_price_usd == null ? "-" : `$${item.item_price_usd.toFixed(2)}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}

                {(latestRun.event_type === "refund_completed" || latestRun.event_type === "refund_failed") && (
                  <div className={styles.fieldGrid}>
                    <div className={styles.resultField}>
                      <span className={styles.resultFieldLabel}>Refund Status</span>
                      <div className={styles.resultFieldValue}>
                        {latestRun.refund_fields.refund_status || "-"}
                      </div>
                    </div>
                    <div className={styles.resultField}>
                      <span className={styles.resultFieldLabel}>Order Number</span>
                      <div className={styles.resultFieldValue}>
                        {latestRun.refund_fields.order_number || "-"}
                      </div>
                    </div>
                    <div className={styles.resultField}>
                      <span className={styles.resultFieldLabel}>Refund Amount</span>
                      <div className={styles.resultFieldValue}>
                        {latestRun.refund_fields.refund_amount_usd == null
                          ? "-"
                          : `$${latestRun.refund_fields.refund_amount_usd.toFixed(2)}`}
                      </div>
                    </div>
                    <div className={styles.resultField}>
                      <span className={styles.resultFieldLabel}>Affects Finance</span>
                      <div className={styles.resultFieldValue}>
                        {latestRun.refund_fields.affects_finance == null
                          ? "-"
                          : latestRun.refund_fields.affects_finance
                            ? "Yes"
                            : "No"}
                      </div>
                    </div>
                    <div className={styles.resultField}>
                      <span className={styles.resultFieldLabel}>Transaction ID</span>
                      <div className={styles.resultFieldValue}>
                        {latestRun.refund_fields.transaction_id || "-"}
                      </div>
                    </div>
                    <div className={styles.resultField}>
                      <span className={styles.resultFieldLabel}>Listing Title</span>
                      <div className={styles.resultFieldValue}>
                        {latestRun.refund_fields.listing_title || "-"}
                      </div>
                    </div>
                    <div className={styles.resultField}>
                      <span className={styles.resultFieldLabel}>Refund Reason</span>
                      <div className={styles.resultFieldValue}>
                        {latestRun.refund_fields.refund_reason || "-"}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <span className={styles.resultFieldLabel}>Matched Fields</span>
                  <div className={styles.chips}>
                    {latestRun.matched_fields.map((field) => (
                      <span key={field} className={styles.chip}>
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className={styles.resultFieldLabel}>Missing Fields</span>
                  <div className={styles.chips}>
                    {latestRun.missing_fields.length === 0 ? (
                      <span className={styles.chip}>None</span>
                    ) : (
                      latestRun.missing_fields.map((field) => (
                        <span key={field} className={styles.missingChip}>
                          {field}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <span className={styles.resultFieldLabel}>Parser Notes</span>
                  <ul className={styles.notes}>
                    {latestRun.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className={styles.resultFieldLabel}>Normalized Preview</span>
                  <div className={styles.preview}>{latestRun.normalized_preview}</div>
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                No parser runs yet. Upload a real Etsy transaction email and the lab will
                show the extracted fields here.
              </div>
            )}
          </div>
        </section>

        <section className={styles.historyCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Recent Parse Runs</h2>
              <p>
                This local history helps us compare Etsy email variants and keep improving
                the parser before we touch Google OAuth.
              </p>
            </div>
          </div>

          {runs.length === 0 ? (
            <div className={styles.emptyState}>
              No saved parse history yet. The first parsed Etsy email will appear here.
            </div>
          ) : (
            <div className={styles.historyList}>
              {runs.map((run) => (
                <article key={run.id} className={styles.historyItem}>
                  <div className={styles.historyHeader}>
                    <div>
                      <div className={styles.historySubject}>{run.subject || "No subject captured"}</div>
                      <div className={styles.historyMeta}>
                        {run.sender || "Unknown sender"} • Parsed {formatDisplayDate(run.created_at)}
                      </div>
                    </div>
                    <span className={getEventClass(run.event_type)}>
                      {getEventLabel(run.event_type)}
                    </span>
                  </div>

                  {(run.event_type === "sale" || run.event_type === "processing") && (
                    <>
                      <div className={styles.historyGrid}>
                        <div className={styles.historyCell}>
                          <span className={styles.historyCellLabel}>Storefront</span>
                          <span className={styles.historyCellValue}>
                            {run.parsed_fields.store_name || "-"}
                          </span>
                        </div>
                        <div className={styles.historyCell}>
                          <span className={styles.historyCellLabel}>Items</span>
                          <span className={styles.historyCellValue}>
                            {run.parsed_fields.item_count || 0}
                          </span>
                        </div>
                        <div className={styles.historyCell}>
                          <span className={styles.historyCellLabel}>Subtotal</span>
                          <span className={styles.historyCellValue}>
                            {run.parsed_fields.subtotal_usd == null
                              ? "-"
                              : `$${run.parsed_fields.subtotal_usd.toFixed(2)}`}
                          </span>
                        </div>
                        <div className={styles.historyCell}>
                          <span className={styles.historyCellLabel}>Transactions</span>
                          <span className={styles.historyCellValue}>
                            {run.line_items?.map((item) => item.transaction_id).filter(Boolean).join(", ") || "-"}
                          </span>
                        </div>
                      </div>

                      <div className={styles.historyItems}>
                        {(run.line_items ?? []).map((item, index) => (
                          <div key={`${item.transaction_id ?? "history-item"}-${index}`} className={styles.historyItemRow}>
                            <strong>{item.listing_title || "-"}</strong>
                            <span>Style {item.style || "-"}</span>
                            <span>Qty {item.quantity ?? "-"}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {(run.event_type === "refund_completed" || run.event_type === "refund_failed") && (
                    <div className={styles.historyGrid}>
                      <div className={styles.historyCell}>
                        <span className={styles.historyCellLabel}>Refund Status</span>
                        <span className={styles.historyCellValue}>
                          {run.refund_fields.refund_status || "-"}
                        </span>
                      </div>
                      <div className={styles.historyCell}>
                        <span className={styles.historyCellLabel}>Order Number</span>
                        <span className={styles.historyCellValue}>
                          {run.refund_fields.order_number || "-"}
                        </span>
                      </div>
                      <div className={styles.historyCell}>
                        <span className={styles.historyCellLabel}>Refund Amount</span>
                        <span className={styles.historyCellValue}>
                          {run.refund_fields.refund_amount_usd == null
                            ? "-"
                            : `$${run.refund_fields.refund_amount_usd.toFixed(2)}`}
                        </span>
                      </div>
                      <div className={styles.historyCell}>
                        <span className={styles.historyCellLabel}>Affects Finance</span>
                        <span className={styles.historyCellValue}>
                          {run.refund_fields.affects_finance == null
                            ? "-"
                            : run.refund_fields.affects_finance
                              ? "Yes"
                              : "No"}
                        </span>
                      </div>
                      <div className={styles.historyCell}>
                        <span className={styles.historyCellLabel}>Transaction</span>
                        <span className={styles.historyCellValue}>
                          {run.refund_fields.transaction_id || "-"}
                        </span>
                      </div>
                    </div>
                  )}

                  {(run.event_type === "refund_completed" || run.event_type === "refund_failed") &&
                    run.refund_fields.listing_title && (
                      <div className={styles.historyItems}>
                        <div className={styles.historyItemRow}>
                          <strong>{run.refund_fields.listing_title}</strong>
                          <span>{run.refund_fields.refund_reason || "No refund reason captured"}</span>
                        </div>
                      </div>
                    )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
