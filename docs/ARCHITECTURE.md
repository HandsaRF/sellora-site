# Architectural Limits & Bounds

1. **Composition Root**: `app/main.py` acts as the explicit composition root. It initializes all Repositories, weaves them into Services, and injects the Services into `MainWindow`. `MainWindow` and UI views remain strictly presentation-focused and never construct business objects or initialize SQLite connections.
2. **Repository Ownership**: Persistence rules, timestamping, SQL queries, and table JOIN logic exist strictly inside the `app/repositories/` models.
3. **Dataclasses**: Python Dataclasses adapt the SQL `sqlite.Row` inputs so `QAbstractTableModel` architectures rely entirely on Python standard objects, isolating us from underlying SQLite dependencies.
4. **Dashboard Boundary**: The Dashboard uses a distinct `DashboardRepository` and `DashboardService` to aggregate read-only metric data (`DashboardSummary`) directly via lightweight union/aggregate queries. This explicit boundary ensures dashboard analytics queries don't leak into or bog down the primary read/write operational repos (`StoreRepository`/`ListingRepository`).
5. **Media Storage Constraints**: All file upload operations bind completely to **App Managed Local Copies** orchestrated purely via the `StorageService`. Physical assets (`logo`, `banner`, `photos`) are fetched from the user and systematically duplicated into `sellora_data/stores/{id}/` guaranteeing source-link resilience without inflating SQLite databases with binary objects.
6. **Live Graphical Previews**: Sellora relies on PySide6's `QPixmap` containers internally bound to `QLabel` widgets to gracefully construct and display images dynamically over UI structures. Errors scaling or loading files fall back to clean "No Image" text labels entirely preventing crashes.

## Store Separation Product Architecture
Each Store operates as a unique silo. The underlying architecture explicitly respects **Store Context** vs **Global Context**.
- **Global Context**: Aggregates all records across all stores (e.g., "Listings Master Backup Views"). For global context, relationships mandate `JOIN` paths directly in the repository to fetch the joined `store_name`. This provides the necessary user-facing store reference instead of raw IDs.
- **Store Context**: Features interacting tightly within a single silo. A store-specific view will leverage service paths configured to selectively pull listing histories explicitly scoped to that single store entity.

## Delete Store Tradeoffs
- **Current Approach**: The backend relies on SQLite `ON DELETE CASCADE`. 
- **Behavior**: Deleting a store directly erases every listing and all history assigned to that store natively at the database layer. No orphan listings remain.
