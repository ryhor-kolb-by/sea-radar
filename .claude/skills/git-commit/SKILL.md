---
name: git-commit
description: "Makes a git commit: analyzes the diff, picks the type and scope per Conventional Commits, and writes the message."
disable-model-invocation: true
when_to_use: When you need to make a commit or invoke /git-commit.
arguments: Type hint — one of feat|fix|refactor|test|docs|chore|style|perf.
          The skill checks the hint against the actual diff.
allowed_tools:
  - bash(git:status)
  - bash(git:diff*)
  - bash(git:add*)
  - bash(git:commit -m*)
---

# git-commit

Reviews the changes, picks one logical change set, creates a Conventional
Commit, and returns the hash, message, and list of committed files.

## Best Practices

- **One commit — one task.** If the changes mix unrelated edits,
  ask the user to split them manually.
- **The message answers "what does this commit do".**
  Write it in the imperative: "add validation", not "added" or "adds".
- **Message up to 72 characters.** If you need more — a blank line
  and bullet points in the body.
- **Scope only when it is obvious.** If two unrelated modules are
  affected, it is better to omit the scope than to mislead.

## Git Safety Protocol

Do not proceed if:

- **staged and unstaged are both empty** — nothing to commit.
- **The diff contains `.env`, `*.pem`, `*.key`, or another secret** —
  stop before running `git commit`. List the dangerous files.
- **The changes cannot be grouped into one logical set** —
  show the files and ask the user to run `git add` themselves.
- **A hook returned an error** — show the output and stop.

## Process

1. **Show the current Git state:**
   - Run `git status` and show the user:
     - the list of staged files
     - the list of unstaged files
     - conflicts (if any)
   - **Do not show the diff at this step** — file names only

2. **If there are no changes** — stop with the message "Nothing to commit".

3. **Check sensitive paths** before reading the diff and staging:
   - If the changed files include `.env`, `*.pem`, `*.key`, or
     another sensitive/secret file — stop and explain that
     a potential secret was found, and list the paths.

4. **Read the allowed diff and identify one change set:**
   - `git diff --cached` — staged changes (priority)
   - `git diff` — unstaged changes
   - Determine whether the changes form one logical set (one task,
     one module, one layer)

5. **If the changes cannot be safely separated** into one change set —
   stop, show the list of files, and ask the user to select
   the files manually via `git add <file>`.

   If the set is clearly defined — stage only the files of that
   set: `git add <file1> <file2> ...` (never `git add .` or `-A`).

6. **Choose the type** — if an argument is passed (for example, `/git-commit docs`),
   check that the hint matches the actual diff. If it does not match —
   explain the discrepancy and choose the correct type. If there is no argument —
   determine the type from the diff yourself:

   | Type | When to use |
   |------|-------------|
   | `feat` | New functionality |
   | `fix` | Bug fix |
   | `refactor` | Refactoring without behavior change |
   | `test` | Adding or changing tests |
   | `docs` | Documentation, README, comments |
   | `chore` | Maintenance changes (build, CI, configs, gitignore, hooks) |
   | `style` | Formatting, indentation, semicolons |
   | `perf` | Performance optimization |

7. **Determine the scope** — the module/layer from the file/folder name (for example,
   `refund`, `auth`, `config`). If several modules are affected —
   the scope may be omitted.

8. **Compose the message:** `type(scope): short description in imperative mood`
   - No trailing period
   - Up to 72 characters on the first line
   - If there are many changes — add bullet points after a blank line

9. **Create the Conventional Commit:**
   - `git commit -m "..."` (staged only)
   - If a hook failed — show its output and stop

## Result

After a successful commit, return:

```
Hash:        <commit hash>
Message:     <type(scope): description>
Committed:   <file1>
             <file2>
             ...
Uncommitted: <file3>
             <file4>
```

`Uncommitted` — changes that remain uncommitted (unstaged
or files not included in the change set).

## Example

```
Hash:        a1b2c3d4e5f6...
Message:     feat(refund): add priority sorting to refund inbox
Committed:   src/.../RefundInboxService.java
             src/.../RefundRequest.java
Uncommitted: src/.../RefundController.java
```

## Constraints

- **Forbidden operations** — unavailable while the skill runs:
  - `git push` — local commit only
  - `git commit --amend` — new commits only
  - `git commit --no-verify` / `-n` — hooks must run
  - `git config` — changing Git configuration
- **Nothing staged** — do not commit, only warn