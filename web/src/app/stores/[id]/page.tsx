import Link from "next/link";
import "../../dashboard.css";
import "../stores.css";
import "./workspace.css";
import { ListingFormDialog } from "@/components/ListingFormDialog";
import { PageFlashNotice } from "@/components/PageFlashNotice";
import { StatusBadge } from "@/components/StatusBadge";
import { StoreFormDialog } from "@/components/StoreFormDialog";
import { UploadLogo } from "@/components/UploadLogo";
import { ListingRecord, StoreRecord, getApiUrl } from "@/lib/sellora";

export default async function StoreWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id: storeId } = await params;
  let store: StoreRecord | null = null;
  let listings: ListingRecord[] = [];

  try {
    const storeRes = await fetch(getApiUrl(`/stores/${storeId}`), { cache: "no-store" });
    if (storeRes.ok) {
      store = await storeRes.json();
    }

    const listingsRes = await fetch(getApiUrl(`/stores/${storeId}/listings`), { cache: "no-store" });
    if (listingsRes.ok) {
      listings = await listingsRes.json();
    }
  } catch (err) {
    console.error("Failed to fetch store data", err);
  }

  if (!store) {
    return <div className="p-10">Store not found.</div>;
  }

  const liveListings = listings.filter((listing) => listing.status === "Live").length;
  const readyListings = listings.filter((listing) => listing.status === "Ready to Upload").length;
  const blockedListings = listings.filter((listing) => listing.status === "Blocked").length;
  const lastUpdate = store.updated_at ?? store.created_at ?? "No recent activity yet";
  const workspaceFocus = [];

  if (readyListings > 0) {
    workspaceFocus.push({
      title: `${readyListings} listing${readyListings === 1 ? "" : "s"} ready to upload`,
      body: "This store already has work close to the finish line, so the workspace should keep that front and center.",
    });
  }

  if (blockedListings > 0) {
    workspaceFocus.push({
      title: `${blockedListings} blocked listing${blockedListings === 1 ? "" : "s"}`,
      body: "Blocked work should stay visible here so you can resolve the store-specific issues without leaving the page.",
    });
  }

  if (!store.logo_path) {
    workspaceFocus.push({
      title: "Branding still needs a logo",
      body: "You can already upload a logo here, and banner handling can follow the same local-first pattern next.",
    });
  }

  if (workspaceFocus.length === 0) {
    workspaceFocus.push({
      title: "This store is in a clean state",
      body: "The next useful step is adding or editing listings directly from this workspace instead of using a global listings page.",
    });
  }

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
              <span>Last update: {lastUpdate}</span>
            </div>
          </div>

          <div className="store-hero-actions">
            <ListingFormDialog
              buttonClassName="btn-primary"
              buttonLabel="Add Listing"
              storeId={store.id}
            />
            <StoreFormDialog
              buttonClassName="btn-secondary"
              buttonLabel="Edit Store"
              store={store}
            />
            <button className="btn-ghost" disabled type="button">
              Banner Soon
            </button>
          </div>
        </div>
      </div>

      <div className="workspace-summary">
        <div className="glass-card summary-card">
          <div className="kpi-label">Total Listings</div>
          <div className="summary-value">{store.total_listings ?? listings.length}</div>
          <div className="summary-note">Everything scoped to this store only.</div>
        </div>

        <div className="glass-card summary-card">
          <div className="kpi-label">Live Listings</div>
          <div className="summary-value">{store.live_listings ?? liveListings}</div>
          <div className="summary-note">Currently visible in the shop.</div>
        </div>

        <div className="glass-card summary-card">
          <div className="kpi-label">Ready to Upload</div>
          <div className="summary-value">{readyListings}</div>
          <div className="summary-note">The best short-term action queue.</div>
        </div>

        <div className="glass-card summary-card">
          <div className="kpi-label">Blocked</div>
          <div className="summary-value">{blockedListings}</div>
          <div className="summary-note">Work needing manual attention.</div>
        </div>
      </div>

      <div className="workspace-grid">
        <section className="glass-card workspace-panel">
          <h3>Workspace focus</h3>
          <p>This store page is now the main home for listing work, status review, and branding actions.</p>
          <ul className="workspace-list">
            {workspaceFocus.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-card workspace-panel">
          <h3>Store details</h3>
          <p>Quick context without relying on a separate global listings view or an extra settings page first.</p>
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
              <span className="workspace-meta-label">Banner status</span>
              <span className="workspace-meta-value">{store.banner_path ? "Uploaded" : "Missing"}</span>
            </div>
            <div className="workspace-meta-row">
              <span className="workspace-meta-label">Notes</span>
              <span className="workspace-meta-value">{store.notes || "No notes yet"}</span>
            </div>
          </div>
        </section>
      </div>

      <section>
        <div className="workspace-table-header">
          <div>
            <h3 className="section-title">Listings in this store</h3>
            <div className="workspace-table-subtitle">
              Listing work lives here instead of in a separate global listings page.
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
                <th>Date</th>
                <th>SKU</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
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
                  <td>{listing.upload_date || "-"}</td>
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
              ))}
              {listings.length === 0 && (
                <tr>
                  <td colSpan={6} className="listing-empty">
                    No listings for this store yet. This page is ready to become the main add/edit listing workflow.
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
