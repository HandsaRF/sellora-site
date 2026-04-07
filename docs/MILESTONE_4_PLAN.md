# Milestone 4 Implementation Plan: Store-Scoped Workflows

## 1. Exact M4 Scope
- **Only**:
  - Open Store Detail from Stores master view.
  - Add Store dialog (global creation).
  - Add Listing dialog (triggered exclusively from within a Store Detail view).
- **Explicitly out of scope**:
  - Edit flows of any kind (Store or Listing).
  - Add Listing globally (from outside a store context).
  - Store deletion operations.

## 2. Navigation and Callback Flow
- **Stores Master -> Open Store Detail**
  - **Interaction**: Double-clicking a row in the Stores Master table.
  - **Routing Flow**: `StoresView` emits `on_store_selected(store_id)` to `MainWindow`.
  - **Context Passage**: `MainWindow` switches the UI stack to `StoreDetailView` and calls `StoreDetailView.load_store(store_id)`. `StoreDetailView` uses `StoreService.get_store(store_id)` to load its own context header (not relying on master-table state).
  
- **Store Detail -> Stores Master (Back Navigation)**
  - **Trigger**: "Back to Stores" button clicked inside `StoreDetailView`.
  - **Callback Owner**: `MainWindow` registers `on_back_clicked` from the Detail View.
  - **Destination Action**: `MainWindow` safely switches the `QStackedWidget` index back to the `StoresView`.

- **Add Store Dialog**
  - **Open Trigger**: Clicking the "Add Store" button inside the Stores Master view.
  - **Success Behavior**: The dialog collects raw inputs and passes them to `MainWindow` or `StoresView`, which calls `StoreService.create_store()`. If successful, the dialog is accepted/closed.
  - **Cancel Behavior**: Dialog closes silently. No objects created.
  - **View Refresh**: `StoresView.load_data()` is explicitly triggered by `MainWindow` to reload the table and display the new store.

- **Add Listing Dialog (From Store Detail)**
  - **Open Trigger**: Clicking the "Add Listing" button natively inside the `StoreDetailView`.
  - **Context Passage**: The dialog is instantiated with the active `store_id` (already held by `StoreDetailView`). It is never shown to the user as an input field.
  - **Success Behavior**: The dialog collects raw inputs, ties it to `store_id`, and `StoreDetailView` calls `ListingService.create_listing(listing)`.
  - **Cancel Behavior**: Dialog closes silently. No objects created.
  - **View Refresh**: 
    - `StoreDetailView` explicitly calls `self.load_data()` to immediately refresh its local listing table.
    - `MainWindow` enforces reload-on-next-visit for both `StoresView` (updating derived counts) and the global `ListingsView`.

## 3. Service and Repository Responsibilities
- **New Service Required Methods**:
  - `StoreService.create_store(store_name, owner, niche, store_code, status)`
  - `StoreService.get_store(store_id: int) -> Store`
  - `ListingService.create_listing(listing: Listing) -> Listing`
- **New Repository Required Methods**:
  - `StoreRepository.create(store: Store) -> Store`
  - `StoreRepository.get_by_id(store_id: int) -> Store`
  - `ListingRepository.create(listing: Listing) -> Listing`
- **Strict Boundary Guard**: 
  - The UI (Views/Dialogs) remains 100% unaware of SQL. It only imports `<Entity>Service`.
  - No DB injections, `db_session` instances, or rogue queries will exist in the UI presentation tier.

## 4. Store-Silo Behavior
- **Global Listings View**: The side-nav view acts as a distinct global aggregate.
- **Store Detail Silo**: The `StoreDetailView` explicitly pulls `ListingService.get_all_for_store(store_id)`. It strictly prevents any cross-store UI bleed.

## 5. Store Code Handling
- **Database Rules**: SQLite mandates `store_code` as NOT NULL (`UNIQUE`).
- **UX Rules**: The dialog treats `store_code` as secondary. It simply collects the raw UI text input (including empty strings).
- **Service Ownership**: `StoreService.create_store` is the explicit owner of store_code logic. If the passed code is empty, the service generates a default code (e.g., initials of the store name), normalizes it to uppercase, and specifically catches SQL unique collisions during Repository insertion to return a structured, user-facing failure (like raising `ValueError`).

## 6. Delete-Store Readiness
- **No Delete UI Built Yet**: The system provides no UI elements for Store deletion in M4.
- **ON DELETE CASCADE Architecture**: Deletion operations will be exclusively atomic. The underlying SQLite schema constraint directly mandates that calling a removal of a given store will natively wipe the entirety of the operational Listings and history records anchored to it. No future workflows will be constructed assuming orphan records.
