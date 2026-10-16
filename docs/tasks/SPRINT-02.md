# SPRINT-02 — Release R2: Snapshot of Real Positions

Week two, sessions 3 and 4. Covers US-05…US-08 from `PROJECT_BRIEF.md`. Week-one tasks remain in effect.

---

## Customer Letter No. 1

> We looked at the first version — the map and training vessels work for us. We have obtained an AISStream access key and will provide it separately, not by email.
>
> A reminder of what matters to us at this stage. There is one button. While collection is in progress, it cannot be pressed a second time. The snapshot is short: a few seconds, no more than a hundred vessels — we do not need the whole strait, just an example. Next to the map, it always says what we are seeing: training vessels or real ones, when they were received, how many, and that these are not all vessels in the area. If nothing arrives during collection, say that, not “there are no vessels”. If there is an error, provide an understandable phrase explaining the reason. Without a key, the training part works as before.
>
> For now, it is enough that after pressing the button, the map shows the result of that attempt. If the attempt fails, the map can be empty with an explanation; the training vessels will return after a page refresh, which is fine.
>
> The key must not end up in files you give us or on screen.

---

## Part A. What We Are Doing

### Agreed Values

- **Source:** AISStream, WebSocket, only from the application server (Route Handler, `runtime = 'nodejs'`). The subscription is sent immediately after the connection opens: `{ APIKey, BoundingBoxes: [[[lat_sw, lon_sw], [lat_ne, lon_ne]]], FilterMessageTypes: ['PositionReport'] }`. The source does not send subscription confirmations.
- **Key:** `AISSTREAM_API_KEY` variable, read only on the server; `.env.example` with the line `AISSTREAM_API_KEY=` is committed; `.env` with the actual value is in `.gitignore`. The value is not printed to the terminal, logs, responses, or client code and is not entered in a chat with the agent.
- **Message format:** according to the documentation, `PositionReport` contains `MetaData` (`MMSI`, `ShipName`, `latitude`, `longitude`, `time_utc` as a string of the form `2024-01-01 12:00:00.123456789 +0000 UTC`) and `Message.PositionReport` (`Sog`, `Cog`, `TrueHeading`, coordinates). Field sources: `id` ← `MetaData.MMSI`; `name` ← `MetaData.ShipName` (trim surrounding whitespace, empty → `null`); `timestamp` ← `MetaData.time_utc` in ISO format with milliseconds; `lat`, `lon` ← `Message.PositionReport.Latitude/Longitude`; `speedKnots` ← `Sog`; `courseDeg` ← `Cog`. The case and exact set of fields are confirmed against a saved sample; the converter is written against the sample.
- **Sample:** `data/samples/position-report.sample.json` in its original structure, plus `data/samples/PROVENANCE.md` (UTC time obtained, area, whether it was received live, differences from the documentation). If AISStream's terms do not allow saving a real message, use a documentation example or a synthetic example following the schema, marked “not received from a live source”.
- **Position validation:** `lat` in [-90, 90], `lon` in [-180, 180]; 91/181 (“unavailable”), out-of-range values, and non-numeric values — position is discarded; time must parse; MMSI must be non-empty. Speed 102.3, outside [0, 102.2], missing, or non-numeric → `null`; course 360, outside [0, 360), missing, or non-numeric → `null`; the position is still accepted. An invalid position must not create a vessel at coordinates 0,0.
- **Collection:** 15 seconds from the start of server processing, including connection and sending the subscription; up to 100 unique vessels with valid positions, ending immediately when reached; one position per `id` — the newest by `time_utc` (comparison to millisecond precision), a new message replaces the entire vessel object, and for equal timestamps the one accepted first remains; provider error, disconnection, or cancellation does not return a partial set; result settles exactly once, later events do not change it; the connection and timers are closed in all outcomes; `collectedAt` and `attemptedAt` come from the supplied clock. Event source and clock are collector parameters, so tests can supply messages and advance time without a network. Constants 15 and 100 are in configuration.
- **Endpoint `GET /api/snapshot`.** Success — HTTP 200: `{ ok: true, vessels, collectedAt, windowSeconds, count, truncated, reason: 'window_elapsed' | 'limit_reached' }`; empty success — same with `vessels: []`, `count: 0`. Error — HTTP 502: `{ ok: false, attemptedAt, error: { code, message } }`. Codes and fixed `message`: `no_api_key` — “AISStream key is not configured”; `connect_failed` — “Could not connect to the source” (socket error before opening — immediately; end of window without opening or without sending the subscription); `provider_error` — “The source returned an error”; `disconnected` — “Connection to the source was lost” (connection closed after subscription before normal completion); `internal` — “Internal server error”. Raw error text is not included in `message`. The interface takes the attempt time only from the response. Intermediate response form before the collector (B-09): HTTP 200 `{ ok: true, raw: <message or null>, collectedAt }`.
- **Interface states — result of the last attempt:**
  - *idle-demo* — demonstration, label “Demonstration data”;
  - *loading* — demo timer stopped, vessels, selection, and card removed, label “Loading…”, button disabled, base map remains;
  - *success* — set displayed on the map, label “AISStream · snapshot over 15 s · received HH:MM:SS UTC · vessels: N · sample is incomplete” (when `truncated`, append “ · stopped at the limit of 100”); “15” is the window constant, not the actual duration; on the first non-empty success, the map returns to the initial view; afterward, the view is not changed;
  - *empty* — same label with “vessels: 0” and message “No positions received during the collection window”;
  - *error* — label “No data on the map” and message “Could not retrieve data: <message>”.
- **Text:** button “Load real positions”; times — `HH:MM:SS UTC`. Text is part of the contract for future tests.
- Real vessels do not move between loads. Icons and card are the same as for the demonstration.

### Tasks

**B-08. Key configuration.** `.env.example`, `.gitignore`, server-side module for reading the variable. Criterion: `.env` is not in `git ls-files`; module returns “key missing” without throwing; after B-09, endpoint responds with `no_api_key` when there is no key.

**B-09. Reader (server module that opens a connection to AISStream and reads messages) and endpoint.** `GET /api/snapshot`: open WebSocket, subscribe immediately after opening, first received message as-is in the intermediate form (`raw: null` — no messages arrived during the window although the connection remained live); 15-second window; errors in the specified format; resources closed on completion, error, and cancellation. Criterion: a live request returns a message, `raw: null`, or an error in the specified format; key is not in logs or response.

**B-10. Sample and provenance.** Files in `data/samples/`. Criterion: provenance states whether it was received live.

**B-11. Converter.** `PositionReport` → vessel according to the validation rules, using the sample. Criterion: three fields manually compared with the sample; invalid position does not create a vessel.

**B-12. Collector.** Collection rules and endpoint response. Criterion: live request returns a set with metadata; a repeated request does not accumulate on top of the previous one.

**B-13. R2 interface.** Button, states, and text above; icons and card are reused. Criterion: one MMSI from the response is matched to an icon and card; without a key — “Could not retrieve data: AISStream key is not configured”; B-07 tests pass.

### Week Deliverables

**After session 3:** B-08…B-10 — server receives one real message, sample with provenance is saved, key is configured securely, demonstration works; checkpoint 03.

**After session 4:** B-11…B-13 — button loads a snapshot according to the rules, real vessels and cards appear on the map, labels and messages; checkpoint 04.

Automated checks of collection rules are a Release R3 task; this week, the rules are implemented and checked manually — state that in the checkpoint.

### Examples of Expected Behavior

- Two identical messages about vessel A → one vessel A on the map.
- A with `time_utc` 12:01 and position P2, then A with 12:00 and P1 → A remains at P2 on the map.
- Speed 0 → “0 kn”; speed 102.3 → “No data”.
- 100 messages about one vessel → one vessel; collection continues until the end of the window.
- Connection drops after three positions → error, no vessels on the map.
- Pressing the button during the demonstration → demonstration stopped, no vessels on the map until the result arrives.

---

## Part B. How We Work with Claude Code

Here, “we” means whoever is guiding the agent: during the session, the mentor; when repeating this in your own copy, you.

### Method for the Week

An external service and a secret are introduced. There are three locations — the browser, application server, and external source — and the agent must understand what runs where. Complexity increases: before changing code, research the documentation and data actually received; collection rules are a contract with several outcomes, and each outcome is checked separately.

### Work Order

**Research before edits (session 3).** The agent compares checkpoint 02 with the code, reads this task and the AISStream documentation, and proposes a reader with a test boundary (mock messages and controlled time) — without implementation. Check that the agent has not invented the message format: it must refer to the documentation and wait for the sample.

**Secret before code (B-08).** The order is mandatory: first `.env.example`, `.gitignore`, and Claude Code rules in `.claude/settings.json` that prohibit the agent from reading files containing secrets — deny `Read(./.env)`, `Read(./.env.local)`, `Read(./.env.*.local)` (a single glob with an exception for `.env.example` cannot express a deny; exact syntax depends on the installed CLI version). Then test with a dummy file: ask the agent to read `.env.local` and `.env.example` — refusal for the first, success for the second. Only then add the real key — it is not entered in the agent chat or shown in the terminal. `CLAUDE.md` and `.gitignore` are not considered protection.

**Reader (B-09).** One prompt with the full contract: window, subscription immediately after opening, intermediate response form, error codes and text, resource cleanup in all outcomes, key only on server, prohibition on collector and interface; criterion — request without key returns `no_api_key`. Pitfalls: subscription is not sent immediately — service closes the connection; Route Handler uses Edge runtime instead of Node; `time_utc` with nanoseconds does not parse directly.

**Sample (B-10).** The live request is made only after a person has read the server code that reads the key; the agent can make the request itself. Write provenance immediately. Three distinct facts the agent must distinguish in the report: connection opened; message received; local code checked.

**Converter (B-11).** Write it from the sample, not from the documentation. Require manual comparison of three fields against the sample file.

**Collector (B-12).** The most demanding prompt of the week. List all outcomes in it: window expires with a live connection, limit reached, connection does not open, provider error after some messages, cancellation. Require the result to settle exactly once. Pitfalls: promise resolves twice; window timer is not cleared after reaching the limit; “already collected” positions are returned on error.

**Interface (B-13).** Text and states are literals from Part A. The agent may “helpfully” preserve the previous set on error — that contradicts the *error* state from Part A (no vessels); send it back for revision. Manual browser check: one MMSI from a live response — icon — card; without a key (rename `.env`, restart) — missing-key message.

**Review.** Check separately: key is not in the client bundle or response; label says the sample is incomplete; a vessel disappearing from the new set is not treated as having left the area.

### Example Prompts

- “Compare docs/checkpoints/CHECKPOINT-02.md with the code. Read docs/tasks/SPRINT-02.md and the AISStream documentation. Propose a minimal server-side reader that can accept test messages and controlled time. Do not change the map or implement anything.”
- “Add .env.example with the line AISSTREAM_API_KEY= and no value, put .env.local in .gitignore, and add deny rules for Read(./.env), Read(./.env.local), Read(./.env.*.local) in .claude/settings.json. I will create a dummy .env.local — try to read it and .env.example, and show refusal and success.”
- “Expand the reader into a collector according to SPRINT-02: 15-second window including connection and subscription, up to 100 unique vessels, latest position per id by time_utc, first accepted when timestamps are equal. Do not return a partial set as success after an error. The result settles once. Event source and clock are parameters. Response format is specified in the task.”
- “Show the diff with a focus on switching the source and reusing the display. Check that the key is not included in client code or the response. Do not change code.”

### What You Should Understand by the End of the Week

- Why the key lives on the server and what would happen if connected from the browser.
- How a permissions rule differs from a line in `CLAUDE.md`.
- Why “one position per id” compares message time, not arrival order.
- How an empty success differs from an error and why the interface describes them differently.
- What “incomplete sample” means in user-facing language.

### Nice to Have Between Sessions

- Register your own AISStream key (free) and repeat the “button → snapshot” path in your own copy.
- Compare the saved sample with the documentation example and write down the differences.
- Ask a fresh Claude Code session to check the checkpoint 04 diff for a secret leaking into client code.
