# Sellora

Sellora is a desktop-first workflow app that is being migrated into a dedicated web product.

This repository currently contains:

- `app/` - the existing desktop application and domain logic
- `web/` - the new Next.js web frontend
- `web-api/` - the FastAPI backend used by the web app during the migration
- `docs/` - product, migration, and UI planning documents

## Current Direction

The web app is the active product direction.

- Visual direction: modern, premium, dark glass-style interface
- Scope direction: store-centered workflows
- Local-first phase: the web app still uses local storage and the existing SQLite database during development
- Future direction: move storage and database services to hosted infrastructure later

## Development

For local web development, use:

```powershell
.\start-web-dev.bat
```

This starts:

- frontend: `http://localhost:3005`
- API: `http://127.0.0.1:8000`

To stop both services:

```powershell
.\stop-web-dev.bat
```

## Notes

- Local databases, uploads, build output, logs, and virtual environments are intentionally ignored from git.
- The web app currently expects local API access during development.
