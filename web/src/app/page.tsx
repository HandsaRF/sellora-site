import "./dashboard.css";
import { getApiUrl } from "@/lib/sellora";

type DashboardKpi = {
  total_stores: number;
  running_stores: number;
  total_listings: number;
  live_listings: number;
};

type DashboardAttention = {
  blocked_stores: number;
  ready_listings: number;
  missing_main_image: number;
};

type DashboardActivityItem = {
  message: string;
};

type DashboardResponse = {
  kpi?: DashboardKpi;
  attention?: DashboardAttention;
  activity?: DashboardActivityItem[];
};

type StorePerformanceItem = {
  id: number;
  store_name: string;
  total_listings: number;
  live_listings: number;
};

export default async function Dashboard() {
  let data: DashboardResponse | null = null;
  let stores: StorePerformanceItem[] = [];
  try {
    const res = await fetch(getApiUrl("/dashboard/"), { cache: "no-store" });
    if (res.ok) data = await res.json();
    
    const storeRes = await fetch(getApiUrl("/stores/"), { cache: "no-store" });
    if (storeRes.ok) stores = await storeRes.json();
  } catch (err) {
    console.error("Failed to fetch dashboard stats", err);
  }

  const kpi = data?.kpi || { total_stores: 0, running_stores: 0, total_listings: 0, live_listings: 0 };
  const attention = data?.attention || { blocked_stores: 0, ready_listings: 0, missing_main_image: 0 };
  const activity = data?.activity || [];

  return (
    <div className="dashboard">
      <div className="grid-4">
        <div className="glass-card kpi-card">
          <div className="kpi-label">Total Stores</div>
          <div className="kpi-value">{kpi.total_stores}</div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-label">Running Stores</div>
          <div className="kpi-value">{kpi.running_stores}</div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-label">Total Listings</div>
          <div className="kpi-value">{kpi.total_listings}</div>
        </div>
        <div className="glass-card kpi-card">
          <div className="kpi-label">Live Listings</div>
          <div className="kpi-value">{kpi.live_listings}</div>
        </div>
      </div>

      <div className="grid-7-5 mt-20">
        <div className="glass-card working-card">
          <h3 className="card-title">Needs Attention</h3>
          <ul className="attention-list">
            <li><span className="dot danger"></span> {attention.blocked_stores} blocked stores</li>
            <li><span className="dot info"></span> {attention.ready_listings} ready to upload listings</li>
            <li><span className="dot warning"></span> {attention.missing_main_image} listings missing main image</li>
          </ul>
        </div>
        <div className="glass-card working-card">
          <h3 className="card-title">Recent Activity</h3>
          <ul className="activity-list">
            {activity.map((item, i: number) => (
              <li key={i}>{item.message}</li>
            ))}
            {activity.length === 0 && <li className="text-secondary">No recent activity</li>}
          </ul>
        </div>
      </div>

      
      <div className="grid-1 mt-20">
        <div className="glass-card working-card">
          <h3 className="card-title">Store Performance</h3>
          <div className="table-surface p-10 mt-10">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Total</th>
                  <th>Live</th>
                </tr>
              </thead>
              <tbody>
                {stores.slice(0, 5).map((store) => (
                  <tr key={store.id}>
                    <td>{store.store_name}</td>
                    <td>{store.total_listings}</td>
                    <td>{store.live_listings}</td>
                  </tr>
                ))}
                {stores.length === 0 && (
                  <tr><td colSpan={3} style={{textAlign: 'center'}} className="text-secondary">No stores found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
