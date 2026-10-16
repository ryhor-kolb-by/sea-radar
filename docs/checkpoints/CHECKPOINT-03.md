# Checkpoint 03 — AISStream Server Snapshot and Sample Message

**Archive:** `sea-radar-checkpoint-03-<sha>.zip`, where sha is the commit that includes this entry
**Date:** 2026-09-17  **Tasks:** B-08…B-10

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm start
```

## Completed

- `GET /api/snapshot` is implemented in a server Route Handler and uses the Node runtime.
- When `AISSTREAM_API_KEY` is absent, the request does not open a connection and returns HTTP 502 with code `no_api_key` and message “AISStream key is not configured”.
- When the key is present, the server reader forms an AISStream subscription for the Dover area with the `PositionReport` filter, accepts the first message without transformation, and supports a result of `raw: null` if the time window expires without a message.
- Error responses use fixed codes and messages without raw exception text or provider errors.
- Added `.env.example`, a rule to ignore `.env`, and project rules prohibiting reading secret env files.
- A synthetic PositionReport sample is saved in its original structure without conversion to a vessel structure.
- Provenance was recorded for the sample, including UTC time, subscription area, reason for the absence of a live message, and a comparison with the AISStream structure description.

## Checks

- `npm run build` → successful: Next.js built the application; Route Handler `/api/snapshot` was identified as a dynamic server-rendered route.
- Local `GET http://localhost:3001/api/snapshot` request to an isolated production server without env files → HTTP 502, `code: "no_api_key"`, message “AISStream key is not configured”.
- Local script parsing the sample JSON → successful: original field names and nesting were preserved.
- Static search of source → the key is read only in `src/server/aisstream.ts`, client components do not reference it, and the key is not logged.
- Manual check: source files for the demonstration part (`src/config.ts`, `src/demo.ts`, `src/components/RadarView.tsx`, map, and card) were not changed during the session.
- Visual, without an automated test: movement of the demonstration vessels was not checked during this session.

## Live AISStream connection

not checked: the key is absent, so no connection or live-message retrieval was performed

## Out of scope

- A real connection to AISStream and retrieval of a live message were not performed because the key was unavailable.
- Collecting multiple messages, limiting to 100 vessels, selecting the newest position, and converting PositionReport to the vessel structure were not done — these are the next tasks.
- The demonstration part was not run or visually checked during this session; only preservation of its source files and absence of changes were checked.
- Reader behavior on successfully opening a WebSocket, `raw: null` after 15 seconds, a provider message, connection drop, and request cancellation was not checked separately.

## Deviations from the brief

- No deviations.
- Affects unissued tasks: no.

## Open questions

- A key is needed for live verification of B-09 and retrieval of a real sample. It must be provided outside the chat and not recorded in the repository.

## Next step

Start the next session by reading the saved raw sample and implementing a converter from PositionReport to the vessel structure.
