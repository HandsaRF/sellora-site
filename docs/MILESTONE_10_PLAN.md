# Sellora Milestone 10: Visibility & UX Pathing

## Goal
To visibly surface the saved `logo_path`, `banner_path`, and listing `main_image_path` in the application natively. This guarantees the user is never disconnected from their selected media references by showing previews over abstract UI states.

## Proposed Changes

### Store Branding Visibility
#### [MODIFY] `app/ui/views/store_detail_view.py`
- We will construct a `QFrame` header labeled "Store Branding Header".
- **Banner Display**: Attach a horizontal `QLabel`, mapping the `QPixmap` scaled and clipped gracefully representing the `banner_path`. Show an empty "No Banner Attached" state if `None`.
- **Logo Display**: Attach a boxed `QLabel` (100x100) mapping the `QPixmap` for the `logo_path`.
- Both elements will load dynamically within the existing `load_store(store_id)` architecture.

### Listing Context Visibility & Naming
#### [MODIFY] `app/ui/dialogs/add_listing_dialog.py` & `app/ui/dialogs/edit_listing_dialog.py`
- Overhaul the label names ensuring we stick explicitly to "Main Photo" and "Listing Assets". "Logo" is systematically disallowed from surfacing inside Listings.
- **Main Photo Real-time Preview**: Inject a graphical preview container (`QLabel`) directly inside the dialogs. As soon as the `QFileDialog` fetches a local path (or the edit loads an existing one), parse the backend location natively and display a scaled `QPixmap` of the Main Photo inline ensuring exact certainty before saving.

#### [MODIFY] `app/ui/table_models/listing_table_model.py`
- The `ListingTableModel` is currently completely operational but we will ensure any legacy column names map safely to generic string formats.

### UX Expectations
- No excessive validation popups will be used. If an invalid image path is selected natively, the `QPixmap` simply falls back dynamically to "Image Not Found/Invalid", allowing the manager to correct their own pathing visually.

### Documentation Update
- Expand `ARCHITECTURE.md` describing that PySide6 native `QPixmap` containers hold the visual translation responsibilities without saving to SQL. Complete standard updates on tracking states.

## Verification
1. Appends Store logo manually -> Previews immediately inside Store Details correctly bounded.
2. Edit Listing -> Fetch local image testing exact PySide6 rendering rendering without crashing dialog.
3. Validate strings match architecture goals.
