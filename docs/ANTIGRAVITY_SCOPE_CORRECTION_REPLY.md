# Antigravity Scope Correction Reply

Good progress. Please continue, but correct the scope before going deeper.

Important product corrections:

- Do not use the current desktop app as a visual reference.
- Do not include `store_code` in the web product.
- Do not build or keep a separate `Listings Master` page in the web MVP.
- Listing work should live mainly inside each store workspace.

Please make these changes next:

1. Remove the `Listings Master` navigation item and `/listings` page from the current web MVP.
2. Remove the `Store Code` column and any visible `store_code` usage from the web UI.
3. Rename `Stores Master` to just `Stores` unless there is a strong reason not to.
4. Add the next core page as `Store Workspace` / store detail instead of continuing the global listings view.
5. Connect the dashboard and stores screens to real API data before adding more static screens.
6. Add store-scoped listing APIs, for example:
   - `GET /stores`
   - `GET /stores/{id}`
   - `GET /stores/{id}/listings`

Important technical correction:

- Please verify and fix the database root path in `web-api/database.py` before relying on the API.
- It currently appears to resolve one directory too high for this repo.

After that, the next priority should be:

- real dashboard data
- real stores data
- store workspace route and screen
- local-first upload flow through the storage adapter

Keep the web app clearly separated from the desktop app, but continue reusing the current domain logic where useful.
