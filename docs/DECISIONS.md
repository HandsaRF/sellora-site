# Architectural & Technical Decisions

1. **PySide6 vs PyQt6**: Chosen constraints mandated `PySide6`. 
2. **Dataclasses**: Simple `@dataclass` used across models. No Pydantic. 
3. **Canonical Status Mapping**: Constants mapped in `app.core.config` combined with SQL `CHECK` arrays enforce boundaries for allowed store and listing statuses.
4. **Dates**: Unified usage of ISO string variables preventing messy Python `datetime` parse conversions natively.
5. **Architectural Read Paths**: 
   - *Services:* Orchestrates requests over fetching arrays.
   - *Repositories:* Owns SQL joining logic. To serve global Master Views, `ListingRepository` embeds an `INNER JOIN stores s` query to properly label records with user-facing store names, explicitly avoiding leaking `store_id` numbers to end-users.
6. **ON DELETE CASCADE**: Explicitly chosen for SQLite tables to wipe listings seamlessly upon store removal natively tracking silo rules.
7. **Composition Root Relocated**: Dependency Injection is explicitly executed inside `app/main.py`. This ensures `MainWindow` acts solely as a UI shell layout router, decoupling initialization lifetimes from GUI definitions completely.
8. **Dashboard Query Strategy**: Aggregations for the Dashboard rely on pure distinct raw SQL `COUNT`, `SUM(CASE)`, and `UNION` operations inside the `DashboardRepository`. We actively refuse to instantiate complete Python mapping arrays for analytic reads across massive tables, ensuring maximum launch-time performance without heavy ORMs.
9. **App-Managed Media**: To solve dynamic constraints where users arbitrarily move or delete their `Local Sources` referenced by the App, the system strictly creates independent copies into a managed sandbox: `sellora_data/`. This abstracts OS-level instability, enabling absolute control mapping media safely on ID paths instead.
10. **Shrunk Status Nomenclature**: Listings were condensed in M11 into `Draft, Ready to Upload, Uploaded, Live, Removed` explicitly purging 'Researching' and 'Preparing', as these operations blurred the lines of an identical workspace step. `Blocked` was safely retained allowing users to suspend products strictly rather than permanently scrubbing them out as "Removed".
11. **Relational Listing Galleries (M12)**: The legacy `main_image_path` scalar boundary was purposely deprecated in favor of a 1-to-Many generic relational table: `listing_media`. This allows dynamic arrays of exact files up to explicitly bonded limits `(Max 20 Images, Max 1 Video)` actively breaking constraints out of static UI models and pushing them precisely natively to the `ListingService`.
