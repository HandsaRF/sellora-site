# Gmail-First Sales Workspace Plan

> Note: real Gmail parser experimentation now starts in the separate `docs/GMAIL_PARSER_LAB_PLAN.md` flow first. This workspace plan remains the target integration shape after the parser is proven.

## Purpose

This document is the current source of truth for the next Sellora workspace direction.

The web app is moving from a generic store/listing workspace toward a store-centered sales operations workspace that can:

- connect one Gmail account per store
- parse Etsy transaction emails
- match sales to listings
- support manual shipping-cost completion
- calculate estimated profit in USD
- show financial signals directly inside the store workspace

This plan intentionally works without Etsy API approval.

## Core Product Direction

Each store should become its own operating surface with:

- store info
- Gmail connection status
- listings
- sales ledger
- financial overview
- review queue

Each store uses a different Gmail account.

For the first production path, Gmail is the event source and manual completion is allowed where data is still missing.

## Core Business Rules

- Each store connects to its own Gmail account.
- Gmail creates purchase transactions for that store.
- The system only needs these sale fields from Gmail:
  - `store`
  - `listing_title`
  - `style`
  - `transaction_id`
  - `quantity`
  - `subtotal`
- `transaction_id` is the primary sale identifier.
- `subtotal` is the revenue base.
- Personalization is not part of the current workflow.
- `order_number` is not needed for the first version.
- Shipping is not modeled as separate customer revenue for the internal profit workflow.
- Supplier shipping cost is entered manually per purchase until EPROLO API access exists.
- Product base cost belongs to the listing and should be treated as a fixed source value.
- USD order profitability and ILS bank payout reality are separate systems.

## Main Entities

### Store

Required fields:

- `id`
- `store_name`
- `owner_name`
- `status`

Planned operational fields:

- `gmail_account_email`
- `gmail_sync_state`
- `gmail_last_sync_at`
- `gmail_sync_error`

### Listing

Listings should be split into two product sections.

#### Listing Details

Required or primary fields:

- `id`
- `store_id`
- `product_name`
- `status`

Planned fields:

- `title_aliases`
- `tags`
- `description`
- `photos`
- `video`
- `sku`
- `styles`
- `notes`

#### Sourcing And Cost

Planned fields:

- `eprolo_product_link`
- `base_product_cost_usd`
- `style_cost_overrides`
- `expected_profit_target_usd`
- `expected_margin_target_pct`
- `extra_cost_usd`
- `supplier_notes`

### Purchase Transaction

Every sale should become one purchase transaction row.

Required first-version fields:

- `id`
- `store_id`
- `source_type`
- `transaction_id`
- `listing_title`
- `style`
- `quantity`
- `subtotal_usd`

Required before profit is usable:

- `matched_listing_id`
- `supplier_shipping_cost_usd`

Planned operational fields:

- `product_cost_snapshot_usd`
- `estimated_fees_usd`
- `extra_cost_usd`
- `estimated_profit_usd`
- `confidence_state`
- `event_date`
- `reviewed_at`
- `review_notes`

## Revenue And Profit Rules

For the Gmail-first workflow:

- `subtotal` is the sale revenue base
- do not use `item_total`
- do not use `order_total`
- do not use tax as profit

First working formula:

`estimated_profit_usd = subtotal_usd - product_cost_snapshot_usd - supplier_shipping_cost_usd - estimated_fees_usd - extra_cost_usd`

Notes:

- Product cost should usually come from the matched listing.
- Shipping cost is manual per purchase for now.
- Fees can begin as manual or estimated values.

## Matching Rules

Matching is store-scoped.

Auto-match order:

1. same store + exact normalized title match
2. same store + exact alias title match
3. same store + title match + same style
4. manual review

Listings should support title aliases so older or variant Etsy titles can still match.

## Store Workspace UI

The store workspace should no longer prioritize a generic "Last update" surface.

The target layout is:

### 1. Store Header

Show:

- store name
- store status
- logo
- Gmail connection state
- quick actions

Quick actions:

- `Add Listing`
- `Edit Store`
- `Connect Gmail`
- `Sync Gmail`
- `Add Dummy Transaction`

### 2. Financial Overview

This replaces the old "Last update" style area.

Show:

- donut chart
- Revenue KPI
- Expenses KPI
- Profit KPI
- review summary

Chart segments:

- Revenue
- Product Cost
- Shipping Cost
- Fees
- Profit

### 3. Sales Ledger

This becomes the main working table for sales.

Columns:

- date
- transaction id
- listing
- style
- quantity
- subtotal
- product cost
- shipping cost
- fees
- estimated profit
- confidence
- action

Quick actions:

- `Match Listing`
- `Enter Shipping`
- `Edit Costs`
- `Mark Reviewed`

### 4. Listings Section

Keep listings inside each store workspace.

Each listing card or row should show:

- title
- status
- total sales
- total revenue
- total estimated profit
- action shortcuts

### 5. Review Queue

Show:

- unmatched sales
- missing shipping cost
- low-confidence matches
- Gmail sync issues
- duplicate transaction ids

## Listing UI

The listing editor should move toward two clear sections.

### Section A: Listing Details

Primary fields:

- product name
- status
- SKU
- title aliases
- styles
- description
- media

### Section B: Sourcing And Cost

Primary fields:

- EPROLO product link
- base product cost USD
- style cost overrides
- expected profit target USD
- expected margin target percent
- extra cost USD

This separation is important for both UI clarity and future automation.

## Transaction Review UI

Each purchase transaction should open into a detail view or dialog with:

### Parsed Sale Data

Read-only fields:

- store
- listing title
- style
- transaction id
- quantity
- subtotal
- source type

### Matching

Fields:

- matched listing
- confidence state
- manual override note

### Cost Completion

Fields:

- product cost snapshot
- supplier shipping cost
- extra cost
- estimated fees

### Financial Output

Calculated:

- subtotal
- total cost
- estimated profit
- margin

## Confidence States

Recommended first states:

- `Dummy`
- `Parsed`
- `Matched`
- `Needs Review`
- `Missing Shipping Cost`
- `Estimated`
- `Reconciled`

## Phase 0: Dummy Information Mode

Before Gmail integration, the workspace should support manual dummy data so the UI and workflow can be tested safely.

### Dummy Transaction Required Fields

- `listing`
- `style`
- `transaction_id`
- `quantity`
- `subtotal_usd`
- `supplier_shipping_cost_usd`

Optional:

- `product_cost_snapshot_usd`
- `estimated_fees_usd`
- `extra_cost_usd`
- `event_date`
- `notes`

### Dummy Mode Behavior

- Dummy transactions should update the Sales Ledger.
- Dummy transactions should update listing totals.
- Dummy transactions should update the Financial Overview.
- Dummy rows must be visibly labeled as non-Gmail data.

## Workflow

### Phase 0 Workflow

1. Open a store workspace.
2. Add a dummy transaction.
3. Select or confirm the listing.
4. Fill subtotal, quantity, shipping cost, and optional fee values.
5. Save the transaction.
6. Refresh the ledger and financial overview.

### Gmail Workflow

1. Connect Gmail for a store.
2. Sync Etsy transaction emails for that store.
3. Parse the required fields.
4. Create purchase transaction rows.
5. Auto-match where confidence is high.
6. Send uncertain rows to review.
7. Worker fills shipping cost.
8. System calculates estimated profit.

## Current Implementation Priority

The next implementation block should follow this order:

1. Add the Phase 0 dummy transaction data model and API.
2. Replace the old store workspace secondary content with Financial Overview and Sales Ledger.
3. Add `Add Dummy Transaction` flow inside the store workspace.
4. Add purchase-transaction confidence states and row badges.
5. Begin extending listings toward the Details vs Sourcing/Cost split.

## Explicitly Deferred

- Etsy API integration
- EPROLO API integration
- bank deposit reconciliation in ILS
- multi-user permissions
- final accounting-grade finance

## Notes For Future AI Work

- Use this file together with `docs/SELLORA_WEB_UI_BRIEF.md`.
- The visual direction remains premium, glass-style, dark, and store-centered.
- Do not reintroduce a global Listings Master flow.
- Do not depend on personalization, order number, or full discount parsing for the first Gmail workflow.
