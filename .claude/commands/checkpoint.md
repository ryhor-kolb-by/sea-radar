---
description: Record a checkpoint from the template, commit it, and build an archive
argument-hint: <number, e.g. 01>
---

The acceptance decision has been made. Write `docs/checkpoints/CHECKPOINT-$1.md` strictly following the template `docs/checkpoints/CHECKPOINT_TEMPLATE.md`.

Writing rules:

- Only facts from this session. Nothing from plans or intentions.
- Write the word "works" only next to the command or manual action that demonstrated it. No command, no word.
- The "Out of scope" section is always filled in: what the task required and wasn't done, what was done and wasn't verified.
- The live AISStream connection status is always its own line, even if the value is "not checked."
- Deviations from the task: "item → what was done instead → why." No deviations — say so explicitly.
- What was verified by an automated test and what was verified by eye are separate lines; don't mix them.
- No secrets, `.env` contents, or session logs in the record.

After writing:

1. Show the file's contents before committing.
2. Commit with the record.
3. Outside the repository, build an archive of the accepted commit: `git archive` into `sea-radar-checkpoint-$1-<short sha>.zip`. Without `.env`, `node_modules`, `.next`, untracked files, or session history.
4. Show the commit sha and the archive path.
