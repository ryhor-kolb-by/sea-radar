# SPRINT-03 — Release R3: Data and Movement Acceptance

Week three, session 5. Covers US-09 from `PROJECT_BRIEF.md`. The assignment for session 6 will arrive in a separate file.

---

## Customer Letter No. 2

> Real vessels on the map are what we needed. Before handing the program to teachers, we want to make sure it does not distort the data. “We checked, it works” is not enough; show us checks that can be run again and produce the same result.
>
> What exactly concerns us: for a vessel, the newest message by timestamp is kept, even if an older one arrives later; a vessel is not shown twice; unknown speed and course are “No data”, not zero; a vessel with nonsensical coordinates does not appear at the zero point; collection really ends by time and quantity and does not return a fragment as a result; training vessels move and stop as specified.
>
> If the checks show that everything is in order, that is a good result; nothing needs to be changed. We are not requesting new features at this stage.

---

## Part A. What We Are Doing

### Agreed Values

- **Test runner:** Playwright Test. Converter and collector checks are a node project using the same runner without a browser; movement and interface checks are in the browser project.
- **Independent expectations:** expected values are specified as literals before writing assertions and are not computed by the function under test.
- **Collector in tests:** no WebSocket — use the “event source” and “clock” parameters provided in R2.
- **Time:** browser — `page.clock`; server — clock passed to the collector by the test. One does not replace the other. No real waits (`waitForTimeout`).
- **Converter input:** saved sample and explicitly synthetic variants based on it (marked “synthetic” in the name).
- **Live connection:** not checked by automated tests; its status was recorded manually last week.

### Tasks

**B-14. Converter tests** (node). Expectations:

- valid message → vessel with identifier, coordinates, speed, course, and time;
- missing name and name consisting of whitespace → `null` (in the card — “No data”);
- speed 0 → `0`; speed 102.3, -1, and missing field → `null`;
- course 360 → `null`;
- coordinates 91/181 and out of range (95, -200) → position discarded, no vessel at coordinates 0,0;
- coordinate as a string → position discarded;
- missing or empty MMSI → position discarded;
- unparseable time → position discarded.

Criterion: all cases pass; expectations are literals.

**B-15. Collector tests** (node, test source and controlled clock). Expectations:

- two identical messages about vessel A → one object A;
- A with `2026-01-01T12:01:00Z` and position P2, then A with `2026-01-01T12:00:00Z` and P1 → P2 remains;
- A with equal timestamps and different positions → first accepted remains;
- 100 unique valid vessels → `reason: 'limit_reached'`, `truncated: true`; 101st is not accepted;
- 100 messages about one vessel → one vessel, collection continues until the end of the window;
- window expires with a live connection and no messages → success with `count: 0`, `reason: 'window_elapsed'`;
- connection does not open by the end of the window → `connect_failed` error; socket error before opening → `connect_failed` immediately;
- provider error after three valid messages → `provider_error`, the three messages are not returned as success;
- connection drops after three valid messages → `disconnected`, the three messages are not returned as success;
- provider error after completion due to limit → result remains success, no second settlement;
- request is cancelled before the end of the window → result does not settle, connection is closed, timers are cleared;
- second message about vessel A with name `null` → name is `null` (entire object replaced);
- `collectedAt` equals the supplied clock time at completion (literal);
- after any outcome, the attempt leaves no open connections or pending actions.

Criterion: all cases pass; resource cleanup is checked through the test source.

**B-16. R2 movement and interface-state tests** (browser). Movement — using `page.clock`: after advancing time by several ticks, vessel position has changed and the selected vessel card shows the new coordinates; after advancing past the end of the route, position does not change, card shows `0 kn`, course, and time of the last step. R2 states — by mocking the `GET /api/snapshot` response: error → no vessels, label “No data on the map”, message “Could not retrieve data: <message>”; empty response → label with “vessels: 0”, message “No positions received during the collection window”; success with a vessel lacking speed and course → “No data” in the card, `data-icon="neutral"`. Criterion: pass; browser clock is not used for the collector.

**B-17. Review and fixes.** B-14…B-16 results are reviewed. Confirmed discrepancies with the agreed R1 and R2 values are fixed minimally, with a rerun; no discrepancies is an acceptable result. Code, tests, and results are also reviewed independently — without the author’s involvement or history. Criterion: list of discrepancies (possibly empty) and findings from the independent review are recorded in checkpoint 05.

### Session Deliverable

B-14…B-17 are completed; B-07 tests continue to pass (if they were not written in the first week, write them during this session before the new tests); the interface rule “result of the last attempt” remains unchanged; checkpoint 05: record, commit, archive. Finding zero defects is a successful outcome.

### What We Are Not Doing

Production code does not change unless checks show a confirmed discrepancy. The rule “show the result of the last attempt” is agreed behavior, not a defect. Excluded: new features; opportunistic refactoring; changing collection rules; tests written just to increase coverage numbers.

---

## Part B. How We Work with Claude Code

Here, “we” means whoever is guiding the agent: during the session, the mentor; when repeating this in your own copy, you.

### Method for the Week

The goal is evidence, not code. The main trap in automated test generation: the agent computes the expected value by running the same function it is testing, and `assert(f(x) === f(x))` is always green. So the order is strict: first a person approves the expectations (they are already recorded in Part A), then the agent writes assertions against them.

The second goal is an independent perspective. The code’s author (and an agent session with its history) does not see their own assumptions; a fresh session without history does.

### Work Order

**Approve expectations.** First prompt — no code: the agent lists checks from Part A and explains what each proves. Make sure it does not suggest “generating expectations from current behavior”.

**Converter (B-14).** Playwright node project without a browser. Synthetic variants are based on the sample and marked in the file or test name. Expectations are literals from Part A, not calls to the converter.

**Collector (B-15).** Use the “source” and “clock” parameters from R2. If the agent proposes opening a real WebSocket or globally mocking `Date`, send it back. Check resource cleanup through a test source that records the close call.

**Movement and R2 states (B-16).** Use `page.clock` for the page, without `waitForTimeout`; browser clock does not control the server-side collector — these are different processes. R2 states are tested by mocking the response from our own endpoint: this proves interface behavior, not AISStream availability. The “error” and “empty response” tests are the only ones that must change in the next session.

**Review results (B-17).** If there is a discrepancy, make a minimal fix only for it and rerun; no opportunistic refactoring. If there are no discrepancies, explicitly accept the result; do not invent changes for the sake of change. Do not intentionally break the application during the session: zero defects is an acceptable result.

**Independent review (B-17).** A new Claude Code session from the same folder, without history and without edit permissions (`claude --permission-mode plan` or separate permissions with deny on Edit/Write/Bash): it reads the task, the diff against checkpoint 04, and test results; it returns findings, verification limitations, and a recommendation to “accept / revise”. It does not change code or expectations. Then return to the working session; the person makes the decision.

**Checkpoint 05.** Accepted results, independent review findings, limitations, and status of the interface rule.

### Example Prompts

- “Compare docs/checkpoints/CHECKPOINT-04.md with the code. Read docs/tasks/SPRINT-03.md. List checks for the expectations specified there and explain what each proves. Do not change production code.”
- “Add a Playwright node project without a browser. Based on data/samples/position-report.sample.json, create synthetic variants and write converter tests from the list in the task. Expected values must be literals, not calls to the converter. Run them.”
- “Write collector tests using a mocked source and controlled clock, without WebSocket, following the list in the task. Check resource cleanup. Run them.”
- *Fresh session, read-only:* “Read docs/tasks/SPRINT-03.md, the diff against commit <sha>, and test results. Return only substantiated findings, verification limitations, and a recommendation: accept or revise. Do not change code or expectations.”

### What You Should Understand by the End of the Session

- Why a person approves an expectation before the test is written.
- How an independent expectation differs from a self-confirming test.
- Why the collector is tested without a network — and what was provided for this in the second week.
- Why browser and server clocks are different things.
- What the fresh session saw that the author did not.

### Nice to Have Between Sessions

- Break one collector rule in your own copy (keep the old position instead of the new one) and make sure the test fails. If it does not, the test proves nothing.
- Come up with a boundary case that is not on the list and check how the application handles it.
