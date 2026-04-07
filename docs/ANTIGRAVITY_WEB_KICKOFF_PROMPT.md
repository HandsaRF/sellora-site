# Antigravity Web Kickoff Prompt

You are starting the Sellora web app migration.

Before making decisions, read these files carefully:

- [WEB_MIGRATION_PLAN.md](/C:/Users/ofir/Documents/liam%20projects/Sellora/docs/WEB_MIGRATION_PLAN.md)
- [WEB_STYLE_RESEARCH.md](/C:/Users/ofir/Documents/liam%20projects/Sellora/docs/WEB_STYLE_RESEARCH.md)
- [SELLORA_WEB_UI_BRIEF.md](/C:/Users/ofir/Documents/liam%20projects/Sellora/docs/SELLORA_WEB_UI_BRIEF.md)

Also inspect the current desktop app structure for context:

- [app/database/connection.py](/C:/Users/ofir/Documents/liam%20projects/Sellora/app/database/connection.py)
- [app/utils/theme.py](/C:/Users/ofir/Documents/liam%20projects/Sellora/app/utils/theme.py)
- [app/ui/windows/main_window.py](/C:/Users/ofir/Documents/liam%20projects/Sellora/app/ui/windows/main_window.py)
- [app/repositories/store_repository.py](/C:/Users/ofir/Documents/liam%20projects/Sellora/app/repositories/store_repository.py)
- [app/repositories/listing_repository.py](/C:/Users/ofir/Documents/liam%20projects/Sellora/app/repositories/listing_repository.py)
- [app/services/store_service.py](/C:/Users/ofir/Documents/liam%20projects/Sellora/app/services/store_service.py)
- [app/services/listing_service.py](/C:/Users/ofir/Documents/liam%20projects/Sellora/app/services/listing_service.py)

Important clarification:

- The current desktop app is a reference for domain logic, data shape, workflow, and useful structure.
- The current desktop app is NOT the visual design reference for the web app.
- Do not carry over the current desktop styling, theme, palette treatment, or general visual feel.
- The web app should follow the new visual direction from the markdown briefs, even if it looks very different from the current desktop app.

Current direction you should follow:

1. We are moving Sellora toward a web app.
2. For now, the web app can start with local saving for uploaded files.
3. The long-term target is still proper hosted storage, most likely:
   - easiest path: Supabase
   - more affordable serious setup: Neon + Cloudflare R2
4. The visual direction is locked for now:
   - modern
   - minimalist
   - premium
   - glass-style admin UI
   - dark atmospheric background
   - calm cards
   - solid readable tables/forms
   - cool blue accent system
5. The web app should feel more refined than typical Etsy seller tools.
6. The current desktop style is not approved as the web style.

Important implementation expectations:

- Start working on the web version now using the current repo as the source of truth.
- Reuse the current business/domain thinking where it helps.
- Reuse current UI styling only if there is a purely structural reason, not as a visual model.
- It is fine to rely on the current database structure initially if that speeds up delivery.
- But keep the web app clearly separated from the local desktop app.
- Do not mix the web UI files into the current desktop UI folders.

Project organization expectations:

- Keep the existing desktop app intact as its own product area.
- Create a clearly separate web app structure, for example with dedicated folders such as:
  - `web/` for the frontend
  - `web-api/` or similar for the web backend if needed
- If you see a better cleaner structure, use it, but keep the separation obvious.
- Shared logic may be extracted only if it genuinely improves maintainability.
- If shared code is introduced, keep it intentional and minimal.

Functional expectations:

- Preserve the current core concepts:
  - dashboard
  - stores
  - store workspace/detail
  - add/edit flows
  - media/file handling
- Do not include `store_code` in the web product unless explicitly re-approved later.
- Do not build a separate `Listings Master` page in the web MVP unless explicitly re-approved later.
- Listing work should live primarily inside each store workspace.
- Build the web app so it can later switch from local file storage to cloud object storage without redesigning the whole app.
- Prefer a storage adapter approach for this reason.

Design expectations:

- Follow the UI brief, not generic SaaS defaults.
- Ignore the current desktop app styling as a design direction.
- Avoid a plain template look.
- Avoid overcrowded dashboards.
- Make the store pages feel like workspaces, not generic record pages.
- Use glass effects carefully on shells, headers, cards, filters, and modals.
- Keep dense working areas like tables and forms more solid and readable.

Execution guidance:

- You are allowed to organize work across multiple agents in parallel if that is the most efficient approach.
- Good parallel split examples:
  - one agent on frontend shell/design system
  - one agent on web data/API layer
  - one agent on migration/repo structure and shared abstractions
- Keep ownership boundaries clear so files do not conflict.

What I want from you first:

1. Read the referenced markdown files and current app structure.
2. Propose the exact web project structure you want to create.
3. Start implementing the foundation, not just planning.
4. Prioritize:
   - app shell
   - design tokens
   - routing/layout
   - first dashboard/store/listing screens
   - storage abstraction for local-first uploads
5. Keep the result organized so the desktop app and web app are visually and structurally separate.

What not to do:

- Do not replace the current desktop app.
- Do not entangle desktop UI code with web UI code.
- Do not ignore the visual brief and fall back to a generic dashboard template.
- Do not overcomplicate the first iteration with too much infrastructure before the web foundation exists.

Definition of success for this phase:

- A clearly separated web codebase exists in the repo.
- The web direction matches the markdown briefs.
- The web foundation is actually started.
- The architecture stays ready for a later cloud-storage switch.
- The result is more organized, more modern, and visually distinct from the desktop app while still respecting the current domain model.
