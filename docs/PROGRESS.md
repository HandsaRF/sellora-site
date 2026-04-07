# Progress Tracking

## Completed Milestones

### Milestone 1: Pre-requisites & UI Shell
- Defined core architecture.
- Built main UI shell (`MainWindow`) with `QStackedWidget` routing.
- Configured modular styling (`theme.py`).

### Milestone 2: Architecture & Bound Validations
- Bootstrapped SQLite database with `CHECK` persistence-boundary validations.

### Milestone 3: Model-View Master Tables
- Added pure `QAbstractTableModel` architectures isolating UI from repository queries.

### Milestone 4: Add Store & Add Listing
- Initialized operational dialog components (`AddStoreDialog`, `AddListingDialog`).
- Implemented inline `QLabel` field validation eliminating normal-use `QMessageBox` popups.

### Milestone 5: Listing Edit Workflow
- Addressed contextual single-item modification patterns (`ListingService.get_listing` & `.update_listing`).
- Executed `EditListingDialog` correctly natively updating localized tables.

### Milestone 6: Store Edit Workflow
- Executed `EditStoreDialog` locking context safely into the active Silo preserving isolated operations.

### Milestone 7: Safe Delete Workflows
- **Files Modified**: 
  - `app/repositories/listing_repository.py`
  - `app/repositories/store_repository.py`
  - `app/services/listing_service.py`
  - `app/services/store_service.py`
  - `app/ui/views/store_detail_view.py`
  - `app/ui/windows/main_window.py`
- **Files Created**: 
  - `app/ui/dialogs/delete_listing_dialog.py`
  - `app/ui/dialogs/delete_store_dialog.py`
- Executed secure validation boundaries cleanly mapping to Service layers dynamically executing the active `ON DELETE CASCADE` backend instructions safely. 
- Ejection sequencing from deleted stores correctly transitions layout UI away from dead cache contexts executing total reloads seamlessly upon Master tab boundaries. 

### Milestone 9: Media Management & Smart Dates
- Overhauled `Store` capabilities injecting safely `banner_path` and `logo_path` via database PRAGMA operations natively preserving legacy installs.
- Completed absolute media `[Browse...]` selectors utilizing Qt's `QFileDialog`.
- Corrected the `ListingRepository.update()` method ensuring `files_path`, `main_image_path`, and `upload_date` successfully map back into the SQLite instances permanently.
- Added autofill UI injection logic successfully mapping `datetime` to Uploaded statuses dynamically.

### Milestone 10: Visibility & UX Pathing
- Altered `StoreDetailView` creating a `QFrame` "Branding Header" explicitly displaying `logo_path` and `banner_path` variables leveraging PySide6 native `QPixmap` rendering.
- Re-aligned UI components dropping the 'logo' title strictly for Store concepts, while Listings securely employ the 'Main Photo' terminology.
- Linked real-time event loading updating visual previews `[Browse...]` seamlessly within `AddListingDialog` and `EditListingDialog`.

## Current Status
### Milestone 11: Workspace UX & Managed Media Storage
- Converted Sellora to heavily implement deep Storage Management via a clean `StorageService` strictly generating dynamic managed local folders bypassing fragile URL mapping paths.
- Enforced a 2-Step Storage Pipeline directly hooking Create operations, pushing external files directly into `sellora_data/` explicitly tracking generated DB IDs natively avoiding file mapping clashes.
- Wiped `Researching` and `Preparing` mapping strings natively out of the SQL instances dynamically `UPDATE`-ing the schema into `Draft`.
- Designed robust Retrieval limits binding absolute UI export pathways explicitly enabling localized fetching properties (e.g. `[Export Store Logo]`).
- Overhauled User visibility directly mounting massive horizontal `QPixmap` models natively stretching exact top-bounded constraints rendering Banner immersion perfectly.

## Current Status
Milestone 11 officially completed. The storage system handles autonomous sandboxing strictly mapping explicit ID limits automatically protecting media. Awaiting UI polish elements targeting glass/animations.
