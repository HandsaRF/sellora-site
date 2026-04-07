import Link from "next/link";
import "../dashboard.css";
import "./stores.css";
import { PageFlashNotice } from "@/components/PageFlashNotice";
import { StoreFormDialog } from "@/components/StoreFormDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { StoreRecord, getApiUrl } from "@/lib/sellora";

export default async function StoresPage() {
  let stores: StoreRecord[] = [];
  try {
    const res = await fetch(getApiUrl("/stores/"), { cache: "no-store" });
    if (res.ok) stores = await res.json();
  } catch(err) {
    console.error("Failed to fetch stores", err);
  }

  return (
    <div className="stores-master">
      <PageFlashNotice />

      <div className="flex-between mb-20">
        <h2 className="section-title">Stores ({stores.length})</h2>
        <StoreFormDialog buttonLabel="Add Store" buttonClassName="btn-primary" />
      </div>
      
      <div className="table-actions mb-16">
        <input type="text" placeholder="Search stores..." className="input-field" />
        <select className="input-field">
          <option>All Status</option>
          <option>Running</option>
          <option>Blocked</option>
        </select>
      </div>

      <div className="table-surface p-10">
        <table className="data-table">
          <thead>
            <tr>
              <th>Store Name</th>
              <th>Status</th>
              <th>Niche</th>
              <th>Listings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id}>
                <td>{store.store_name}</td>
                <td>
                  <StatusBadge category="store" size="compact" status={store.status} />
                </td>
                <td>{store.niche || "-"}</td>
                <td>{store.total_listings ?? 0} / {store.live_listings ?? 0} Live</td>
                <td>
                  <div className="store-actions">
                    <Link href={`/stores/${store.id}`}>Open Workspace</Link>
                    <StoreFormDialog
                      buttonLabel="Edit"
                      buttonClassName="table-link-button"
                      store={store}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {stores.length === 0 && (
              <tr><td colSpan={5} className="text-secondary" style={{padding: '24px', textAlign: 'center'}}>No stores yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
