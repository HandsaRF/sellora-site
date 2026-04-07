# Sellora Project Brief

## Goal

Build a premium, modern, store-centered Etsy operations app that is moving from a local desktop workflow into a dedicated web product.

## Current Product Direction

- The web app is the active direction.
- The desktop app remains useful as a domain and data reference during migration.
- The current desktop visual style is not the design reference for the web app.

## Product Principles

- **Store-centered workflow**: Stores are the main navigation object.
- **Minimal friction**: Adding/editing stores and listings should feel fast and direct.
- **Clear data boundaries**: A listing belongs to exactly one store.
- **Local-first during migration**: The web app still uses local SQLite and local uploads for now.
- **Cloud-ready architecture**: Storage and database choices should be easy to swap later.

## Web MVP Scope

- Dashboard
- Stores
- Store Workspace
- Add/Edit Store
- Add/Edit Listing within a store
- Local logo upload

## Explicit Web Product Rules

- Do not expose `store_code` in the web product.
- Do not build a separate global `Listings Master` page for the web MVP.
- Listing work should live mainly inside each store workspace.
- Follow the new dark, minimalist, glass-style design system.

## Not In Scope For This Phase

- Authentication and multi-user permissions
- Cloud storage migration
- Hosted Postgres migration
- Profitability analytics
- Full marketplace automation features
