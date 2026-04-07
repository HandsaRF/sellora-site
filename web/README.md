# Sellora Web

This folder contains the Sellora web frontend built with Next.js.

## Purpose

The web app is the new product surface for Sellora. It is intentionally separate from the existing desktop UI and follows the dark glass-style design system defined in the project docs.

## Run

From the repository root, the recommended way to start the full web stack is:

```powershell
.\start-web-dev.bat
```

That launches:

- Next.js frontend on `http://localhost:3005`
- FastAPI backend on `http://127.0.0.1:8000`

## Structure

- `src/app/` - routes and server-rendered pages
- `src/components/` - reusable UI components
- `src/lib/` - shared frontend utilities
