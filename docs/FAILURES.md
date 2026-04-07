# Failures, Fixes, And Open Gaps

## Failures Already Fixed

- **Hydration mismatch in logo rendering**
  `UploadLogo` previously used a timestamp in render output, which caused server/client HTML mismatches. The image URL is now stable.

- **Web save routes returning `Method Not Allowed`**
  The running backend process was stale and only exposed `GET` routes. The local launcher now starts the API with reload so the live process matches the source code.

- **Windows launcher issues**
  The original local scripts had multiple Windows-specific problems:
  - PowerShell `$PID` collision in `stop-web-dev.ps1`
  - unreliable venv `python.exe` shim usage for the API
  - process stopping behavior that could hit the wrong connection entries
  These were corrected in the start/stop scripts.

- **Logo upload path handling**
  Backslash-heavy local paths caused inconsistent URL behavior. Upload paths are now normalized for web use.

- **Web scope drift**
  The early web foundation still included a separate listings page and visible store-code thinking. The current web app was corrected to stay store-centered and hide `store_code`.

## Current Known Gaps

- **Banner upload is not built yet**
  The store workspace still shows this as a future action.

- **Listing media is still minimal in the web app**
  The workspace table is real, but richer listing media management is not finished yet.

- **Search and filters are still placeholder UI**
  Stores page controls are not fully wired into live filtering behavior yet.

- **No graceful offline/loading/empty-state polish**
  The app works locally, but API-offline and loading states still need a more intentional UX pass.

- **No authentication or user model**
  The web app is still a local development workflow, not a hosted multi-user product.

- **Cloud storage is not integrated yet**
  Uploads still land in local storage during this phase.

## Documentation Risk

Older milestone docs remain in the repo for history, but they are not the source of truth for the current web-first direction. New AI contributors should start with `docs/README.md`.
