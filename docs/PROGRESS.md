# Progress

## Desktop Baseline

The original PySide6 desktop app exists and remains usable as the domain/data reference during migration.

Completed baseline areas:

- SQLite schema and repository/service structure
- Desktop add/edit/delete workflows for stores and listings
- Dashboard/service aggregation patterns
- Local media handling and managed storage concepts

## Web Migration Progress

The web migration foundation is now established in the repo.

### Web Foundation Completed

- Added separate `web/` Next.js application
- Added separate `web-api/` FastAPI backend
- Connected the web backend to the current local SQLite database
- Added local-first file storage abstraction in `web-api/storage/`
- Added start/stop scripts for running the local web stack

### Current Web Product Surfaces

- Dashboard page
- Stores page
- Store workspace page
- Store-scoped listings table inside the workspace

### Current Web Working Flows

- Add store
- Edit store
- Add listing inside a store
- Edit listing inside a store
- Upload store logo

### Current Web Design Progress

- Dark glass-style app shell
- Store and listing status badges with richer color treatment
- Page-level success/error flash notices
- Store workspace layout shaped around store-specific action and listing work

## Current Status

Sellora is now in a real transitional state:

- Desktop app still exists
- Web app foundation exists
- Core store and listing mutation flows are working in the web app
- The repo is prepared for GitHub with git initialized and the first commit created

## Last Verified State

Verified on 2026-04-07:

- `npm run lint` passes in `web/`
- local frontend responds on `http://localhost:3005`
- local API responds on `http://127.0.0.1:8000`
- store update API responds successfully
