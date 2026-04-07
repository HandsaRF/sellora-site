# Sellora Milestone 11: Workspace UX & Managed Media Storage

## Goal
Transform the Store Workspace resolving aesthetic clutter, and architect a robust Media Storage Service that strictly controls and copies user-selected files into explicit application-managed directories instead of relying on fragile external system references.

## Proposed Changes

### Storage Service Migration (App-Managed Storage)
#### [NEW] `app/services/storage_service.py`
- Create a dedicated standard class wrapping `shutil.copy2` and `os` logic handling physical file movements. 
- **Internal Structure**: All media will target a local sub-folder dynamically: `sellora_data/stores/{store_id}/` and `sellora_data/listings/{listing_id}/`.
- **Deferred Import Rules (Creation Flow)**: When a user operates `Add Store` or `Add Listing`, the UI simply stages the user's OS-path string temporarily inline. Only **after** the Repository successfully `creates` the object (generating the persistent `ID`) does the explicit two-step sequence execute:
  1. `StorageService` immediately uses that new `ID` to map and copy the raw files into `sellora_data/stores/{id}/` or `sellora_data/listings/{id}/`.
  2. The underlying Service issues a secondary call securely updating the target Repository mapping (`logo_path`, `banner_path`, `main_image_path`, `files_path`) to permanently retain the copied absolute paths instead of the external ones.
- **Export/Reveal Rules**: Add `.export_file(internal_path, destination_path)` and `.reveal_in_explorer(internal_path)` utilizing `subprocess.Popen` or native `os.startfile`.
- **Cleanup Strategy**: Modify `ListingService.delete_listing` and `StoreService.delete_store` methods. When a model is removed via user instruction, their corresponding directory schemas in `sellora_data/` will be systematically wiped via `shutil.rmtree` bounding orphaned clutter entirely.

### Reworking StoreDetailView (UI Cleanup & Better Banners)
#### [MODIFY] `app/ui/views/store_detail_view.py`
- Layout converted to stack vertically. The **Top Level** expands horizontally housing a massive `QLabel` mapped to the absolute `QPixmap` Banner natively stretching the UI width.
- Beneath the banner, a neat header row housing the `Logo` scaled elegantly alongside the typography for "Store Title + Counts".
- **Action Buttons Separated**:
  - *Store Context Bar*: A clean row explicitly for Edit Store and Delete Store natively placed above the workspace. Right next to it, distinct individual buttons explicitly indicating what happens: `[Export Store Logo]`, `[Export Store Banner]`.
  - *Listing Context Bar*: A row explicitly for Add / Edit / Delete cleanly attached right above the `QTableView`. Beside them, specific buttons reading `[Export Main Photo]` and `[Export Listing Assets]`.
- Users select a row in the Table and can click the exact Asset/Media button they wish to export directly from the Workspace Bar without opening the Edit Dialog.

### Listing Status Aggregation & Migration
#### [MODIFY] `app/core/config.py` & `app/database/connection.py`
- We are safely rebuilding the SQLite table inside `bootstrap_db()` via a proper `CREATE TEMPORARY TABLE / INSERT / DROP / RENAME` sequence to bypass rigid constraint freezes.
- **Constant Simplification**:
  - `Draft` (Replaces Researching / Preparing)
  - `Ready to Upload`
  - `Uploaded`
  - `Live`
  - `Removed`
  - `Blocked` (Retained temporarily for explicit edge case progression preventing unsafe semantics).
- During the rebuild sequence, `Researching` and `Preparing` rows will explicitly cleanly `UPDATE` into `Draft`.
- `Blocked` mapping retains its meaning cleanly.

### Suppressing Legacy Visuals
#### [MODIFY] Models & Views
- `Store Code` gets fully suppressed from standard graphical elements like `ListingTableModel` schemas, `StoreTableModel` summaries, and UI titles. It remains internally safe out of visibility constraints.

## Storage Location Environment
Files will cleanly organize inside `PROJECT_ROOT/sellora_data/`, operating strictly as an explicit App-Managed local cache folder, rather than deep system OS AppData limits.

## Verification Plan
1. Launch App -> Bootstrapped rebuild logic executes securely migrating old `[Researching, Preparing]` paths.
2. Edit a Store -> Add a Logo -> Save. Visually ensure `StorageService` pushed it into `sellora_data/stores/X/logo/Y.png`.
3. In `StoreDetailView` directly click `[Export Store Logo]` or `[Export Store Banner]` -> Confirm real OS retrieval works.
4. Delete the Store -> Confirm `shutil.rmtree` obliterates the generated file schema cleanly.
