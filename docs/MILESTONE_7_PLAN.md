# Milestone 7 Implementation Plan: Safe Delete Workflows

## 1. Exact M7 Scope
- **Only**:
  - Delete an existing Listing exclusively from within the active `StoreDetailView`.
  - Delete the active Store exclusively from within its own `StoreDetailView` workspace.
- **Explicitly out of scope**:
  - Global delete flows (from `StoresMaster` or `ListingsMaster`).
  - Bulk deletions.
  - Trash/Archive/Restore flows (hard deletes only).
  - Any visual design or structural layout changes.

## 2. Navigation and Callback Flow
- **Delete Listing Flow**
  - **Open Trigger**: A new "Delete Selected" button on the `StoreDetailView` action bar. Disabled when no row is selected.
  - **Confirmation Dialog**: `DeleteListingDialog` (custom `QDialog`). It prominently displays the specific Product Name, clearly states this action is permanent, and provides a distinct "Delete Listing" red action button to finalize, avoiding vague "Confirm" terminology.
  - **Failure/Mistake**: If validation fails natively, an embedded inline `QLabel` shows the error.
  - **Explicit Refresh Contract**: Upon successful listing deletion:
    - `StoreDetailView` is immediately refreshed via `self.load_store(self.active_store_id)` natively completely updating both its Table Model and the Header (Live/Total) counts simultaneously.
    - `Stores Master` implicitly reflects the derived count reduction upon the next tab visit (via its `load_data()` organic tab-activation loop).
    - `Listings Master` implicitly reflects the removed listing upon its next tab visit (via the same organic tab-activation loop).

- **Delete Store Flow**
  - **Open Trigger**: A new "Delete Store" button attached to the active `StoreDetailView` action bar.
  - **Strong Confirmation Dialog**: `DeleteStoreDialog` explicitly states the `ON DELETE CASCADE` rule (destroying all attached listings permanently). It natively commands the user to type the exact `store.store_name` into an active input field, and exposes a firm "Delete Store permanently" action button to verify the deletion.
  - **Failure/Mistake**: `ValueError` thrown internally if strings do not match perfectly, rendering to the inline banner.
  - **Explicit Refresh Contract**: Upon successful store deletion:
    - `StoreDetailView` triggers a `.emit()` signal indicating Silo destruction.
    - `MainWindow` catches this signal, instantly navigating the `QStackedWidget` layout out of the Silo and forcing it back into `Stores Master`.
    - `MainWindow` immediately commands `StoresView.load_data()` ensuring the destroyed store is erased dynamically from the Master table list completely.
    - `Listings Master` correctly drops all cascaded listings upon its next structural tab visit automatically. 

## 3. Service and Repository Responsibilities
- **New Service Required Methods**:
  - `StoreService.delete_store(store_id: int, input_name: str)` 
  - `ListingService.delete_listing(listing_id: int)`
- **New Repository Required Methods**:
  - `StoreRepository.delete(store_id: int)`
  - `ListingRepository.delete(listing_id: int)`
- **Explicit Architectural Boundaries**: 
  - **Services Orchestrate Destructiveness**: `StoreService` independently pulls the `Store` by `store_id` to evaluate its own `store_name` baseline. The UI strictly passes the `input_name`, keeping confirmation business rules locked safely in the Service layer.
  - **Repositories Exclusively Manage SQLite**: The repositories exclusively execute the structural `DELETE FROM` SQL payload natively (and gracefully let the SQLite `ON DELETE CASCADE` backend cascade dependencies).
  - **UI Isolates Layouts**: The UI layer exclusively talks to the generated Services. Absolutely NO UI -> `db_session` bindings, nor any UI -> `Repository` cross-linking is permitted natively.

## 4. UI Focus
- The UI explicitly uses dataclass fields like `.product_name` and `.store_name` to warn the user realistically. No backend generic tracking parameters (`store_id`, `listing_id`) will be revealed inside the popup wording to the user.
