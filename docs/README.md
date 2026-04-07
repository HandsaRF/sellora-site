# Docs Guide

This folder mixes current source-of-truth docs and older milestone history. If an AI agent or new collaborator needs context quickly, use this file as the entry point.

## Read First

1. `PROJECT_BRIEF.md`
2. `ARCHITECTURE.md`
3. `DECISIONS.md`
4. `PROGRESS.md`
5. `FAILURES.md`
6. `NEXT_STEPS.md`
7. `HANDOFF.md`

## Design And Migration References

- `WEB_MIGRATION_PLAN.md`
- `WEB_STYLE_RESEARCH.md`
- `SELLORA_WEB_UI_BRIEF.md`

These three files define the intended web direction, styling, and migration shape.

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
