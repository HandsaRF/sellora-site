# Architecture

## Repository Layout

- `app/`
  The original desktop application built with PySide6. It still contains useful domain, repository, and service logic.
- `web/`
  The Next.js frontend for the new web product.
- `web-api/`
  The FastAPI backend used by the web app during the migration phase.
- `docs/`
  Product, migration, design, and handoff notes.

## Current Runtime Shape

### Desktop App

- Entry point: `run.py`
- Composition root: `app/main.py`
- Data access: `app/repositories/`
- Business logic: `app/services/`
- Local database bootstrap: `app/database/connection.py`

### Web App

- Frontend: `web/`
- Backend: `web-api/`
- Frontend fetches from the API at `http://127.0.0.1:8000`
- Recommended local start scripts:
  - `start-web-dev.bat`
  - `stop-web-dev.bat`

## Data And Storage

- Database: local `sellora.sqlite`
- Local uploads: `data/uploads/`
- Web uploads currently use a storage abstraction in `web-api/storage/`
- The current implementation is local-first, but the abstraction is intended to support future cloud storage

## Product Boundary Rules

- The desktop app and web app are separate product areas.
- Desktop UI code should not be mixed into the web UI.
- The desktop app can still inform business logic and schema choices.
- The web app should not inherit the desktop app visual style.

## Web MVP Architecture

- `web/src/app/page.tsx`
  Dashboard
- `web/src/app/stores/page.tsx`
  Stores list
- `web/src/app/stores/[id]/page.tsx`
  Store workspace
- `web/src/components/StoreFormDialog.tsx`
  Add/Edit store flow
- `web/src/components/ListingFormDialog.tsx`
  Add/Edit listing flow
- `web/src/components/UploadLogo.tsx`
  Local-first logo upload flow
- `web/src/lib/sellora.ts`
  Shared frontend types, status appearance logic, API URL helper, flash messaging
- `web-api/routers/stores.py`
  Store and store-scoped listing endpoints

## Important Constraints

- `store_code` still exists in the SQLite schema for compatibility, but it is hidden from the web product.
- Listings are treated as store-scoped in the web MVP.
- A separate global web `Listings Master` page is intentionally not part of the target product.
