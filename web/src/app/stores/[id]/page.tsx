import Link from "next/link";

import "../../dashboard.css";
import "../stores.css";
import "./workspace.css";
import { DummyTransactionDialog } from "@/components/DummyTransactionDialog";
import { GmailConnectionDialog } from "@/components/GmailConnectionDialog";
import { ListingFormDialog } from "@/components/ListingFormDialog";
import { PageFlashNotice } from "@/components/PageFlashNotice";
import { StatusBadge } from "@/components/StatusBadge";
import { StoreFormDialog } from "@/components/StoreFormDialog";
import { UploadLogo } from "@/components/UploadLogo";
import { getDummyTransactionsForStore } from "@/lib/dummy-transactions";
import { getGmailConnectionForStore } from "@/lib/gmail-connections";
import { enrichListingsWithProfiles } from "@/lib/listing-profiles";
import {
  GmailConnectionRecord,
  ListingRecord,
  PurchaseTransactionRecord,
  StoreRecord,
  formatUsd,
  getApiUrl,
} from "@/lib/sellora";

function getSourceLabel(sourceType: PurchaseTransactionRecord["source_type"]) {
  return sourceType === "gmail" ? "Gmail" : "Dummy";
}

function getTransactionDate(transaction: PurchaseTransactionRecord) {
  return transaction.event_date ?? transaction.created_at?.slice(0, 10) ?? "-";
}

function buildFinancialRing(
  productCost: number,
  shippingCost: number,
  feeCost: number,
  profit: number,
) {
  const segments = [
    { value: productCost, color: "rgba(124, 198, 255, 0.88)" },
    { value: shippingCost, color: "rgba(250, 204, 21, 0.9)" },
    { value: feeCost, color: "rgba(248, 113, 113, 0.9)" },
    { value: Math.max(profit, 0), color: "rgba(52, 211, 153, 0.92)" },
  ].filter((segment) => segment.value > 0);

  if (segments.length === 0) {
    return "conic-gradient(from 180deg, rgba(148, 163, 184, 0.22), rgba(30, 41, 59, 0.82))";
  }

  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let current = 0;

  const stops = segments.map((segment) => {
    const start = current;
    current += (segment.value / total) * 100;
    return `${segment.color} ${start}% ${current}%`;
  });

  return `conic-gradient(from 200deg, ${stops.join(", ")})`;
}

export default async function StoreWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;
  let store: StoreRecord | null = null;
  let listings: ListingRecord[] = [];
  let transactions: PurchaseTransactionRecord[] = [];
  let gmailConnection: GmailConnectionRecord | null = null;

  try {
    const [storeRes, listingsRes] = await Promise.all([
      fetch(getApiUrl(`/stores/${storeId}`), { cache: "no-store" }),
      fetch(getApiUrl(`/stores/${storeId}/listings`), { cache: "no-store" }),
    ]);

    if (storeRes.ok) {
      store = await storeRes.json();
    }

    if (listingsRes.ok) {
      listings = await listingsRes.json();
    }
  } catch (err) {
    console.error("Failed to fetch store workspace data", err);
  }

  try {
    listings = await enrichListingsWithProfiles(listings);
    transactions = await getDummyTransactionsForStore(Number(storeId));
    gmailConnection = await getGmailConnectionForStore(Number(storeId));
  } catch (err) {
    console.error("Failed to read local workspace data", err);
  }

  gmailConnection ??= {
    store_id: Number(storeId),
    gmail_account_email: null,
    connection_status: "Not Connected",
    inbox_label: null,
    sync_notes: null,
    last_synced_at: null,
    updated_at: null,
  };

  if (!store) {
    return <div className="p-10">Store not found.</div>;
  }

  const listingSummaries = new Map<number, { unitsSold: number; revenue: number; profit: number }>();

  for (const listing of listings) {
    listingSummaries.set(listing.id, { unitsSold: 0, revenue: 0, profit: 0 });
  }

  const totalRevenue = transactions.reduce((sum, transaction) => sum + (transaction.subtotal_usd ?? 0), 0);
  const totalProductCost = transactions.reduce(
    (sum, transaction) => sum + (transaction.product_cost_snapshot_usd ?? 0),
    0,
  );
  const totalShippingCost = transactions.reduce(
    (sum, transaction) => sum + (transaction.supplier_shipping_cost_usd ?? 0),
    0,
  );
  const totalFeeCost = transactions.reduce(
    (sum, transaction) =>
      sum + (transaction.estimated_fees_usd ?? 0) + (transaction.extra_cost_usd ?? 0),
    0,
  );
  const totalExpenses = totalProductCost + totalShippingCost + totalFeeCost;
  const estimatedProfit = totalRevenue - totalExpenses;

  for (const transaction of transactions) {
    if (!transaction.matched_listing_id) {
      continue;
    }

    const summary = listingSummaries.get(transaction.matched_listing_id);
    if (!summary) {
      continue;
    }

    summary.unitsSold += transaction.quantity ?? 0;
    summary.revenue += transaction.subtotal_usd ?? 0;
    summary.profit += transaction.estimated_profit_usd ?? 0;
  }

  const missingShippingCount = transactions.filter(
    (transaction) => transaction.supplier_shipping_cost_usd == null,
  ).length;
  const needsReviewCount = transactions.filter(
    (transaction) => transaction.confidence_state === "Needs Review",
  ).length;
  const estimatedCount = transactions.filter(
    (transaction) => transaction.confidence_state === "Estimated",
  ).length;
  const listingsWithoutSales = listings.filter((listing) => {
    const summary = listingSummaries.get(listing.id);
    return !summary || summary.unitsSold === 0;
  }).length;
  const financialRing = buildFinancialRing(
    totalProductCost,
    totalShippingCost,
    totalFeeCost,
    estimatedProfit,
  );

  const reviewQueue = [
    {
      title:
        gmailConnection.connection_status === "Connected"
          ? `Gmail ready for ${gmailConnection.gmail_account_email || "this store"}`
          : `Gmail is ${gmailConnection.connection_status.toLowerCase()}`,
      body:
        gmailConnection.connection_status === "Connected"
          ? "This store now has its own mailbox slot ready for future Etsy transaction parsing."
          : "Before real Gmail import starts, each store should have its own mailbox state and notes defined here.",
      tone: gmailConnection.connection_status === "Connected" ? "accent" : "warning",
    },
    {
      title: `${missingShippingCount} sale${missingShippingCount === 1 ? "" : "s"} missing shipping cost`,
      body: "Shipping is still a manual expense, so these rows need a worker to complete the cost picture.",
      tone: missingShippingCount > 0 ? "warning" : "muted",
    },
    {
      title: `${needsReviewCount} transaction${needsReviewCount === 1 ? "" : "s"} need listing review`,
      body: "Title and style matching should stay store-scoped, and anything uncertain should stay visible here.",
      tone: needsReviewCount > 0 ? "danger" : "muted",
    },
    {
      title: `${estimatedCount} sale${estimatedCount === 1 ? "" : "s"} already have usable profit estimates`,
      body: "These rows already have enough cost detail to drive the workspace KPIs while the rest of the ledger catches up.",
      tone: estimatedCount > 0 ? "accent" : "muted",
    },
    {
      title: `${listingsWithoutSales} listing${listingsWithoutSales === 1 ? "" : "s"} still have no tracked sales`,
      body: "This is useful for spotting which listings still need transactions or which products still need to prove themselves.",
      tone: listingsWithoutSales > 0 ? "accent" : "muted",
    },
  ];

  return (
    <div className="workspace-shell">
      <PageFlashNotice />

      <div>
        <Link href="/stores" className="workspace-back">
          {"<"} Back to Stores
        </Link>
      </div>

      <div className="glass-card store-hero">
        <div className="store-hero-banner" />

        <div className="store-hero-content">
          <UploadLogo storeId={store.id} currentLogo={store.logo_path} />

          <div className="store-hero-copy">
            <h1 style={{ fontSize: "30px", margin: 0 }}>{store.store_name}</h1>
            <div className="store-hero-meta">
              <span>{store.niche || "No niche set yet"}</span>
              <StatusBadge category="store" status={store.status} />
              <StatusBadge category="gmail" status={gmailConnection.connection_status} />
              <span>{gmailConnection.gmail_account_email || "No Gmail account connected yet"}</span>
            </div>
          </div>

          <div className="store-hero-actions">
            <GmailConnectionDialog
              buttonClassName="btn-secondary"
              buttonLabel={gmailConnection.gmail_account_email ? "Edit Gmail" : "Connect Gmail"}
              connection={gmailConnection}
              storeId={store.id}
            />
            <DummyTransactionDialog
              buttonClassName="btn-primary"
              buttonLabel="Add Dummy Sale"
              listings={listings}
              storeId={store.id}
            />
            <ListingFormDialog
              buttonClassName="btn-secondary"
              buttonLabel="Add Listing"
              storeId={store.id}
            />
            <StoreFormDialog
              buttonClassName="btn-secondary"
              buttonLabel="Edit Store"
              store={store}
            />
          </div>
        </div>
      </div>

      <div className="workspace-summary">
        <div className="glass-card summary-card">
          <div className="kpi-label">Tracked Sales</div>
          <div className="summary-value">{transactions.length}</div>
          <div className="summary-note">Dummy rows for now, Gmail sales later.</div>
        </div>

        <div className="glass-card summary-card">
          <div className="kpi-label">Revenue</div>
          <div className="summary-value summary-value-money">{formatUsd(totalRevenue)}</div>
          <div className="summary-note">Based on Etsy email subtotal, not item total or tax.</div>
        </div>

        <div className="glass-card summary-card">
          <div className="kpi-label">Expenses</div>
          <div className="summary-value summary-value-money">{formatUsd(totalExpenses)}</div>
          <div className="summary-note">Product cost, supplier shipping, and estimated fees.</div>
        </div>

        <div className="glass-card summary-card">
          <div className="kpi-label">Est. Profit</div>
          <div className={`summary-value summary-value-money ${estimatedProfit < 0 ? "summary-value-loss" : ""}`}>
            {formatUsd(estimatedProfit)}
          </div>
          <div className="summary-note">Estimated profit in USD, before bank FX reality.</div>
        </div>
      </div>

      <div className="workspace-grid">
        <section className="glass-card workspace-panel">
          <div className="workspace-section-header">
            <div>
              <h3>Financial Overview</h3>
              <p>
                This store workspace now leads with profit, costs, and reviewable sales instead of a
                generic last-update panel.
              </p>
            </div>
          </div>

          <div className="financial-overview">
            <div className="financial-donut-shell">
              <div className="financial-donut-ring" style={{ background: financialRing }}>
                <div className="financial-donut-core">
                  <span className="financial-core-label">Revenue</span>
                  <strong>{formatUsd(totalRevenue)}</strong>
                  <span className="financial-core-subtitle">Phase 0 dummy mode</span>
                </div>
              </div>
            </div>

            <div className="financial-breakdown">
              <div className="financial-breakdown-row">
                <span className="financial-swatch revenue" />
                <span className="financial-breakdown-label">Product Cost</span>
                <strong>{formatUsd(totalProductCost)}</strong>
              </div>
              <div className="financial-breakdown-row">
                <span className="financial-swatch shipping" />
                <span className="financial-breakdown-label">Shipping Cost</span>
                <strong>{formatUsd(totalShippingCost)}</strong>
              </div>
              <div className="financial-breakdown-row">
                <span className="financial-swatch fees" />
                <span className="financial-breakdown-label">Fees + Extra</span>
                <strong>{formatUsd(totalFeeCost)}</strong>
              </div>
              <div className="financial-breakdown-row">
                <span className="financial-swatch profit" />
                <span className="financial-breakdown-label">Estimated Profit</span>
                <strong>{formatUsd(estimatedProfit)}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card workspace-panel">
          <div className="workspace-section-header">
            <div>
              <h3>Review Queue</h3>
              <p>Keep the next manual actions visible so the Gmail-first workflow stays honest.</p>
            </div>
          </div>

          <ul className="workspace-list">
            {reviewQueue.map((item) => (
              <li key={item.title} className={`workspace-list-item ${item.tone}`}>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </li>
            ))}
          </ul>

          <div className="workspace-meta">
            <div className="workspace-meta-row">
              <span className="workspace-meta-label">Owner</span>
              <span className="workspace-meta-value">{store.owner_name || "No owner set"}</span>
            </div>
            <div className="workspace-meta-row">
              <span className="workspace-meta-label">URL</span>
              <span className="workspace-meta-value">{store.url || "No store URL yet"}</span>
            </div>
            <div className="workspace-meta-row">
              <span className="workspace-meta-label">Logo status</span>
              <span className="workspace-meta-value">{store.logo_path ? "Uploaded" : "Missing"}</span>
            </div>
            <div className="workspace-meta-row">
              <span className="workspace-meta-label">Gmail state</span>
              <span className="workspace-meta-value">{gmailConnection.connection_status}</span>
            </div>
            <div className="workspace-meta-row">
              <span className="workspace-meta-label">Gmail account</span>
              <span className="workspace-meta-value">
                {gmailConnection.gmail_account_email || "No Gmail account yet"}
              </span>
            </div>
            <div className="workspace-meta-row">
              <span className="workspace-meta-label">Inbox label</span>
              <span className="workspace-meta-value">
                {gmailConnection.inbox_label || "No label configured"}
              </span>
            </div>
            <div className="workspace-meta-row">
              <span className="workspace-meta-label">Last sync</span>
              <span className="workspace-meta-value">
                {gmailConnection.last_synced_at || "Not synced yet"}
              </span>
            </div>
          </div>
        </section>
      </div>

      <section>
        <div className="workspace-table-header">
          <div>
            <h3 className="section-title">Sales Ledger</h3>
            <div className="workspace-table-subtitle">
              One row per purchase transaction, scoped to this store and ready for the future Gmail import.
            </div>
          </div>
          <DummyTransactionDialog
            buttonClassName="btn-primary"
            buttonLabel="Add Dummy Sale"
            listings={listings}
            storeId={store.id}
          />
        </div>

        <div className="table-surface p-10">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Transaction ID</th>
                <th>Listing</th>
                <th>Style</th>
                <th>Qty</th>
                <th>Subtotal</th>
                <th>Shipping</th>
                <th>Profit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{getTransactionDate(transaction)}</td>
                  <td>
                    <StatusBadge
                      category="transaction"
                      size="compact"
                      status={getSourceLabel(transaction.source_type)}
                    />
                  </td>
                  <td>{transaction.transaction_id}</td>
                  <td>
                    <div className="transaction-listing-cell">
                      <strong>{transaction.matched_listing_name || transaction.listing_title}</strong>
                      {transaction.matched_listing_name && transaction.listing_title !== transaction.matched_listing_name && (
                        <span>{transaction.listing_title}</span>
                      )}
                    </div>
                  </td>
                  <td>{transaction.style || "-"}</td>
                  <td>{transaction.quantity}</td>
                  <td>{formatUsd(transaction.subtotal_usd)}</td>
                  <td>{formatUsd(transaction.supplier_shipping_cost_usd)}</td>
                  <td>{formatUsd(transaction.estimated_profit_usd)}</td>
                  <td>
                    <StatusBadge
                      category="transaction"
                      size="compact"
                      status={transaction.confidence_state}
                    />
                  </td>
                  <td>
                    <DummyTransactionDialog
                      buttonClassName="table-link-button"
                      buttonLabel="Edit"
                      listings={listings}
                      storeId={store.id}
                      transaction={transaction}
                    />
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={11} className="listing-empty">
                    No tracked sales yet. Add a dummy transaction to test the Gmail-first ledger, financial overview, and profit flow.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="workspace-table-header">
          <div>
            <h3 className="section-title">Listings in this store</h3>
            <div className="workspace-table-subtitle">
              Listings stay inside the store workspace, now with early sales and profit signals attached.
            </div>
          </div>
          <ListingFormDialog
            buttonClassName="btn-primary"
            buttonLabel="Add Listing"
            storeId={store.id}
          />
        </div>

        <div className="table-surface p-10">
          <table className="data-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Name</th>
                <th>Status</th>
                <th>Units Sold</th>
                <th>Revenue</th>
                <th>Est. Profit</th>
                <th>Base Cost</th>
                <th>SKU</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => {
                const summary = listingSummaries.get(listing.id) ?? {
                  unitsSold: 0,
                  revenue: 0,
                  profit: 0,
                };

                return (
                  <tr key={listing.id}>
                    <td><div className="listing-thumb" /></td>
                    <td>{listing.product_name}</td>
                    <td>
                      <StatusBadge
                        category="listing"
                        size="compact"
                        status={listing.status}
                      />
                    </td>
                    <td>{summary.unitsSold}</td>
                    <td>{formatUsd(summary.revenue)}</td>
                    <td>{formatUsd(summary.profit)}</td>
                    <td>{formatUsd(listing.base_product_cost_usd)}</td>
                    <td>{listing.sku || "-"}</td>
                    <td>
                      <ListingFormDialog
                        buttonClassName="table-link-button"
                        buttonLabel="Edit"
                        listing={listing}
                        storeId={store.id}
                      />
                    </td>
                  </tr>
                );
              })}
              {listings.length === 0 && (
                <tr>
                  <td colSpan={9} className="listing-empty">
                    No listings for this store yet. Add a listing first, then dummy sales can start matching against it.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
