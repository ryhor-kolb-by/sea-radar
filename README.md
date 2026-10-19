# Sea Radar

[![CI](https://github.com/ryhor-kolb-by/sea-radar/actions/workflows/ci.yml/badge.svg)](https://github.com/ryhor-kolb-by/sea-radar/actions/workflows/ci.yml)

Educational web application: a map of the Strait of Dover and vessels on it. Runs locally on a single computer.

## About this project

This project was built as part of the "Claude AI Native Developer" course (see `docs/tasks/ABOUT.md`). My focus was twofold: learning to work with Claude Code itself — agents, slash commands, hooks, skills (see `.claude/`) — and the test strategy, requirements-traceability audit, and acceptance against the client brief, see [`FINAL_AUDIT.md`](FINAL_AUDIT.md) and the test suite described below.

Customer brief: `docs/tasks/PROJECT_BRIEF.md`.

## Requirements

Node.js 24 or later, npm. Developed and tested against Node.js 24; the build and test suite also pass on Node.js v25.8.1.

## Getting started

```bash
npm install
npm run dev
```

The application is available at http://localhost:3000

## Commands

```bash
npm run dev      # development
npm run build    # production build
npm start        # run the built application
npm test         # run the Playwright test suite
```

## Testing

Tests run on [Playwright](https://playwright.dev/) in two layers:

- **Synthetic tests** (`tests/*.synthetic.spec.ts`) — unit/integration-level checks for the AIS converter and collector, run in Node with a fake clock and a fake transport (no network, no browser). They cover validation of vessel fields, zero-vs-unknown values, deduplication, "latest message by timestamp", the collection window/limit, error propagation, and cancellation/cleanup.
- **Browser tests** (`tests/*.browser.spec.ts`, `tests/selection.spec.ts`) — end-to-end checks in Chromium using Playwright's clock mocking and a mocked snapshot endpoint. They cover vessel movement/stopping, card selection, and the UI's error/empty/"No data" states.

Run the full suite with:

```bash
npm test
```

A requirements-traceability audit (user stories → implementation → test evidence → status) is kept in [`FINAL_AUDIT.md`](FINAL_AUDIT.md).

### Known issue

The collector does not check the `MessageType` field of incoming frames before converting them (see `src/server/reader.ts` and `src/server/toVessel.ts`), even though the subscription requests only `PositionReport` frames. A frame of another type with a coincidentally matching shape could be accepted. Not covered by the current tests. Details and impact: [`FINAL_AUDIT.md`](FINAL_AUDIT.md#confirmed-discrepancy).
