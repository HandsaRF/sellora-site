# Milestone 5 Implementation Plan: Listing Edit Workflow

## 1. Exact M5 Scope
- **Only**:
  - Edit an existing listing exclusively from within the `StoreDetailView`.
- **Explicitly out of scope**:
  - Global listing edit (from `ListingsMaster`).
  - Editing a Store.
  - Deleting Stores or Listings.
  - Reassigning a listing to a completely different store (frozen Context).
  - Any visual design or structural layout changes.

## 2. Navigation and Callback Flow
- **Edit Listing Dialog (From Store Detail)**
  - **Open Trigger**: User selects a row in the `StoreDetailView` table and clicks the "Edit Listing" button.
  - **Initialization**: `StoreDetailView` extracts the `listing_id` from the selected row, queries `ListingService.get_listing(listing_id)`, and passes the populated Dataclass to `EditListingDialog(existing_listing, listing_service)`.
  - **Success Behavior**: The dialog collects modified inputs, applies them to the existing Dataclass, and calls `listing_service.update_listing(updated_listing)`. The dialog uses the embedded inline `QLabel` validation for normal mistakes (e.g. blank product name) avoiding `QMessageBox`.
  - **Cancel Behavior**: Dialog closes silently. No changes are saved.
  - **View Refresh**: 
    - **Immediate**: `StoreDetailView` expressly calls `self.load_data()` reloading its local listings instantly reflecting the table modifications.
    - **Delayed/Explicit Reload**: `MainWindow` tabs (`StoresView`, `Listings Master`) trigger `load_data()` upon subsequent visits enforcing global state recalculations dynamically.

## 3. Service and Repository Responsibilities
- **New Service Required Methods**:
  - `ListingService.get_listing(listing_id: int) -> Optional[Listing]`
  - `ListingService.update_listing(listing: Listing) -> Listing`
- **New Repository Required Methods**:
  - `ListingRepository.get_by_id(listing_id: int) -> Optional[Listing]`
  - `ListingRepository.update(listing: Listing) -> Listing`
- **Strict Boundary Guard**: 
  - Dialogs remain presentation-focused, utilizing injected `<Entity>Service` methods.
  - Repositories exclusively execute the `UPDATE` SQL logic and recalculate `last_updated` datetime properties natively. No `db_session` escapes the repository bounds.

## 4. Store-Silo Behavior
- **Fixed Store Context**: The `EditListingDialog` will not surface `store_id` logic to the user. It will inherently preserve the context of the active Store.
- **No Global Edit**: By preventing edit actions from the generic `Listings Backup View`, we assure the user is fully aware they are altering metrics deep inside a single Store's unique workspace.

## 5. Deferred Contexts
- No aesthetic adjustments (glassmorphism/color upgrades).
- No Delete UI mapping. `ON DELETE CASCADE` truths remain.
