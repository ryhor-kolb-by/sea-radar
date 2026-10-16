# Checkpoint Entry Template

File `docs/checkpoints/CHECKPOINT-0N.md` in the project repository. The template is stored in the repository as `docs/checkpoints/TEMPLATE.md`; fill in the entry at the end of each session after the acceptance decision. One page maximum. At the start of the next session, reconcile the entry with the code and `git log`.

```markdown
# Checkpoint 0N — <title>

**Archive:** `sea-radar-checkpoint-0N-<sha>.zip`, where sha is the commit that includes this entry
**Date:** YYYY-MM-DD  **Tasks:** <backlog ID, e.g. B-01…B-04>

## Run

`<installation and run commands for this checkpoint>`

## Completed

- <fact in terms of behavior: “the map opens at the direct URL”, not “added a component”>
- <fact>

## Checks

- `<command>` → <result: passed N / failed M / not run>
- Manual check: <what was checked visually, one line per action>
- Visual, without an automated test: <specifics>
- Versions (checkpoint 01 only): Node, npm, direct dependencies from the lock file

## Live AISStream connection

not checked / successful HH:MM:SS UTC, vessels: N in 15 s / failed: <reason without secrets>

## Out of scope

- <what the task required but was not done>
- <what was done but not checked>

## Deviations from the brief

- <sprint task item> → <what was done instead> → <why>. Or: “No deviations”.
- Affects unissued tasks: yes, <which values> / no.

## Open questions

- <unanswered question>

## Next step

<one line: where the next session starts for the current task>
```

## Rules

- Facts from this session only. Use “works” only next to the command or manual action that demonstrated it.
- Connection status is always a separate line, even “not checked”.
- Do not record archive placement status: the entry is committed before placement. If placement fails, tell the group; do not claim “published”.
- No secrets, `.env` contents, or session logs.
- Pass it to students with the archive, if the archive is placed.
