# Checkpoint 04 — Snapshot of Real Positions on the Map

**Archive:** `sea-radar-checkpoint-04-<sha>.zip`, where sha is the commit that includes this entry
**Date:** 2026-09-21  **Tasks:** B-11…B-13

## Run

```bash
npm run build
npm test
npm start -- -p 3001
```

## Completed

- `GET /api/snapshot` collects up to 100 unique vessels during a configurable 15-second window, selects the latest position by message time, and returns snapshot metadata.
- The interface now has a “Load real positions” button and the states `idle-demo`, `loading`, `success`, `empty`, `error`.
- In the `loading` state, the demonstration timer is cleared, vessels, selection, and card are cleared, the base map remains, and the button is disabled.
- A successful response displays AIS vessels using the existing icons and existing card; results from separate loads are not merged.
- Success labels use `windowSeconds` and `collectedAt` from the response; errors use the message from the response body.
- The first non-empty successful snapshot resets the map view to the initial view; subsequent loads do not reset the map view.
- Markers absent from the new vessel array are removed from the map.

## Checks

- `npm run build` → successful: Next.js production build completed without errors; `/api/snapshot` remained a dynamic Node route.
- `npm test` → passed 3, failed 0.
- One-off Playwright browser scenario → after clicking the button, `Loading…` was shown and the button was disabled; after the response, the label read `AISStream · snapshot for 15 s · received 17:22:35 UTC · vessels: 4 · sample incomplete`; 4 vessels were found; clicking `224029000` opened one card with the same id.
- Manual check: not performed.
- Visual, without an automated test: a screenshot after loading was reviewed; four AIS icons were visible on the map, and the panel showed the button, server label, and selected vessel card.

## Live AISStream connection

successful at 17:22:35 UTC, vessels: 4 in 15 s

## Out of scope

- The `empty`, `error`, and `limit_reached`/`truncated: true` branches were not separately checked through the interface.
- Preservation of a user-adjusted map view on the second load and AIS vessel immobility over time were not separately checked.
- No tests were added for the new B-13 states; only the existing B-07 tests were checked.
- Separate controlled checks of all error outcomes from the B-12 collector and late events were not performed.

## Deviations from the brief

- Production build → additionally removed the `.ts` suffix from the import in `scripts/check-parser.ts` → the original `npm run build` ended with TS5097 before checking B-13; application behavior was not changed.
- Affects unissued tasks: no.

## Open questions

- None.

## Next step

Start the next session with separate checks for empty response, error, stopping at the limit, and repeated loading without resetting the map view.
