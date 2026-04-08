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
- Separate Gmail parser lab page

### Current Web Working Flows

- Add store
- Edit store
- Add listing inside a store
- Edit listing inside a store
- Upload store logo
- Add/Edit/Delete dummy transaction inside a store workspace
- Edit listing style options with add/remove controls
- Store listing sourcing/cost profiles saved locally

### Current Web Design Progress

- Dark glass-style app shell
- Store and listing status badges with richer color treatment
- Page-level success/error flash notices
- Store workspace layout shaped around store-specific action and listing work
- Gmail parser lab with event-based color coding:
  - sale = green
  - pending approval = amber
  - refund completed = red
  - refund issue = orange

### Gmail Parser Lab Progress

The separate Gmail parser lab is now a real working subsystem.

Completed:

- Raw `.eml` upload and raw-text paste parsing
- Local parser history storage
- Real Google OAuth web flow for the lab
- Gmail API sync using `from:transaction@etsy.com`
- Multi-page Gmail sync instead of a single small page
- Larger local parser history retention

Current parser coverage:

- Sale emails
- Pending approval / processing emails
- Refund completed emails
- Refund issue / failed refund emails

Current parsed sale fields:

- storefront
- seller/owner
- line items
- listing title
- style
- transaction id
- quantity
- subtotal

Current parsed refund fields:

- order number
- refund amount
- refund status
- affects finance
- transaction id when present
- listing title when present
- refund reason when present

## Current Status

Sellora is now in a real transitional state:

- Desktop app still exists
- Web app foundation exists
- Store workspace planning is now partly implemented, not just documented
- Separate Gmail parser lab exists and is connected to real Gmail OAuth/sync
- Core store and listing mutation flows are working in the web app
- The repo is prepared for GitHub and actively being updated there

## Last Verified State

Verified on 2026-04-08:

- `npm run lint` passes in `web/`
- local frontend responds on `http://localhost:3005`
- local API responds on `http://127.0.0.1:8000`
- store update API responds successfully
- Gmail lab responds on `http://localhost:3005/gmail-lab`
- Gmail OAuth routes exist and the lab can connect to a real Gmail account
