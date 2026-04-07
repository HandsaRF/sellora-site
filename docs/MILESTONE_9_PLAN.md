# Sellora Milestone 9: File & Media Management & Smart Upload Dates

## Goal
Introduce explicit user interfaces mapping real media/assets across Stores and Listings. This will provide functional local-file references to bridge the 'file upload/saving' defect, and add quality-of-life status logic.

> [!CAUTION]
> **Storage Approach Clarification**
> This milestone stores **local file references/paths (Strings)** in the SQLite database. It does **not** copy binary uploads or store heavy image blobs inside the database. It leverages PySide6 `QFileDialog` to capture and explicitly save the absolute paths to user assets onto their models.

## Proposed Changes

### Database & Schema (Migrations)
#### [MODIFY] `app/database/connection.py`
- We will alter `bootstrap_db()` connecting a safe, explicit migration strategy.
- **Migration Strategy**: Use `PRAGMA table_info('stores')` to verify existing schema columns natively. If `logo_path` and `banner_path` do not exist, use explicit `ALTER TABLE` operations to append them. 
- *Note on Legacy Schema*: `media_path` in Stores will remain as a legacy deprecated column (not actively presented in UI).

### Models & Repositories
#### [MODIFY] `app/models/store.py` & `app/repositories/store_repository.py`
- Add `logo_path` and `banner_path` mapping them safely onto `CREATE` / `UPDATE` queries. 
- *Note: Listing schema natively supports `files_path` and `main_image_path` but we must explicitly enforce complete backend persistence for them moving forward.*

#### [MODIFY] `app/repositories/listing_repository.py`
- **Critical Update**: Overwrite the `UPDATE` method so that it properly targets the `upload_date`, `main_image_path`, and `files_path`. (The current update query mistakenly only targets `product_name`, `status`, and `sku` which leads to massive UI-only illusions if left unmodified). Ensure `ListingService.update_listing` accurately pipes these fully populated models through.

### Business Logic (Service Layer)
#### [MODIFY] `app/services/listing_service.py`
- **Upload Date Rule**: 
  - If a user pushes a listing `status` to `Uploaded` but the `upload_date` resides empty, dynamically attach `datetime.today().strftime('%Y-%m-%d')` inside the Service explicitly.
  - If a user manually enters a distinct date, preserve it entirely.
  - If the status is changed *away* from `Uploaded` (e.g. `Removed` or `Blocked`), the existing date remains untouched (we do not wipe historical upload dates, keeping it explicitly stable).

### Presentation (UI Layer)
We will introduce `QHBoxLayout` native layout rows mapping read-only text fields attached to pure PySide6 `[Browse...]` or `[Clear]` dialog selection buttons.

#### Store Dialogs (`add_store_dialog.py`, `edit_store_dialog.py`)
- Add targets for **Logo File** and **Banner File**. Include small `[Browse...]` buttons native to the system. 
- **Pre-fill behavior**: Inside Edit states, perfectly preload existing strings into their respective boxes, and allow a `[Clear]` event to erase the string cleanly.

#### Listing Dialogs (`add_listing_dialog.py`, `edit_listing_dialog.py`)
- Add targets for **Main Photo** and **Listing Files (Zip/Assets)** utilizing identical `QFileDialog` architectures.
- Attach `upload_date` native `QLineEdit` string boxes.
- Bind `status_input.currentTextChanged` -> UI explicitly fills `upload_date` field with today's date when hitting "Uploaded" ensuring visual transparency for the user before committing. This allows manual overriding right in the dialog. The user must be able to clear or change values dynamically.

### Documentation Overhaul
Update tracking docs acknowledging the file reference behavior. 
- `ARCHITECTURE.md`, `DECISIONS.md`, `FAILURES.md`, `NEXT_STEPS.md`, `PROGRESS.md`, `HANDOFF.md`
- Clarifying that File Saving now explicitly relies on File Paths.

## Verification Checkpoints
1. App successfully launches, checks `PRAGMA`, and creates safely new columns without deleting legacy DBs.
2. Edit listing > Add Path > Load Edit Listing > Path is cleanly saved and restored.
3. Edit listing > Swap Status to "Uploaded" -> Date field pre-populates instantly.
4. Existing DB functionality continues flawlessly.
