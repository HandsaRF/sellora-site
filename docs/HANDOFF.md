# Handoff

## Current Snapshot

Sellora now contains both:

- the original desktop app in `app/`
- the new web product foundation in `web/` and `web-api/`

The web app is the active direction. The desktop app remains a logic/data reference during migration.

## Read Order For A New AI

1. `docs/README.md`
2. `docs/PROJECT_BRIEF.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DECISIONS.md`
5. `docs/PROGRESS.md`
6. `docs/FAILURES.md`
7. `docs/NEXT_STEPS.md`
8. `docs/GMAIL_FIRST_SALES_WORKSPACE_PLAN.md`
9. `docs/GMAIL_PARSER_LAB_PLAN.md`

Then use the design references:

- `docs/WEB_MIGRATION_PLAN.md`
- `docs/WEB_STYLE_RESEARCH.md`
- `docs/SELLORA_WEB_UI_BRIEF.md`

## Product Rules To Respect

- Do not use the current desktop app as the visual reference.
- Do not expose `store_code` in the web UI.
- Do not build around a separate global web `Listings Master`.
- Keep listings primarily inside each store workspace.
- Keep desktop and web code clearly separated.
- Use the Gmail-first sales workspace plan as the current product direction for store operations.
- Keep Gmail parser experimentation in the separate lab first, not inside the main store UI.

## Current Working Web Features

- Dashboard
- Stores page
- Store workspace page
- Gmail parser lab page
- Dummy transaction workflow in the store workspace
- Listing sourcing/cost profiles
- Add/Edit store
- Add/Edit listing inside a store
- Logo upload
- Richer glass-style status badges
- Page-level save/upload notices

## Current Key Files

### Frontend

- `web/src/app/page.tsx`
- `web/src/app/stores/page.tsx`
- `web/src/app/stores/[id]/page.tsx`
- `web/src/app/gmail-lab/page.tsx`
- `web/src/app/api/gmail-lab/sync/route.ts`
- `web/src/app/api/gmail-lab/oauth/start/route.ts`
- `web/src/app/api/gmail-lab/oauth/callback/route.ts`
- `web/src/components/StoreFormDialog.tsx`
- `web/src/components/ListingFormDialog.tsx`
- `web/src/components/DummyTransactionDialog.tsx`
- `web/src/components/GmailParserLab.tsx`
- `web/src/components/UploadLogo.tsx`
- `web/src/components/StatusBadge.tsx`
- `web/src/components/PageFlashNotice.tsx`
- `web/src/lib/sellora.ts`
- `web/src/lib/dummy-transactions.ts`
- `web/src/lib/listing-profiles.ts`
- `web/src/lib/gmail-lab-connection.ts`
- `web/src/lib/gmail-parser-lab.ts`
- `web/src/lib/gmail-parser-history.ts`

### Backend

- `web-api/main.py`
- `web-api/database.py`
- `web-api/routers/stores.py`
- `web-api/routers/dashboard.py`
- `web-api/storage/local_adapter.py`

## Local Run

From the repo root:

```powershell
.\start-web-dev.bat
```

Frontend:

- `http://localhost:3005`

API:

- `http://127.0.0.1:8000`

## Important Local Notes

- Local DB and upload files are ignored from git on purpose.
- The web app currently depends on the local API being running.
- The launcher scripts were fixed to handle Windows-specific process issues.
- The Gmail parser lab also stores local history/connection state in `data/`.
- Google OAuth test mode requires the Gmail account to be added as a test user.
- The preferred local callback URI is:
  - `http://localhost:3005/api/gmail-lab/oauth/callback`

## Recommended Next Work

- Keep validating the Gmail parser lab against more Etsy email variants
- Decide the import bridge from Gmail-lab results into store purchase transactions
- Improve review/approval flow for imported Gmail transactions
- Continue polishing the store workspace around Sales Ledger and Financial Overview
