# SPRINT-01 — Release R1: Map and Demonstration Vessels

Week one, sessions 1 and 2. Covers user stories US-01…US-04 from `PROJECT_BRIEF.md`. Real data is not connected this week. The training vessels from the brief are called demonstration vessels here and in the interface.

This document consists of two parts: **what we are doing** — backlog tasks with acceptance criteria, and **how we work with Claude Code** — the method for working on these tasks.

---

## Part A. What We Are Doing

### Agreed Values

The customer left the choices to the implementer; the following have been selected, with each value living in one place in the configuration.

- **Stack:** Node.js 24, TypeScript 6.x (`strict`), Next.js (App Router) + React, Leaflet 1.9.x (mapping library), OpenStreetMap Standard layer (`https://tile.openstreetmap.org/{z}/{x}/{y}.png` — map tiles, image tiles; attribution “© OpenStreetMap contributors”), Playwright Test as the only test runner. Leaflet is loaded only on the client.
- **Area:** Strait of Dover, rectangle from 50.75° N, 0.95° E to 51.25° N, 1.95° E. Initial view: center 51.00° N, 1.45° E, zoom 10.
- **Vessel** — one structure for demonstration and real vessels: `id` (string; for demonstration `demo-1`…`demo-3`), `name` (string or `null`; empty string → `null`), `lat`, `lon`, `speedKnots` (number or `null`), `courseDeg` (number in [0, 360) or `null`; course over ground, not bow direction), `timestamp` (ISO 8601 with timezone), `source` (`'demo'` | `'aisstream'`). Zero and `null` are different.
- **Card:** identifier; name as text, not HTML; coordinates via `toFixed(5)` with trailing zeroes (`51.00000, 1.45678`); speed rounded to tenths without trailing zeroes and with suffix (`12.3 kn`, `12 kn`, `0 kn`); course `Math.round % 360` with degree symbol (`135°`); message time `12:00:00 UTC`; source (“Demonstration data” / “AISStream”). Unknown value — “No data”. No close button: the card closes only when another vessel is selected; clicking again or clicking the map does not change the selection. Panel order from top to bottom: button (added later), source label, card.
- **Icon:** oriented by `courseDeg`; for `null` — neutral circle. Attributes `data-vessel-id="<id>"` and `data-icon="course"|"neutral"` — tests locate vessels only by these.
- **Demonstration:** three vessels “Demo Vessel 1”…“Demo Vessel 3”; each has 8–12 route points inside the area and a speed in knots — as literals; tick `DEMO_TICK_MS = 2000`; course — initial bearing of the great-circle segment (at start — to the second point, then from the previous point to the current one); step time — actual browser time, at start — the timer start moment; on the same tick the vessel reaches the last point, speed becomes `0`, and the vessel no longer changes; after page refresh — from the beginning. No pause, rewind, or looping. Check the name `<b>Demo</b>` using a temporary configuration edit, not committed.
- **Source label:** “Demonstration data”.
- **Run:** `http://localhost:3000`, loopback only.

### Tasks

**B-01. Application scaffold.** Next.js + React + TypeScript strict in an empty folder, startup, Git with `.gitignore` for Node/Next, lockfile. Criterion: `npm run dev` opens the start page; no unnecessary dependencies.

**B-02. Area map.** Leaflet on the client only, OSM layer with attribution, area and initial view from configuration, map fills all available space. Criterion: direct page load and refresh work; resizing the window redraws the map without artifacts; `next build` passes.

**B-03. Vessel and icon.** Vessel structure, one demonstration vessel inside the area, icon based on course, neutral for `null`, label “Demonstration data”. Criterion: vessel is visible in the area, icon is oriented.

**B-04. Selection and card.** Clicking a vessel opens a card in the format above; icon attributes. Criterion: card corresponds to the selected `id`; clicking again does not close it; name `<b>Demo</b>` is displayed as characters, not in bold.

**B-05. Three vessels with routes.** `demo-1`…`demo-3`, 8–12 points each and each speed, as literals. Criterion: three vessels in the area.

**B-06. Movement and stopping.** Tick every 2000 ms, course — segment bearing, selected vessel card updates, stop at the last point with speed `0` on that same tick; timers do not accumulate on rerenders and are cleared when leaving the page. Criterion: manual check — movement and stopping are visible; after hot reload, one tick per interval in the console, not two.

**B-07. Test runner and selection tests.** Playwright Test with one browser, dev server launched from configuration; browser tests: three elements with `data-vessel-id` on the page; clicking a vessel opens a card with its `id`; clicking again does not close it; tile requests are blocked. Criterion: tests pass; no other test frameworks.

### Week Deliverables

**After session 1:** B-01…B-04 — map, one stationary vessel, card; manual check completed; checkpoint 01: record, commit, archive.

**After session 2:** B-05…B-07 — three vessels move and stop, card updates, selection tests pass; checkpoint 02: record, commit, archive.

Movement this week is checked visually; automated movement checks with controlled time are a Release R3 task, and the checkpoint record states that as such.

### Example of Expected Behavior

Vessel `demo-1` has a 10-point route. 18 seconds after the page opens, it is at the last point; after 30 seconds it is still there, with speed `0 kn`, course, and the time of the last step in the card. The `demo-1` card opened at second 5 shows the coordinates of the last point by second 18.

---

## Part B. How We Work with Claude Code

Here, “we” means whoever is guiding the agent: during the session, the mentor; when repeating this in your own copy, you.

### Method for the Week

Week one is a clearly scoped task with a short complete cycle: `task → research → decision → change → verification → diff → next step`. Each backlog task is one or two prompts to the agent. Each prompt has three required elements:

- **boundaries** — what not to touch and what functions not to add (this week: no scaffolding for a server, button, or real data);
- **verification criterion** — how we will know it is done;
- **task reference** — the agent reads `docs/tasks/SPRINT-01.md`, not a paraphrase.

### Work Order

**Before the first Edit.** The agent reads `PROJECT_BRIEF.md` and this file and proposes a plan for B-01…B-04 without edits. Check the plan for extras: create-next-app examples, “future” folders, a second mapping library. Only then — implementation.

**Scaffold (B-01).** One prompt: minimal project, Git, `.gitignore`, concise `CLAUDE.md` with stack, run commands, weekly boundaries, and the rule “do not read or print secrets”. No future requirements in `CLAUDE.md`.

**Map (B-02).** The week's pitfall: Leaflet accesses `window` and breaks server rendering and the build. Require client-side loading and a `next build` run as a criterion. Second pitfall — Leaflet CSS is not imported or the container has no height: the map is gray or misaligned. Check visually after every change.

**Vessel and card (B-03, B-04).** Specify the vessel structure as fields, not a description — otherwise the agent will invent its own. Card formats are literals from Part A. Check “name as text” manually: vessel named `<b>Demo</b>`.

**Movement (B-05, B-06).** First data (routes as literals), then movement. Require one tick for all vessels, timer cleanup when leaving the page, and card updates from the same state as the map. To check timer accumulation: tick counter in the console after hot reload.

**Tests (B-07).** Start Playwright browser installation in the background — it takes a long time. Selection tests do not check movement — record that in the checkpoint. Block tiles, otherwise the test depends on the network. Find vessels only by `data-vessel-id`.

**Review.** After each task: “show the diff, compare it with the task, do not change code”. Read the diff ourselves. The decision is recorded explicitly: accept, return, or stop.

**Checkpoint.** After the acceptance decision, the agent writes `docs/checkpoints/CHECKPOINT-0N.md` using the repository template and makes a commit; archiving that commit is the publication step during the session, but is not needed when repeating this in your own copy. The record contains facts only: how to run it, what was done, which commands were run and with what result, what was checked visually, and what remains.

### Example Prompts

These phrasings are guidelines, not a script.

- “Read docs/tasks/PROJECT_BRIEF.md and docs/tasks/SPRINT-01.md. Propose a plan for tasks B-01…B-04 and verification criteria. Do not edit files or design future tasks.”
- “Load Leaflet on the client only, with the OpenStreetMap Standard layer and attribution, and put the area and initial view from SPRINT-01 in one configuration file. The map should fill all available space and remain correct on page refresh and window resizing. Check next build.”
- “Add movement: every 2000 ms the vessel moves to the next point; course is the direction from the previous point to the current point. At the end of the route, the vessel stays still. Timers do not accumulate on rerenders. Do not add pause, rewind, or looping.”
- “Show the diff with a focus on timers and updating the selected vessel. Separate what was verified by tests from what was checked visually. Do not change code.”

### What You Should Understand by the End of the Week

- Why Leaflet is loaded only on the client and what would happen otherwise.
- Where vessel state lives and why the map and card read from the same place.
- Why “No data” and “0 kn” have been different since the first version.
- What selection tests prove and what they do not prove.

### Nice to Have Between Sessions

- Download checkpoint 01, run it, and repeat the path to the card in your own copy.
- Add a fourth demonstration vessel with its own route.
- Break timer cleanup and see the consequences in the console.
- Ask a fresh Claude Code session to read the checkpoint 02 diff and say what it does not verify with tests.
