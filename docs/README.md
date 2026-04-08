# Docs Guide

This folder mixes current source-of-truth docs and older milestone history. If an AI agent or new collaborator needs context quickly, use this file as the entry point.

## Read First

1. `PROJECT_BRIEF.md`
2. `ARCHITECTURE.md`
3. `DECISIONS.md`
4. `PROGRESS.md`
5. `FAILURES.md`
6. `NEXT_STEPS.md`
7. `GMAIL_FIRST_SALES_WORKSPACE_PLAN.md`
8. `GMAIL_PARSER_LAB_PLAN.md`
9. `HANDOFF.md`

## Design And Migration References

- `WEB_MIGRATION_PLAN.md`
- `WEB_STYLE_RESEARCH.md`
- `SELLORA_WEB_UI_BRIEF.md`
- `GMAIL_FIRST_SALES_WORKSPACE_PLAN.md`
- `GMAIL_PARSER_LAB_PLAN.md`

These files define the intended web direction, styling, migration shape, the Gmail-first sales workspace plan, and the separate Gmail parser lab direction.

## Historical Or Operational References

- `MILESTONE_*.md`
- `ANTIGRAVITY_*.md`

These files can still be useful, but they are not the main source of truth anymore. The current product direction is store-centered web migration, not continued desktop-only feature expansion.

## Local Development

From the repo root:

```powershell
.\start-web-dev.bat
```

This starts:

- web frontend: `http://localhost:3005`
- FastAPI backend: `http://127.0.0.1:8000`

To stop both:

```powershell
.\stop-web-dev.bat
```

## Gmail Lab Local Setup

The separate Gmail lab now supports real Google OAuth in addition to manual `.eml` parsing.

Local env file:

- `web/.env.local`

Required values:

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_REDIRECT_URI`

Recommended redirect URI:

- `http://localhost:3005/api/gmail-lab/oauth/callback`
