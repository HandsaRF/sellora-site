# Sellora Web Style Research

Last updated: 2026-04-04

## Goal

Review public web apps in the same general niche as Sellora:

- Etsy seller tools
- listing optimization tools
- multichannel ecommerce operations tools

Then use that review to guide Sellora's future web design.

## Sellora starting point

The current desktop app already has a useful visual base:

- dark shell
- left sidebar layout
- cool blue accent
- card + table structure

References:

- [theme.py](/C:/Users/ofir/Documents/liam%20projects/Sellora/app/utils/theme.py)
- [main_window.py](/C:/Users/ofir/Documents/liam%20projects/Sellora/app/ui/windows/main_window.py)

## Quick finding

Most tools in this niche fall into one of four visual patterns:

1. Utility-first data tools
2. Creator-friendly marketing tools
3. Traditional operations dashboards
4. Feature-heavy all-in-one tools

Sellora should borrow the strengths of each, but avoid their typical visual weaknesses.

## Competitor review

### 1. eRank

Sources:

- [Homepage](https://erank.com/)
- [Keyword research page](https://erank.com/keyword-research)
- [Features overview](https://help.erank.com/features/)
- [Top sellers page](https://erank.com/top-sellers/country/united-states)

What stands out:

- Very data-forward
- Strong SEO/research positioning
- Heavy use of tables, lists, keyword metrics, and utility navigation
- Feels built for users who want depth and detail fast

Visual/style takeaway:

- Functional and trustworthy
- Not especially premium or emotionally branded
- More "tool" than "product experience"

What Sellora should borrow:

- clear information hierarchy
- serious, useful data presentation
- fast access to operational tools

What Sellora should avoid:

- dense pages that feel overwhelming
- too many equally loud tool options
- a purely analytical look with no calm visual rhythm

### 2. Marmalead

Sources:

- [Homepage](https://marmalead.com/)
- [Marmalead blog example](https://blog.marmalead.com/best-etsy-keyword-tool/)

What stands out:

- More human and coach-like than eRank
- Public pages emphasize "answers, not charts"
- Uses sample screens of keyword charts, comparisons, grades, and AI insights
- Feels more guided and educational

Visual/style takeaway:

- Softer and friendlier than typical analytics software
- Still structured, but less intimidating
- Better at turning data into advice

What Sellora should borrow:

- guided interpretation
- more supportive UX language
- clearer "what should I do next?" moments

What Sellora should avoid:

- overly playful branding that weakens the premium feel
- too much marketing language inside the product itself

### 3. EverBee

Sources:

- [Features](https://everbee.io/features/)
- [Research pricing](https://everbee.io/pricing/)
- [Store pricing](https://everbee.io/store-pricing/)

What stands out:

- Strong creator-focused positioning
- Simple, conversion-oriented messaging
- "Fastest", "smartest", "built for creators" language
- Feels optimized for ease, momentum, and business setup speed

Visual/style takeaway:

- More polished and consumer-friendly
- Less intimidating than traditional operations software
- More brand-led than pure data-led tools

What Sellora should borrow:

- strong first impression
- simpler onboarding feel
- clear emphasis on speed and ease

What Sellora should avoid:

- landing-page energy taking over the actual workspace
- oversimplifying serious operational views

### 4. EHunt / EtsyHunt

Source:

- [EHunt homepage](https://ehunt.ai/en?ref=etsyhunt)

What stands out:

- Very broad all-in-one positioning
- High feature density
- Lots of CTAs, badges, counters, logos, and linked tool areas

Visual/style takeaway:

- Aggressive and busy
- Feels powerful, but not calm
- More breadth than focus

What Sellora should borrow:

- confidence in the product scope
- clear modules for different job types

What Sellora should avoid:

- visual crowding
- too many calls to action on one screen
- making every feature look equally important

### 5. Sellbrite

Sources:

- [Homepage](https://www.sellbrite.com/)
- [Inventory management](https://www.sellbrite.com/inventory-management-software/)
- [Dashboard help article](https://support.sellbrite.com/en/articles/3367255-understanding-the-sellbrite-dashboard)

What stands out:

- Traditional operations SaaS
- Emphasis on centralized control, syncing, bulk editing, and reporting
- Public material points to a practical dashboard with to-dos, total sales, total orders, and activity views

Visual/style takeaway:

- Familiar and dependable
- Good for operations clarity
- More conventional than distinctive

What Sellora should borrow:

- strong operational overview
- practical dashboard modules
- good support for bulk and routine work

What Sellora should avoid:

- generic B2B admin styling
- flat, forgettable screens with no identity

### 6. Printful

Sources:

- [Sales stats help article](https://help.printful.com/hc/en-us/articles/360014009320-Where-can-I-see-my-Printful-sales-stats)
- [Add products help article](https://help.printful.com/hc/en-us/articles/360014007240-How-do-I-add-products-to-my-store)

What stands out:

- Flow-oriented dashboard language
- Clear navigation paths like Dashboard -> Stores -> Add product
- Strong separation between stats, billing, products, and store actions

Visual/style takeaway:

- Clear operational flow
- Better product thinking than many niche seller tools
- Strong at guiding multi-step work

What Sellora should borrow:

- step-by-step flows
- obvious action hierarchy
- distinct workspaces for different jobs

What Sellora should avoid:

- fragmenting the product into too many disconnected sections

## Cross-market pattern summary

### What the better products do well

- They separate analytics from action
- They provide one clear primary action per area
- They make recurring workflows obvious
- They use charts, tables, and summaries differently instead of styling everything the same

### What weaker experiences tend to do

- cram too many modules together
- overuse cards without hierarchy
- make the dashboard feel like a wall of widgets
- confuse marketing energy with product quality

## Recommended direction for Sellora

### Positioning

Sellora should feel like:

- a premium operating system for Etsy store work
- calmer than EHunt
- more refined than eRank
- more operational than EverBee
- more distinctive than Sellbrite

### Visual language

Recommended direction:

- dark premium shell
- minimalist glass surfaces
- cool accent color
- strong typography and generous spacing
- soft gradients in the background
- readable, mostly solid tables and forms inside the glass shell

### Interaction language

The interface should say:

- here is what matters
- here is what changed
- here is what to do next

Not:

- here are 30 widgets and 20 metrics at once

### Dashboard recommendation

The dashboard should not be only KPI cards.

It should combine:

- a calm top summary
- a "needs attention" section
- recent listing/store activity
- quick actions
- one focused performance view

### Stores and listings recommendation

Store and listing screens should feel more like a workspace than a spreadsheet.

That means:

- sticky header
- strong context title
- focused filters
- bulk actions later, not first
- media preview built into the page naturally

## Final design recommendation

Sellora web should use:

- modern minimalist glass styling
- premium dark theme
- restrained motion
- strong typography
- clear dashboard hierarchy
- operational clarity over flashy decoration

If a competitor-inspired sentence sums it up best:

Sellora should combine eRank's usefulness, Marmalead's guidance, EverBee's approachability, and Sellbrite's operational clarity, then wrap all of that in a much more premium visual system.

## Notes

This review is based on public pages, public help content, and publicly visible product descriptions/screenshots on the cited sites. Some style conclusions are necessarily inference-based because internal product screens are only partially visible from public sources.
