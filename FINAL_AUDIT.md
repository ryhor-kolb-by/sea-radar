# Sea Radar Sprint Requirements Compliance Audit

**Date:** 2026-09-24  
**Scope:** `PROJECT_BRIEF.md`, available `SPRINT-01…03.md`, current source and tests, checkpoints 01–04.  
**Result:** The main R1–R3 implementation is present; the local build and all available tests passed. Full compliance with all expected releases cannot be confirmed: requirements for session 6 (R4/B-18…B-21) are missing, checkpoint 05 has not been completed/recorded, acceptance items requiring manual checks remain, and there is one confirmed discrepancy in `MessageType` handling.

## Independence and method

The review was conducted in a separate context without the history of the author’s edits. A new interactive Claude Code session cannot be started from this environment; therefore, this report does not claim that a second session was created. The project has no Git metadata, so comparison of the diff with checkpoint 04 and verification of tracked-file status are unavailable.

The brief, code, test expectations, and previous checkpoint entries were compared. Only local commands were run: `npm run build`, `npm test`, `node --version`, `npm --version`. Collector tests use a substituted transport/clock; interface tests mock the route response; no live connection to AISStream was made. The contents of `.env*` and environment variable values were not read and are not included in the report.

Statuses in the table:
- **Code / tests** — confirmed by the current implementation or a repeated local run; mere presence of source without execution is noted separately.
- **Historical** — reported in a checkpoint but not reproduced in this audit.
- **Partial / unconfirmed** — implementation exists, but sufficient current verification or fulfillment of the criterion is missing.
- **No requirements** — the available documents contain no requirements relevant to this part.

## User story matrix

| Story | Implementation and evidence | Audit status |
|---|---|---|
| US-01 — map of the strait | Leaflet loads with `ssr: false`; bounds, view, OSM Standard, and attribution are set in `src/config.ts`; Leaflet map and tile layer are in `src/components/LeafletMap.tsx`. `npm run build` passed. Opening/refresh/resize and visual attribution are recorded in checkpoint 01 (pp. 26–34), but were not manually repeated here. | Implementation confirmed by code and build; visual criteria are historical and were not rechecked. |
| US-02 — demonstration vessels | Three vessels and routes in `src/config.ts`; `demoStart`, source label, and markers are implemented in `RadarView.tsx`/`LeafletMap.tsx`. The “three elements” test passed. | Confirmed by code and test. |
| US-03 — movement | Shared 2000 ms interval in `src/components/RadarView.tsx`; transitions/stopping and zero speed in `src/demo.ts`. Two browser tests for movement/stopping of `demo-1` passed; all routes are specified in code. | Partially confirmed by tests: automated movement and finish scenarios cover `demo-1`; all routes were not separately exercised by browser tests. |
| US-04 — card | Value formatting in `src/vessel.ts`, React text output in `src/components/VesselCard.tsx`, selection by id in `RadarView.tsx`. Click and repeated-click tests passed. Safe name output and unknown-value formatting are apparent in code; checkpoint 01 records a manual check of the name `<b>Demo</b>`. | Code and selection checked; safe name output confirmed by code and historical manual record, not a current manual check. |
| US-05 — real vessels | Button, on-screen states, and loading in `RadarView.tsx`; API Route Handler in `src/app/api/snapshot/route.ts`; same map/card. Checkpoint 04 reports one live snapshot and a check of one MMSI. The current browser test uses a mock, not the real endpoint/AISStream. | Code confirmed; live integration has only historical evidence and was not repeated. |
| US-06 — source and time | On-screen label with count/time/incompleteness in `src/snapshot.ts`; metadata in route; newest-position selection in `src/server/reader.ts`. Freshness and dedup were checked in collector tests. | Implementation and collection rules locally checked; label appearance confirmed by code/mock tests, not a live scenario. |
| US-07 — error reasons and empty response | Fixed codes and messages in `src/server/snapshotError.ts`, UI states in `src/snapshot.ts`; empty-response and interface-error tests passed. Missing key is recorded in checkpoint 03; the route was not called now. | Code and mock scenarios confirmed; endpoint without a key and live errors are historical/not rechecked. |
| US-08 — instructional use without a key | Demo runs separately from the AISStream request; key is read by server-side `src/server/apiKey.ts`. Checkpoint 03 reports a successful request without a key. A separate “without key” test was not run in this audit. | Implementation confirmed by code; the no-key criterion has historical, not repeated, evidence. |
| US-09 — data integrity | Converter and collector tests cover validity, zero/unknown values, freshness, deduplication, window/limit, errors, cancellation, and cleanup; all passed. There is a discrepancy regarding `MessageType` filtering, described below. | Largely confirmed by tests; compliance is incomplete due to the discrepancy below and absence of checkpoint 05/independent diff review. |
| US-10 — independent installation | `README.md` contains Node.js 24, `npm install`, `npm run dev`, and localhost. README does not include instructions for entering the key, how to verify the complete app, or a clear list of capabilities/limitations required by the brief, US-10 (pp. 99–103). `ABOUT.md` expects a separate change request for session 6, but the file is absent. | **Not fully fulfilled by the available documentation.** |

## Sprint task matrix

| Tasks | Compliance check |
|---|---|
| B-01 — scaffold | `package.json` contains Next 16, React 19, TypeScript 6, Leaflet, and Playwright; `README.md` contains run commands. Dependency installation was not repeated separately, but the build was run. |
| B-02 — map | Client-side Leaflet loading, area, OSM, and attribution are visible in code. Build passed. Window size and visual rendering were not checked in this audit. |
| B-03…04 — vessel, icon, selection, card | Shared model and formatting in `src/vessel.ts`; card/map in `src/components/`; selection tests passed. XSS-safe name output is a React text node in code, with historical manual proof in checkpoint 01. |
| B-05…06 — routes, movement, stopping | Three routes have 8–10 points; movement advances via one timer; browser tests checked movement, card update, and `demo-1` finish. Build/tests passed. Visual hot reload and each route individually were not checked here. |
| B-07 — Playwright/selection | Playwright is configured for Chromium and node project; browser tests block OSM tiles. Selection tests passed. |
| B-08 — key | `src/server/apiKey.ts` reads the variable on the server; `.gitignore` ignores `.env*` except `.env.example`; `.claude/settings.json` prohibits reading `.env`, `.env.local`, and `.env.*.local`. Env-file contents were not checked; tracked status cannot be confirmed because Git is unavailable. Checkpoint 03 is historical evidence. |
| B-09 — Reader/endpoint | Node runtime and dynamic endpoint in `src/app/api/snapshot/route.ts`; fixed error text; transport/clock are injected in `src/server/reader.ts`. Live WebSocket integration was not run in the audit; tests use fake transport. |
| B-10 — sample/provenance | Sample and `data/samples/PROVENANCE.md` are present; provenance describes live retrieval on 2026-09-17. This is historical, not a repeated source check. Provenance contains a claim about message-type filtering that conflicts with the code. |
| B-11 — converter | `toVessel` validates fields/ranges; tests `tests/toVessel.synthetic.spec.ts` passed. |
| B-12 — collector | Limit 100, 15-second window, latest-by-timestamp, dedup, errors without partial success, abort, and cleanup are implemented in `src/server/reader.ts`; corresponding tests `tests/reader.synthetic.spec.ts` passed. No local check of `MessageType` is present despite the filter in the subscription request. |
| B-13 — R2 interface | States and text in `src/snapshot.ts`/`RadarView.tsx`. Error, empty, neutral icon, and `No data` were checked with browser mocks; loading/disabled were confirmed in a one-off checkpoint 04 scenario, not in permanent tests. Live matching of AIS vessel to UI was not run. |
| B-14 — converter tests | Literal expectations exist for the sample and synthetic cases; suite passed. |
| B-15 — collector tests | Fake clock/transport and checks for duplicates, time ordering, equal time, limit, window, errors, cancellation, full object replacement, and cleanup; suite passed. |
| B-16 — movement/UI tests | `page.clock` tests check movement/stopping; UI error/empty/unknown speed/course is tested against a mock endpoint; suite passed. |
| B-17 — analysis/review/checkpoint 05 | `docs/checkpoints/CHECKPOINT-05.md` is absent, and Git diff against checkpoint 04 is unavailable. This audit recorded observations, but cannot confirm that B-17 results were entered in the prescribed checkpoint, that the required diff comparison was completed, or that an independent review used the sprint criteria. | Unconfirmed / checkpoint not provided. |
| B-18…B-21 / R4 | `ABOUT.md` describes session 6, release R4, and change request `SPRINT-03b-CHANGE-REQUEST.md`, but that file is absent from `docs/tasks/`. Task criteria are unavailable, so compliance cannot be assessed. | Cannot be assessed against the available requirements. |

## Confirmed discrepancy

`docs/tasks/SPRINT-02.md` specifies `FilterMessageTypes: ['PositionReport']` for the subscription. This limits the types requested from the source, but the local code does not itself check frame type: `src/server/reader.ts:215-218` passes every JSON object to `toVessel`, and `src/server/toVessel.ts:155-157` explicitly says the frame type is not checked. If a frame of another type contains suitable `MetaData` and `Message.PositionReport`, it may be accepted. `data/samples/PROVENANCE.md:43` claims that the reader discards frames whose `MessageType` is not `PositionReport`; this claim does not match the current implementation. The test generator `tests/reader.synthetic.spec.ts:114-135` always produces `MessageType: 'PositionReport'`, so this case is not covered by tests.

This observation does not claim that AISStream commonly violates the subscription filter; it identifies a specific implementation/provenance discrepancy and missing protection against an unexpected frame. No fix was made as part of the audit.

## Documentation and previous checkpoints

- Three sprint-requirements files are available. `ABOUT.md` refers to missing `docs/tasks/SPRINT-03b-CHANGE-REQUEST.md` and `docs/checkpoints/TEMPLATE.md`; the actual template filename is `CHECKPOINT_TEMPLATE.md`.
- Checkpoints 01–04 are historical records, not results of the current run. Checkpoint 04 (2026-09-21) noted gaps in UI error/empty/limit, repeated loading, AIS movement, and controlled collector tests; the current folder now contains several corresponding tests and the local run passed.
- Checkpoint 04 reports the earlier build and three tests, but the current `npm test` discovered and ran 36 tests. This does not confirm exactly when the tests were added or whether the B-17 review was completed.
- `README.md` is insufficient as final US-10 instructions: it lacks key setup and a description of capabilities/limitations.
- Node.js 24 is required by the README/sprint; the current local runtime is Node `v25.8.1`, npm `11.11.0`. Therefore successful build/test were obtained on a Node version other than target Node 24. Checkpoint 01 separately recorded Node 22.16.0.

## Commands and current audit results

- `npm run build` → successful; Next.js 16.3.4 built the application, TypeScript completed without errors, `/api/snapshot` appeared as a dynamic route.
- `npm test` → **36 passed, 0 failed** (Playwright; Chromium and node project).
- `node --version` → `v25.8.1`.
- `npm --version` → `11.11.0`.
- No live AISStream request, real-key check, manual map review, resize/page-refresh check, or clean-laptop reinstall was performed.

## Conclusion

The codebase largely implements available R1–R3 requirements; the local production build and available test suite pass. This is **not equivalent to full acceptance**: target Node 24 was not used; US-10 is not covered by the available instructions; B-17/checkpoint 05 is absent; R4/B-18…B-21 cannot be assessed because the change request is missing; some visual and live checks remain historical or unperformed. The `MessageType` filtering discrepancy should also be resolved or explicitly accepted, and the contradictory provenance should be updated.
