# Sellora Milestone 12: Media UX & Listing Gallery

## Goal
Transform the Workspace Media experience by upgrading the Store Banner to a modern fluid container, scrubbing noisy action-text buttons in favor of clean iconography, and permanently tearing out the single-photo limitation to introduce a robust 20-Image / 1-Video relational Gallery Model.

## Proposed Changes

### 1. Store Workspace Action Cleanup & Banner Modernization
#### [MODIFY] `app/ui/views/store_detail_view.py`
- Strip the massive text buttons. Convert `Export Logo` / `Export Assets` into elegant `QToolButton` blocks mapping modern built-in PySide6 icons (`QStyle.StandardPixmap` like `SP_DialogSaveButton`, `SP_DirOpenIcon`).
- Explicitly remove the `Export Store Banner` action completely per functional request.
- **Dynamic Banner Container**: The topmost `QLabel` hosting the Banner will be bound to its own sub-classed `ResizeImageLabel` (or via overridden Event filters). The banner scales fluidly with `Qt.AspectRatioMode.KeepAspectRatioByExpanding` and crops perfectly bounding the width without squeezing out of proportion like a native wide web header.

### 2. The Listing Media Model (Relational SQLite)
#### [NEW] `app/models/listing_media.py` & `app/repositories/listing_media_repository.py`
- Expose a true Python Dataclass `ListingMedia` and an isolated Repository maintaining:
  - `id`, `listing_id`, `media_type` ('image' / 'video'), `internal_path`, `original_name`, `sort_order`, `created_at`.
- Enable explicit `ON DELETE CASCADE` mappings connecting directly to `listings(id)`.

### 3. Service Layer Architecture & Storage Refinements
#### [MODIFY] `app/services/listing_service.py`
- We will actively enforce the business limits inside the payload mapping interactions: 
  - Validating no more than `20` Images per Listing.
  - Validating no more than `1` Video per Listing.
#### [MODIFY] `app/services/storage_service.py`
- Abstract file pathways deeper: routing dynamic files into `sellora_data/listings/{listing_id}/images/` and `sellora_data/listings/{listing_id}/video/`.
- The storage logic maps loop copies cleanly retaining the original file strings intact.

### 4. DB Migrations & Safety Checks
#### [MODIFY] `app/database/connection.py`
- Inject safe creation boundaries extending `bootstrap_db()`:
  - Generate the new `listing_media` SQL Schema natively.
  - Form a data migration algorithm sweeping any legacy `main_image_path` entries off existing `listings` tables gracefully inserting them as `image` into the `listing_media` table correctly retaining integrity.
  - The legacy `main_image_path` column effectively sinks into UI deprecation without aggressively dropping SQLite columns or demanding total rebuilds (Data stays natively intact natively).

### 5. Media Gallery UX
#### [MODIFY] `app/ui/dialogs/add_listing_dialog.py` & `app/ui/dialogs/edit_listing_dialog.py`
- Replace single-image text boxes mapping `QFileDialog.getOpenFileNames` cleanly displaying "X Photos Selected" and allowing explicit solitary `[Select Video]` options cleanly.
#### [MODIFY] `app/ui/views/store_detail_view.py`
- The selected row in a Workspace Table cleanly mounts an embedded Media Preview Section mapping image thumbnails elegantly. This ensures users definitively see and interact securely with their visual files dynamically without needing to click `[Edit]` whatsoever.

### 6. Architectural Documentation
#### [MODIFY] System Docs
- Log exact data updates bounding operations across `ARCHITECTURE.md`, `DECISIONS.md`, and `PROGRESS.md` natively cementing the 20-Image / 1-Video relational boundary replacing the legacy single configurations cleanly.

## User Review Required
Are there any specific Video format boundaries (e.g. exclusively `.mp4` or `.mov`) you want to explicitly enforce inside the PySide6 constraints during `[Select Video]`, or do we permit generalized `*.*` inputs currently?

## Verification Plan
1. Render a massive wide-aspect visual mapping onto the Store Banner, stretch the Sellora desktop frame natively, and confirm it clips fluidly exactly like a web-header without squeezing dimensions.
2. Launch against an existing Database verifying `main_image_path` correctly translates onto the localized UX galleries safely.
3. Attempt importing `21` photos directly -> Assert system strictly denies the bounding parameters immediately.
4. Test Workspace selecting rows dynamically pushing 5 Images and 1 Video seamlessly underneath the table.
