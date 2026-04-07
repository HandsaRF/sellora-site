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

## Current Working Web Features

- Dashboard
- Stores page
- Store workspace page
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
- `web/src/components/StoreFormDialog.tsx`
- `web/src/components/ListingFormDialog.tsx`
- `web/src/components/UploadLogo.tsx`
- `web/src/components/StatusBadge.tsx`
- `web/src/components/PageFlashNotice.tsx`
- `web/src/lib/sellora.ts`

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

## Recommended Next Work

- Banner upload
- Listing media upload
- Better loading/offline states
- Real search/filter behavior
- More workspace polish
