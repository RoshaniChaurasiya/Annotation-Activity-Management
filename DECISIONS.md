# Project Decisions

## Architecture and UX decisions

### Dashboard layout
- The task queue sits in a sticky, scrollable pane with a fixed header table to keep the visible row list anchored.
- The search input spans the full width on its own row; dropdown filters are placed below in a uniform 3-column grid for consistent visual hierarchy.
- The detail panel is kept sticky for the selected task so metadata and summary remain visible while scrolling the queue.

### Dropdown behavior
- Custom filter dropdowns render via `createPortal` into `document.body` to avoid sticky header clipping.
- Outside-click handling is intentionally broad and now uses generic `Event` for both `click` and `touchstart` so selections register before the menu closes.
- Dropdown options use stable enum values for status and type filtering, ensuring the selected value matches the normalized task state.

### Task normalization
- Raw backend statuses and types are normalized before entering Redux state.
- `normalizeStatus` maps inconsistent casing or alternate strings like `InProgress`, `in_progress`, and `QA` into strict `TaskStatus` enum values.
- Unknown task types are mapped to `type: "unknown"` while preserving the raw value in `rawType` for diagnostics.

### Assignment artifact: TaskTickerFix
- `src/components/TaskTickerFix.tsx` is intentionally preserved as the Part 2 bug hunt sample.
- It documents a fixed React closure issue, safe state updates, and stable key usage without being part of the main dashboard render tree.

### Summary stream rendering
- The summary panel sanitizes streamed markdown HTML before injection to prevent XSS.
- An inner scroll container was added inside the panel card so long markdown content stays contained and scrolls naturally.
- The panel is styled with a soft border and background to make streamed text visually distinct without leaking outside the card.

### State management and caching
- Redux Toolkit `createEntityAdapter` is used for efficient task list updates and selection handling.
- `loadCachedTasks` loads the last IndexedDB snapshot first and marks state as stale until fresh network data arrives.
- `fetchTasks` normalizes items before writing them to both Redux state and local IndexedDB.

## Part 2: Bug Hunt Analysis

### Bug 1: Stale Closure in running clock interval
* **Root Cause:** The original `useEffect` capturing `setInterval` lacked dependencies and triggered state via `setTick(tick + 1)`. Because of the closure mechanics, `tick` was captured as `0` permanently, locking the calculation frame.
* **Fix:** Transitioned the hook to state update notation `setTick(prev => prev + 1)`, extracting external variables from the closure context entirely.

### Bug 2: Missing API request guard constraint
* **Root Cause:** The data fetching handler executed updates whenever `selectedId` changed, but evaluated blindly upon mounting when `selectedId` initiated as `null`. This forced invalid network requests out to `${apiBase}/api/tasks/null`.
* **Fix:** Introduced a short-circuit protective guard clause `if (!selectedId) return;` at the beginning of the side effect loop.

### Bug 3: Dropdown selections closing too early
* **Root Cause:** The dropdown outside-click handler used `mousedown` and did not account for portal click timing, so menu buttons could close before their `onClick` fired.
* **Fix:** Switched to `click` / `touchstart` event handling and added portal ref containment checks to allow clicks inside the floating menu.

### Bug 4: Missing filter match due to raw status mismatch
* **Root Cause:** Filter values were compared directly against task state, but backend status payloads included mixed casing and legacy strings.
* **Fix:** Normalized status values in `normalizeStatus` so `in_progress`, `InProgress`, `QA`, and other variants map consistently to the same enum.

### Bug 5: Summary content overflow
* **Root Cause:** Rendered markdown used a single panel wrapper without an inner scroll container, causing long content to overflow the form card.
* **Fix:** Added an inner `overflow-auto` wrapper around the sanitized markdown output and ensured `min-h-0`/`flex-1` layout so the panel scrolls correctly.

### Bug 6: Uneven dropdown sizing and toolbar layout
* **Root Cause:** Dropdowns were laid out in a row with inconsistent widths and the search bar shared space in a cramped grid.
* **Fix:** Reworked the toolbar to use a full-width search row followed by a equally spaced 3-column dropdown grid.
