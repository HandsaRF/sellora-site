# Sellora Web UI Brief

Last updated: 2026-04-04

## Product feel

Sellora web should feel like a premium control center for Etsy operations.

Keywords:

- modern
- minimalist
- glass
- calm
- focused
- premium
- operational

The app should look more refined than typical seller tools, but it still needs to be highly usable for daily work.

## Design principles

1. Readability beats decoration.
2. Glass is for shells and framing, not for every surface.
3. One primary action per section.
4. Tables and forms should feel solid and dependable.
5. The interface should reduce stress, not create noise.

## Font pair

### Primary heading font

- `Sora`

Why:

- geometric and modern
- looks more premium than default admin fonts
- works well for page titles, section headers, metrics

### UI and body font

- `Manrope`

Why:

- very readable in dashboards and tables
- modern without feeling trendy
- good for dense admin content

### Type scale

- Display: `40px / 48px` / `700`
- Page title: `30px / 38px` / `600`
- Section title: `20px / 28px` / `600`
- Card value: `28px / 34px` / `700`
- Body large: `16px / 24px` / `500`
- Body: `14px / 22px` / `500`
- Small: `12px / 18px` / `500`
- Label/caption: `11px / 16px` / `600`

## Full color system

### Core background

- `--bg-canvas-top: #0b1220`
- `--bg-canvas-bottom: #111827`
- `--bg-radial-a: rgba(78, 168, 255, 0.16)`
- `--bg-radial-b: rgba(16, 185, 129, 0.08)`

Use:

- full app background
- large page atmosphere
- subtle radial glows only

### Glass shell colors

- `--glass-panel: rgba(15, 23, 42, 0.60)`
- `--glass-panel-strong: rgba(15, 23, 42, 0.74)`
- `--glass-border: rgba(148, 163, 184, 0.18)`
- `--glass-highlight: rgba(255, 255, 255, 0.06)`

Use:

- sidebar
- top header
- cards
- modals
- filter bars

### Solid working surfaces

- `--surface-1: #111827`
- `--surface-2: #172033`
- `--surface-3: #1e293b`
- `--surface-hover: #22304a`

Use:

- tables
- input fields
- dropdown menus
- file rows
- hover states

### Text colors

- `--text-strong: #e5eefb`
- `--text-primary: #d4deee`
- `--text-secondary: #9fb0c7`
- `--text-muted: #73839d`
- `--text-on-accent: #08111f`

### Accent colors

- `--accent-1: #7cc6ff`
- `--accent-2: #4ea8ff`
- `--accent-3: #2b7fff`
- `--accent-soft: rgba(124, 198, 255, 0.18)`

Use:

- active navigation
- focus rings
- selected rows
- links
- CTA buttons
- chart highlights

### Semantic colors

- `--success: #34d399`
- `--success-soft: rgba(52, 211, 153, 0.16)`
- `--warning: #f59e0b`
- `--warning-soft: rgba(245, 158, 11, 0.16)`
- `--danger: #f87171`
- `--danger-soft: rgba(248, 113, 113, 0.16)`
- `--info: #60a5fa`
- `--info-soft: rgba(96, 165, 250, 0.16)`

### Status mapping

- `Running`: green
- `Live`: green
- `In Progress`: blue
- `Ready to Upload`: blue
- `Uploaded`: icy blue
- `Not Started`: slate
- `Draft`: slate
- `Paused`: amber
- `Blocked`: red
- `Removed`: muted gray

## Effects and motion

### Glass treatment

- Background blur: `18px`
- Saturation: `140%`
- Border radius for major shells: `20px`
- Border: `1px solid var(--glass-border)`
- Outer shadow: `0 16px 50px rgba(0, 0, 0, 0.28)`
- Inner highlight: `inset 0 1px 0 var(--glass-highlight)`

### Motion

- Page fade: `180ms`
- Card stagger: `30ms` between siblings
- Hover lift: `translateY(-2px)`
- Button press: `translateY(1px)`
- Panel transitions: `200ms ease`

Keep motion subtle. Sellora should feel smooth, not animated for animation's sake.

## Layout system

### Desktop app shell

- Sidebar width: `248px`
- Main content max width: fluid
- Content padding: `24px`
- Gap between major sections: `20px`
- Section stack spacing: `16px`

### Tablet

- Sidebar becomes collapsible
- Filters compress into one row or a drawer
- Secondary metrics wrap below the primary content

### Mobile

- Keep dashboard summary, activity, and quick edits
- Avoid showing dense full tables by default
- Use stacked cards for listings/store summaries

## Sidebar spec

The sidebar is a dark glass column that anchors the app.

### Sidebar contents

- Sellora wordmark
- main navigation
- workspace switcher later if multi-user or multi-store expands
- bottom utility area for profile/settings later

### Sidebar styling

- Background: `var(--glass-panel-strong)`
- Width: `248px`
- Padding: `16px`
- Border right: `1px solid var(--glass-border)`

### Nav item styling

- Height: `44px`
- Radius: `12px`
- Horizontal padding: `14px`
- Text: `14px / 600`
- Default text: `var(--text-secondary)`
- Hover background: `rgba(124, 198, 255, 0.08)`
- Active background: `linear-gradient(180deg, rgba(124,198,255,0.22), rgba(78,168,255,0.14))`
- Active text: `var(--text-strong)`
- Active glow: soft blue outer glow, very restrained

## Top header spec

The top header should be sticky and lightweight.

### Header contents

- breadcrumb or section path
- page title
- page subtitle or state
- search
- quick actions on the right

### Header styling

- Height: `72px`
- Background: `rgba(15, 23, 42, 0.48)`
- Blur: `14px`
- Bottom border: `1px solid rgba(148, 163, 184, 0.12)`
- Horizontal padding: `20px`

## Card spec

Cards are one of the main identity pieces of the UI.

### KPI cards

- Min height: `132px`
- Padding: `18px`
- Radius: `20px`
- Use glass shell
- Small top label, large value, short context line below

### Working cards

- Radius: `18px`
- Padding: `16px`
- Glass shell outside
- Solid internal rows if content is dense

### Card content order

1. Label
2. Primary value or title
3. Context line or delta
4. Optional small action

## Button spec

### Primary button

- Background: `linear-gradient(180deg, #7cc6ff, #4ea8ff)`
- Text: dark ink
- Height: `42px`
- Radius: `12px`
- Shadow: soft blue glow

### Secondary button

- Background: `rgba(124, 198, 255, 0.10)`
- Border: `1px solid rgba(124, 198, 255, 0.22)`
- Text: `var(--text-primary)`

### Destructive button

- Background: `rgba(248, 113, 113, 0.10)`
- Border: `1px solid rgba(248, 113, 113, 0.24)`
- Text: `#ffc0c0`

## Table spec

Tables should not be fully transparent. This is where work happens.

### Table shell

- Outer wrapper can be glass
- Table body should sit on `var(--surface-1)`
- Radius: `16px`
- Header row on `var(--surface-2)`

### Table styling

- Row height: `52px`
- Header text: `12px / 700`
- Body text: `14px / 500`
- Border color: `rgba(148, 163, 184, 0.10)`
- Hover row: `rgba(124, 198, 255, 0.06)`
- Selected row: `rgba(124, 198, 255, 0.10)`

### Listing row contents

- thumbnail
- product name
- store
- status chip
- SKU
- upload date
- actions

## Form spec

### Form shell

- Use glass modal shell
- Radius: `22px`
- Width: `640px` for standard modals
- Padding: `20px`

### Inputs

- Background: `var(--surface-2)`
- Border: `1px solid rgba(148, 163, 184, 0.14)`
- Radius: `12px`
- Height: `42px`
- Focus ring: `0 0 0 3px rgba(124, 198, 255, 0.18)`

### Upload zones

- Dashed border
- Slightly lighter background than inputs
- Drag-over state gets blue soft glow
- Show preview thumbnail or file block immediately

## Exact section layout

### 1. Dashboard

Purpose:

- Give quick clarity
- Show work that needs attention
- Help the user move into the next action fast

Structure:

1. Sticky page header
2. KPI row
3. Attention + recent activity row
4. Store performance row
5. Quick actions row if needed

#### Dashboard sections

`KPI row`

- Total Stores
- Running Stores
- Total Listings
- Live Listings

`Attention panel`

- blocked stores
- listings missing media
- listings ready to upload
- stale listings not updated recently

`Recent activity panel`

- recent store updates
- recent listing updates
- status changes

`Store performance panel`

- top stores by listing count
- live vs total listings by store

`Quick actions`

- Add Store
- Add Listing
- Open Stores

### 2. Stores Master

Purpose:

- Show all stores clearly
- Make entering a store workspace feel fast

Structure:

1. Header with title and add button
2. Search and filters bar
3. Store list/table
4. Optional right-side preview later

Sections:

- title + store count
- search
- status filter
- niche filter later
- add store CTA
- stores list with counts and status

### 3. Store Workspace

Purpose:

- Treat a store like an active workspace, not just a record

Structure:

1. Hero header
2. Store summary cards
3. Branding/media strip
4. Listings table for that store

Sections:

`Hero header`

- banner background
- logo
- store name
- store status
- niche
- quick actions

`Summary cards`

- total listings
- live listings
- last activity
- blocked items

`Branding/media strip`

- logo preview
- banner preview
- recent asset file if useful later

`Listings for store`

- same listing table pattern, scoped to this store

### 4. Add/Edit Store Modal

Sections:

- modal title and short helper line
- general details group
- status row
- branding uploads
- footer actions

### 5. Add/Edit Listing Modal

Sections:

- modal title and helper line
- listing details group
- status/date/SKU row
- main image upload with preview
- asset file upload
- footer actions

## First dashboard wireframe

```text
+--------------------------------------------------------------------------------------+
| Header: Dashboard                         Search                    [Add Store]      |
+--------------------------------------------------------------------------------------+
| KPI 1            | KPI 2            | KPI 3            | KPI 4                      |
| Total Stores     | Running Stores   | Total Listings   | Live Listings              |
| 12               | 5                | 184              | 61                         |
+--------------------------------------------------------------------------------------+
| Needs Attention                                | Recent Activity                    |
| - 2 blocked stores                             | Store updated: Matcha Kits        |
| - 8 ready to upload listings                   | Listing updated: Castle Block Set |
| - 3 listings missing main image                | Store created: Wooden Decor       |
| [Review Issues]                                | [Open Activity]                   |
+--------------------------------------------------------------------------------------+
| Store Performance                                                               ...  |
| Building Blocks Store      24 total / 12 live                                         |
| Matcha Kits Store          18 total /  6 live                                         |
| Wooden Decor Store          9 total /  0 live                                         |
+--------------------------------------------------------------------------------------+
| Quick Actions: [Add Store] [Add Listing] [Open Stores]                                |
+--------------------------------------------------------------------------------------+
```

## Dashboard layout ratios

- KPI grid: `4 columns`
- Attention/activity row: `7 / 5`
- Performance row: full width
- Quick actions row: full width, lighter weight

## CSS token starter block

```css
:root {
  --bg-canvas-top: #0b1220;
  --bg-canvas-bottom: #111827;
  --glass-panel: rgba(15, 23, 42, 0.60);
  --glass-panel-strong: rgba(15, 23, 42, 0.74);
  --glass-border: rgba(148, 163, 184, 0.18);
  --surface-1: #111827;
  --surface-2: #172033;
  --surface-3: #1e293b;
  --text-strong: #e5eefb;
  --text-primary: #d4deee;
  --text-secondary: #9fb0c7;
  --text-muted: #73839d;
  --accent-1: #7cc6ff;
  --accent-2: #4ea8ff;
  --accent-3: #2b7fff;
  --success: #34d399;
  --warning: #f59e0b;
  --danger: #f87171;
}
```

## Build order recommendation

1. Define tokens and typography first
2. Build app shell: sidebar + top header + page container
3. Build reusable card and table components
4. Build dashboard
5. Build stores master
6. Build store workspace
7. Build modals and upload components

## Final summary

Sellora web should look like a premium operational workspace:

- dark atmospheric background
- glass outer shells
- solid readable work surfaces
- cool blue accent
- focused dashboard hierarchy
- workspace-style store pages
- elegant but practical forms and tables

That balance is the key. If the app becomes too decorative, it will lose usability. If it becomes too plain, it will lose identity.
