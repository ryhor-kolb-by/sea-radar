# Checkpoint 02 — Three Vessels with Movement and Selection Tests

**Archive:** `sea-radar-checkpoint-02-<sha>.zip`, where sha is the commit that includes this entry
**Date:** 2026-09-17  **Tasks:** B-05…B-07

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # browser tests; dev server starts automatically
```

## Completed

- Three demonstration vessels, `demo-1`…`demo-3`, are on the map; routes of 10, 9, and 8 points and each vessel’s speed are specified as literals in `src/config.ts`.
- Vessels move to the next route point every `DEMO_TICK_MS = 2000` ms; there is one timer for all vessels, and it is cleared when leaving the page.
- A vessel’s course is the initial bearing of the great-circle segment: toward the second point at startup, then from the previous point to the current point (`bearingDeg` in `src/demo.ts`).
- Message time is set in an effect, using the browser’s actual time; before the first tick the `DEMO_START_TIME` literal is used so server and browser markup match.
- On the same tick that a vessel reaches the last point, its speed becomes `0`; thereafter the vessel is returned by the same reference and its message time does not tick.
- Routes have different lengths, so vessels stop on different ticks; once all have arrived, `stepDemo` returns the entire previous state.
- The selected vessel’s card is read from the same `demo.vessels` as the map: selection is stored by identifier, not as a copy of the vessel.
- Playwright Test 1.63.0 is installed as the only test runner in the project; one browser, chromium.
- `playwright.config.ts`: `testDir: './tests'`, project `chromium`, `webServer` with command `npm run dev` and `reuseExistingServer: true`.
- The `npm test` command is in `package.json`; `test-results/` and `playwright-report/` directories are in `.gitignore`.
- Three browser selection tests in `tests/selection.spec.ts`; vessels and card are located only by `data-vessel-id` and `data-card-vessel-id`; tile requests are aborted in `beforeEach`.

## Checks

- `npm run build` → successful: TypeScript without errors, 3 static pages.
- `npm test` → passed 3, failed 0: three elements with `data-vessel-id`; clicking a vessel opens a card with its `id`; clicking again does not close it.
- `npm test` with an empty test directory (before writing tests) → `No tests found`; with `--pass-with-no-tests` → exit code 0.
- Automatic dev-server startup was checked with a temporary test while the port was free: Playwright started the server, the test passed, and after the run `pgrep -f next-server` was empty. The temporary test was deleted and is not in the repository.
- Tile blocking was checked with a temporary probe test: all 20 requests to `tile.openstreetmap.org` were aborted; the page made no other external requests. The temporary test was deleted and is not in the repository.
- Assertion sensitivity in test 3 was checked: a temporary probe removed the card from the DOM, and the same `toBeVisible()` failed — so the test detects card closure. Probe removed.
- Teacher’s manual visual check, without an automated test: movement of the three vessels along their routes.

## Live AISStream connection

not checked

## Out of scope

- Movement is not checked automatically: selection tests click the vessel and read the card, but do not wait for ticks or compare coordinates over time. Automated movement checks with controlled time are a release R3 task.
- Vessel stopping at the last point and display of speed `0 kn` in the card were not confirmed in this session, either by automated test or by a separately recorded manual check. The code path exists (`vesselAt`, `speedKnots: arrived ? 0 : …`), but it was not observed on screen.
- Automatic update of the selected vessel’s card along with the map was not checked; no separate manual check of this was recorded during the session.
- Requirement B-06, “after hot reload, one tick per interval in the console, not two,” was not checked in this session — no tick counter was printed in the console.
- The neutral round icon and `data-icon="neutral"` were not rendered: `vesselAt` always computes a course, and there is no vessel with `courseDeg: null` in the configuration.
- The “No data” path did not appear on screen: all three vessels have `name`, `speedKnots`, and `courseDeg` populated.
- Tests do not check the `data-icon` attribute — they locate vessels by `data-vessel-id`.
- Tests ran only on chromium; no other browsers are configured.

## Deviations from the brief

- No deviations.
- Affects unissued tasks: no.

## Open questions

- The question from checkpoint 01 remains: the map has `maxBounds` set to the area boundaries, restricting panning beyond the rectangle; the brief neither required nor prohibited this.
- A second assertion was added to test 2 — there is exactly one card on the page. This does not exceed the three stated checks, but the brief does not formally include this criterion; confirmation is needed on whether to keep it.
- `npm test` with an empty test set ends with `No tests found` error: the `--pass-with-no-tests` flag was intentionally not added to the command, so losing tests does not look like a successful run. Confirm whether this is the expected command behavior.

## Next step

The release R2 assignment (US-05…US-08, real data via a button) has not yet been issued; the next session starts by reviewing it.
