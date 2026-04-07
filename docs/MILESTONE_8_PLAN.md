# Milestone 8 Implementation Plan: Operational Dashboard

## 1. Goal
Replace the placeholder Dashboard View with a read-only, purely operational overview utilizing exclusively existing SQLite schema points (Stores and Listings limits). Profitability, revenue, and inferred financial vanity metrics are explicitly prohibited.

## 2. Proposed Dashboard Architecture

### Aggregation Boundary: Dedicated Service
To avoid polluting `StoreService` and `ListingService` with cross-cutting aggregation logic, we will introduce an overarching Reporting aggregate:
- **`app/repositories/dashboard_repository.py`**: Executes highly efficient `GROUP BY` and `UNION ALL` SQL aggregating cross-table tracking limits safely relying entirely on indexable table schemas.
- **`app/services/dashboard_service.py`**: Orchestrates and packages the query results natively feeding the `DashboardView`.

### Data Schemas & SQL Fetching
1. **Summary Action KPIs (Row 1):**
    - `total_stores`, `running_stores` (Filtered by Status), `blocked_stores`
    - `total_listings`, `live_listings` (Filtered by Status)
2. **Global Status Distributions (Row 2):**
    - `SELECT status, COUNT(*) FROM stores GROUP BY status`
    - `SELECT status, COUNT(*) FROM listings GROUP BY status`
3. **Per-Store Performance Matrix (Row 3):**
    - Natively reusing `StoreService.get_stores_overview()` which already yields `store_name`, `status`, `total_listings`, `live_listings`.
4. **Recent Activity Feed (Sidebar/Row 4):**
    - Fusing existing temporal logs dynamically executing a pure SQL union: `SELECT 'Listing' as type, product_name as name, last_updated as time, status FROM listings UNION ALL SELECT 'Store', store_name, updated_at, status FROM stores ORDER BY time DESC LIMIT 10`.

## 3. UI Component Construction
The `app/ui/views/dashboard_view.py` will be completely overhauled utilizing standard PySide6 components:
- **`QHBoxLayout` for Metric Cards**: Custom styled `QFrame` widgets displaying the raw counters (e.g. "Total Live Listings: 34").
- **`QTableView` for Per-Store Output**: To avoid centering on product-deferred variables like `store_code`, the Dashboard will map to a custom `DashboardStoreTableModel` defining a reduced/adapted presentation layout highlighting exclusively: `store_name`, `status`, `total_listings`, `live_listings`.
- **`QListWidget` for Activity Logs**: Simple UI list looping through the timeline strings directly rendering the temporal Union fetch.

## 4. Required Navigation/Refresh Logic
- The Dashboard serves as `index 0` on the `MainWindow.stacked_widget`.
- **First Load Contract**: During `MainWindow.__init__`, the constructor will definitively append `self.dashboard_view.load_data()` securing the immediate rendering of aggregation targets before application loop triggers.
- **Subsequent Loading Rule**: Every time `_switch_view(0, "Dashboard")` executes, it will definitively call `dashboard_view.load_data()` making it identically reactive ensuring any modifications performed inside `StoreDetailView` instantly verify against the aggregate charts.

## 5. Explicitly Out of Scope
- No 3rd party charting frameworks.
- No profitability grids or API scraping algorithms.
- No editing or destructive mechanisms attached strictly reserving edit actions entirely for Silos and Master tabs.
- No visual glassmorphism layout changes.
