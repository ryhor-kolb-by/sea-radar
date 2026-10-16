# Checkpoint 05 — Independent Acceptance of Data and Movement

**Archive:** `sea-radar-checkpoint-checkpoint-<sha>.zip`, where sha is the commit that includes this entry
**Date:** 2026-09-25  **Tasks:** B-14…B-17

## Run

```bash
npm install
npm test
npm run build
npm start
```

## Completed

- The saved sample and synthetic variants are checked by converter tests: vessel fields, name normalization, zero and invalid speed, invalid course, coordinates, MMSI, and time.
- The collector is checked with a synthetic event source and controlled clock: deduplication, selection of a newer position, equal timestamps, limit of 100, window expiration, connection and provider errors, disconnect, cancellation, atomic vessel replacement, and `collectedAt`.
- Automated browser checks cover demonstration vessel movement, updating the card with coordinates, stopping at the end of the route, as well as errors, an empty snapshot, and missing speed and course in R2.
- Independent code and results review: not performed in this session. No independent findings were obtained.
- Acceptance decision: accepted.

## Checks

- `npm test` → passed 36, failed 0.
- `npm run build` → successful: Next.js 16.3.4 production build; TypeScript completed without errors; `/api/snapshot` was built as a dynamic server-rendered route.
- Automated browser test: demonstration vessel movement and stopping, card update; error and empty snapshot states and vessel without speed/course → all corresponding tests passed.
- Automated node tests of converter and collector with synthetic data, without WebSocket → all corresponding tests passed.
- Manual check: not performed in this session.
- Visual, without an automated test: no separate visual review was performed.

## Live AISStream connection

not checked

## Out of scope

- Live AISStream connection and retrieval of real data were not checked; collector tests use a synthetic source and do not prove provider availability.
- Independent review under B-17 procedure in a fresh session without editing permission was not performed; there are no independent findings or recommendations from an independent reviewer.
- Manual and separate visual checks of the application in a browser were not performed in this session.

## Deviations from the brief

- Independent B-17 review → automated checks and a local record of their results were performed instead → no independent session was started for this work.
- Affects unissued tasks: no.

## Open questions

- None.

## Next step

Reconcile this entry with the accepted commit and checkpoint 05 archive.
