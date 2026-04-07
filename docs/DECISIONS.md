# Product And Technical Decisions

## Product Decisions

1. The web app is the active product direction.
2. The current desktop visual style is not the design reference for the web app.
3. The web app should be store-centered.
4. `store_code` must not be shown in the web UI.
5. A separate global web `Listings Master` page is not part of the MVP.
6. Listing work should live mainly inside each store workspace.
7. The visual direction is modern, premium, dark, minimalist, and glass-style.

## Technical Decisions

1. Keep the existing desktop app in `app/` intact while building the web app separately in `web/` and `web-api/`.
2. Use Next.js for the web frontend.
3. Use FastAPI for the web backend so the project can continue to reuse Python-side logic and migrate incrementally.
4. Keep local SQLite during the current migration phase.
5. Keep local file storage during the current migration phase, but route uploads through a storage abstraction.
6. Use store-scoped API routes for listings in the web MVP.
7. Use `router.refresh()` driven server rendering in the current web UI instead of adding heavier client state management too early.
8. Use page-level flash notices and strong status badges to make saves and status state more obvious in the web app.

## Operational Decisions

1. The local web stack should start from the repo root using the provided `start-web-dev` scripts.
2. Local databases, uploads, logs, `.next`, `node_modules`, and virtual environments should stay out of git.
3. Older milestone docs are historical reference only and should not override the current web-first docs.
