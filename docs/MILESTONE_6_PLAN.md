# Milestone 6 Implementation Plan: Store Edit Workflow

## 1. Exact M6 Scope
- **Only**:
  - Edit an existing Store exclusively from within its active `StoreDetailView`.
- **Explicitly out of scope**:
  - Global Store edit flows (from `StoresMaster`).
  - Editing Store listings (completed in M5).
  - Deleting Stores or Listings.
  - Any visual design or structural layout changes.

## 2. Navigation and Callback Flow
- **Edit Store Dialog (From Store Detail)**
  - **Open Trigger**: A new "Edit Store" button added to the Action Bar natively inside `StoreDetailView`.
  - **Initialization**: `StoreDetailView` passes its currently loaded `Store` dataclass into `EditStoreDialog(active_store, store_service)`.
  - **Success Behavior**: The dialog collects modified inputs, applies them to the existing Dataclass, and calls `store_service.update_store(updated_store)`. The dialog relies entirely on embedded `QLabel` validation for mistakes (e.g., blank store name or SQL collision).
  - **Cancel Behavior**: Dialog closes silently. No changes are saved.
  - **View Refresh**: 
    - **Immediate**: `StoreDetailView` explicitly calls `self.load_store(active_store.id)` reloading its context header natively immediately.
    - **Delayed/Explicit Reload**: Navigation back to `StoresView` natively triggers `load_data()` dynamically resetting the derived totals reliably.

## 3. Service and Repository Responsibilities
- **New Service Required Methods**:
  - `StoreService.update_store(store: Store) -> Store`
- **New Repository Required Methods**:
  - `StoreRepository.update(store: Store) -> Store`
- **Strict Boundary Guard**: 
  - Dialogs remain presentation-focused, utilizing injected `<Entity>Service` methods.
  - Repositories exclusively execute the `UPDATE` SQL logic and recalculate `updated_at` datetime properties natively. No `db_session` escapes the repository bounds.

## 4. Store Code Handling
- **Database Rules**: SQLite mandates `store_code` as NOT NULL (`UNIQUE`).
- **UX Rules**: The `EditStoreDialog` will pre-populate the current `store_code` in a secondary text line at the bottom of the form (identical UX to Add Store).
- **Service Ownership**: `StoreService.update_store` enforces the constraint. If the user blanks the code, the Service dynamically regenerates one from the `store_name` initials internally prior to DB persistence preventing SQLite crashes natively. Uniqueness collisions (`IntegrityError`) are captured strictly raising pure `ValueError` back to the inline Dialog text banner.

## 5. Deferred Contexts
- No aesthetic adjustments (glassmorphism/color upgrades).
- No Delete UI mapping. `ON DELETE CASCADE` truths remain out of scope for now.
