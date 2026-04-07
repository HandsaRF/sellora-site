# Sellora Web Migration Plan

Last updated: 2026-04-04

## Current desktop app shape

Sellora is already close to a web-ready domain model:

- Data is split into `stores` and `listings`.
- The app currently uses a local SQLite file: `sellora.sqlite`.
- Media is not stored inside SQLite blobs. The database only stores local filesystem paths such as:
  - `stores.logo_path`
  - `stores.banner_path`
  - `listings.main_image_path`
  - `listings.files_path`

That means the web migration should not use Google Drive as a database replacement. It should split storage into:

1. A relational database for stores, listings, status, notes, URLs, timestamps.
2. Object/file storage for images, zips, and listing assets.

## Recommended target architecture

### Best fit for Sellora

- Frontend: Next.js
- Backend API: FastAPI
- Database: PostgreSQL
- File storage: S3-compatible object storage
- Auth: Supabase Auth or Clerk

Why this fits:

- Your current app is Python, so FastAPI lets you reuse the current service and repository thinking.
- PostgreSQL maps naturally to the existing `stores` and `listings` tables.
- Object storage maps naturally to your current image/file fields.
- Next.js is a practical frontend for dashboard + CRUD screens like Stores, Listings, and Store Detail.

## Product and visual direction

The web version should feel:

- modern
- minimalist
- premium
- efficient
- slightly futuristic, but still practical for daily work

### Preferred visual style

Use a glass-style admin UI rather than a plain corporate dashboard.

That means:

- translucent panels over a soft atmospheric background
- subtle blur, soft borders, and layered depth
- clean spacing and restrained motion
- strong readability first, visual polish second

The current desktop app already points in this direction with its dark slate surfaces and cool blue accent in [theme.py](/C:/Users/ofir/Documents/liam%20projects/Sellora/app/utils/theme.py). The web version should evolve that into a cleaner, more refined design system instead of copying the desktop styling literally.

### Design rules for the web app

- Keep navigation simple: sidebar + focused content area
- Avoid crowded "SaaS noise" dashboards
- Use large, calm cards and clean tables
- Make the app feel more premium than the average Etsy tool
- Prefer a limited palette with one main accent color
- Use glass effects only on shells, cards, filters, modals, and headers
- Keep data tables and forms more solid and readable than decorative

### Color direction

You did not give a final brand palette yet, so the safest starting point is:

- background: deep ink / slate
- surface: dark glass panels
- accent: cool blue leaning slightly icy
- success: muted green
- warning: amber
- danger: soft coral/red

Suggested starter tokens:

- `--bg-1: #0f172a`
- `--bg-2: #111827`
- `--panel: rgba(17, 24, 39, 0.62)`
- `--panel-border: rgba(148, 163, 184, 0.16)`
- `--text-1: #e5eefb`
- `--text-2: #9fb0c7`
- `--accent: #7cc6ff`
- `--accent-strong: #4ea8ff`

If you later choose a different accent color, the system should support that by swapping tokens without redesigning the app.

## Transitional storage approach

Before moving fully to cloud storage, the first web version can support temporary local saving.

### Good use of temporary local saving

- local development
- internal testing
- first private MVP on one machine or one server

### How it should work

- Database can still move to Postgres early
- File uploads can temporarily save to a local folder such as `/data/uploads` or `/var/sellora/uploads`
- The app should use a storage adapter interface so local disk and cloud object storage behave the same from the app's point of view

Suggested adapter modes:

- `LocalStorageAdapter`
- `S3StorageAdapter`

### Important limitation

Local saving is a bridge, not the end state.

It becomes painful when:

- you deploy multiple app instances
- you want reliable backups
- you want team access
- you need durable media serving

So the correct sequence for Sellora is:

1. Build the web app with a storage abstraction
2. Start with local file storage if you want faster progress
3. Switch the adapter to Supabase Storage, R2, or B2 later

## Storage recommendation

### My recommendation

If you want the best balance of simplicity and low cost, start with one of these:

1. Simplest overall: Supabase for Postgres + Auth + Storage
2. Cheapest serious setup: Neon for Postgres + Cloudflare R2 for file storage

### What I would avoid as the primary app storage

- Google Drive / Google One as the main storage backend

Why:

- Drive is built around user files, folders, and sharing, not app-native object storage.
- Permissions and ownership are more awkward for a multi-user web app.
- API quotas and rate limits exist and need retry handling.
- It is fine for manual backup/export, but not ideal as the main storage layer for a production web app.

## Option comparison

### Option A: Supabase

Good when you want the fastest path to a real web app.

- Postgres, auth, storage, and APIs in one platform
- Storage supports S3-compatible access
- Easier to launch an MVP with fewer moving parts
- Pro plan is currently `$25/mo` for the organization, with examples in Supabase docs showing the included micro compute offsetting the base cost for a small single-project setup
- Included quotas currently documented by Supabase:
  - `100 GB` storage
  - `250 GB` egress + `250 GB` cached egress
  - `8 GB` database disk included before disk overage pricing

Tradeoff:

- Usually not the absolute cheapest file storage if you grow large media usage.

### Option B: Neon + Cloudflare R2

Good when you want to keep monthly cost low and still use proper cloud architecture.

- Neon gives you serverless Postgres
- Cloudflare R2 gives you object storage with no internet egress fee
- Very good fit if images/assets may grow over time

Current official pricing I checked:

- Neon Free: `0.5 GB` storage included
- Neon Launch: typical spend shown as about `$15/mo`, plus `storage at $0.35/GB-month`
- Cloudflare R2 Standard:
  - `10 GB/month` free storage
  - `1 million` Class A ops free
  - `10 million` Class B ops free
  - then `storage at $0.015/GB-month`
  - `no egress fees`

Tradeoff:

- More setup than Supabase because auth, storage, and database are split.

### Option C: Backblaze B2 + hosted Postgres

Good when raw storage price matters most.

- B2 is affordable and S3-compatible
- Current pricing page shows storage starting at `$6/TB/month` (`~$0.006/GB-month`)
- First `10 GB` storage is free
- Free egress up to `3x` average monthly stored data, then overage is low

Tradeoff:

- Cheaper than many competitors for storage, but R2 is often nicer for app delivery because R2 has no egress fee at all.

### Option D: Google-native stack

If you strongly prefer Google:

- Database: Cloud SQL for PostgreSQL
- File storage: Google Cloud Storage or Firebase Storage

This is the correct Google direction for a web app, not Google Drive.

Tradeoff:

- Usually more complex and often more expensive on bandwidth/egress than R2 or B2.
- Google Drive / Google One pricing is attractive for personal storage, but that does not make Drive the right storage backend for a web app.

## My practical recommendation for Sellora

### If you want the easiest good solution

Use Supabase first.

This is the best starting point if you want to move quickly, keep ops simple, and avoid spending weeks wiring infrastructure.

### If you want the most affordable proper architecture

Use Neon + Cloudflare R2.

This is the best cost-conscious architecture for Sellora if you are comfortable managing two services instead of one.

## How Sellora should store files on the web

Do not store local absolute paths like:

- `C:\...logo.png`
- `D:\...assets.zip`

Store object keys and metadata instead, for example:

- `stores/{store_id}/branding/logo.png`
- `stores/{store_id}/branding/banner.png`
- `stores/{store_id}/listings/{listing_id}/main-image.png`
- `stores/{store_id}/listings/{listing_id}/assets/source.zip`

Suggested metadata to keep in the database:

- `storage_provider`
- `bucket_name`
- `object_key`
- `original_filename`
- `mime_type`
- `byte_size`
- `uploaded_at`

## Suggested schema change

Instead of keeping only a single text path per asset, add a dedicated asset table.

Example:

- `files`
  - `id`
  - `store_id` nullable
  - `listing_id` nullable
  - `kind` (`logo`, `banner`, `main_image`, `asset_archive`)
  - `provider`
  - `bucket`
  - `object_key`
  - `filename`
  - `mime_type`
  - `size_bytes`
  - `created_at`

That gives you:

- multiple files per listing later
- safer uploads
- easier replacements/history
- simpler signed URL generation

## Suggested migration phases

### Phase 1: Stabilize the domain

- Keep the current Python models and business rules
- Define the final web API contracts around stores, listings, dashboard, and file upload

### Phase 2: First web MVP with local file saving

- Build the web app and API
- Keep uploads on local disk through a storage adapter
- Preserve the same `logo`, `banner`, `main image`, and `asset file` concepts
- Use this phase to validate workflows and UI without cloud complexity

### Phase 3: Move SQLite to Postgres

- Create Postgres schema equivalent to `stores` and `listings`
- Migrate existing data from `sellora.sqlite`
- Keep media fields temporarily while introducing the new file table

### Phase 4: Add object storage

- Upload store branding and listing assets to cloud storage
- Replace absolute path usage with stored object keys
- Serve files through signed URLs or controlled public URLs

### Phase 5: Refine the premium web frontend

- Dashboard
- Stores list
- Store detail
- Add/edit dialogs as forms/pages
- Glass-style design polish
- Responsive tablet/mobile behavior
- Search, filters, empty states, and upload UX polish

### Phase 6: Add auth and sharing

- Single owner first
- Then optional team roles later

## Recommended first build

If starting this week, I would build:

1. FastAPI backend
2. Next.js frontend for Stores and Listings
3. Storage adapter interface
4. Local disk upload mode first
5. Postgres migration right after the first working web workflow
6. Cloud storage switch after that

## Notes on cost

For Sellora's current size, the database cost should be tiny. The bigger long-term cost driver is file serving and downloads, not the raw row data.

That is why the storage decision matters more than the database decision:

- relational data is small
- images and assets can grow fast
- egress costs can surprise you on some providers

## Sources checked

- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
- Cloudflare R2 storage classes: https://developers.cloudflare.com/r2/buckets/storage-classes/
- Neon pricing: https://neon.com/pricing
- Supabase billing overview: https://supabase.com/docs/guides/platform/billing-on-supabase
- Supabase storage pricing: https://supabase.com/docs/guides/storage/pricing
- Supabase egress pricing: https://supabase.com/docs/guides/platform/manage-your-usage/egress
- Backblaze B2 pricing: https://www.backblaze.com/cloud-storage/pricing
- Google Drive API limits: https://developers.google.com/drive/api/guides/limits
- Google Workspace pricing: https://workspace.google.com/pricing.html
- Google One pricing: https://one.google.com/plans
- Google Cloud Storage pricing: https://cloud.google.com/storage/pricing
- Styling research summary: `docs/WEB_STYLE_RESEARCH.md`
