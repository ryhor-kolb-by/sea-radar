# Checkpoint 01 — Dover Strait Map and Demonstration Vessel with Card

**Archive:** `sea-radar-checkpoint-01-<sha>.zip`, where sha is the commit that includes this entry
**Date:** 2026-09-10  **Tasks:** B-01…B-04

## Run

```bash
npm install
npm run dev      # http://localhost:3000
```

## Completed

- The Dover Strait map opens at the direct URL `http://localhost:3000`; the area and initial view (center 51.00° N, 1.45° E, zoom 10) are taken from `src/config.ts`.
- The OpenStreetMap Standard layer with attribution “© OpenStreetMap contributors” is visible on the map.
- Leaflet is connected only on the client: `LeafletMap` is loaded through `next/dynamic` with `ssr: false`.
- There is one demonstration vessel, `demo-1`, inside the area; its icon is oriented by `courseDeg`, with a neutral round icon provided when it is `null`.
- The icon carries the `data-vessel-id` and `data-icon="course"|"neutral"` attributes.
- Clicking a vessel opens a card: identifier, name, coordinates via `toFixed(5)`, speed with the “kn” suffix, course in degrees, time in “HH:MM:SS UTC” format, and source. An unknown value is shown as “No data”.
- The card has no close button; clicking the vessel again or clicking the map does not change the selection.
- Panel order, top to bottom: source label “Demonstration data”, then the card.
- Repository with `.gitignore` for Node/Next, lock file, and `CLAUDE.md` with the stack, commands, weekly scope, and secrets rule.

## Checks

- `npm run build` → successful: TypeScript without errors, 3 static pages. This also verifies that Leaflet does not execute during server rendering.
- `curl http://localhost:3000/` → HTTP 200; server HTML contains no `data-vessel-id` and no map container — map and icon markup is built only in the browser.
- Manual check: the map opened in a browser, the Dover Strait area rendered, and OSM attribution was visible; refreshing the page and resizing the window did not break the map.
- Manual check: the demonstration vessel was visible inside the area, and its icon was rotated according to its course.
- Manual check: clicking the vessel opened a card with its `id`; clicking it again did not close the card.
- Manual check: the name `<b>Demo</b>` was displayed as characters, not bold, after a temporary configuration edit; the edit was not committed.
- Visual, without an automated test: all four manual checks above. There is no test runner at all in this checkpoint — nothing was checked automatically.
- Versions: Node.js v22.16.0, npm 10.9.2. Direct dependencies from the lock file: next 16.3.4, react 19.2.8, react-dom 19.2.8, leaflet 1.9.4, typescript 6.0.3, @types/leaflet 1.9.22, @types/node 24.13.4, @types/react 19.3.0, @types/react-dom 19.3.0.

## Live AISStream connection

not checked

## Out of scope

- B-05…B-07 were not done: there is one vessel, not three; no routes, `DEMO_TICK_MS` tick, or movement; no Playwright runner or selection tests.
- The “No data” path was not checked visually or by test: `demo-1` has `name`, `speedKnots`, and `courseDeg` populated, so `null` was never rendered.
- The neutral round icon was implemented but not displayed: there is no vessel with `courseDeg: null` in the configuration.
- The `0 kn` speed format and distinction between zero and “No data” were not checked on screen — `demo-1` has speed 12.3.
- Window-resize behavior was checked visually; there is no automated check.

## Deviations from the brief

- No deviations.
- Affects unissued tasks: no.

## Open questions

- The map has `maxBounds` set to the area boundaries: panning beyond the rectangle is restricted. The brief neither required nor prohibited this restriction — customer confirmation is needed.
- `demo-1`'s `timestamp` is a fixed-date literal. The brief says the step time is taken from the browser's real time, but this is part of B-06, which has not been done yet.

## Next step

B-05: expand `DEMO_VESSELS` to `demo-1`…`demo-3` with routes of 8–12 points and literal speeds for each.
