# Final Block: How It Is Structured

The final three weeks of the course consist of six webinars, during which we develop one project together from scratch using Claude Code. The project is Sea Radar, a local web application for viewing vessels in the strait; the client brief is nearby, in `PROJECT_BRIEF.md`—you can take a look at it in advance; everything from here revolves around it.

## What Happens During the Webinar

We start with an empty folder—a live repository, a real agent, no slides. Then you see the entire process: how I read the task, what I investigate before the first edit, how I limit the agent's step, how I check the result, how I read the diff, and what I decide—accept it, return it for revision, or stop.

You observe, ask questions, and take part in discussing decisions. You do not need to write code in sync. There is no homework between webinars.

Six webinars, 120 minutes each:

1. From an Empty Folder to the First Vessel
2. The Radar Comes to Life
3. The First Real Message
4. Real Vessels on the Map
5. Independent Acceptance
6. Final


## What Files You Receive

The project is divided into three sprints—one sprint per week, with two webinars in each. I show the sprint file on screen during the webinar where we take on its tasks, and send you the file after the webinar so that you can reread it at your leisure.

**Before the first webinar** — `PROJECT_BRIEF.md` (the client brief with user stories): everything starts here, and you have it from the very beginning.

**Sprint files:** `SPRINT-01.md`—at the first webinar, `SPRINT-02.md`—at the third, `SPRINT-03.md`—at the fifth, `SPRINT-03b-CHANGE-REQUEST.md`—at the sixth.

Yes, the files arrive in installments, and that's intentional: decisions during the webinar are made without knowing future requirements—just as in real development. You can ask “what happens next,” but I won't answer before the time comes. The same files are in the project repository under `docs/tasks/`—the agent reads them from there; the checkpoint entry template is in `docs/checkpoints/TEMPLATE.md`.

The work is divided into four releases, R1–R4—versions that the client can run and see for themselves; sprints 1 and 2 each produce one release, while sprint 3 produces two. Tasks within releases are numbered B-01…B-21: these numbers make them easy to find in the sprint files.

Each sprint file consists of two parts. **“What We’re Doing”**—tasks from the project backlog with acceptance criteria: what should be achieved by the end of the week. **“How We Work with Claude Code”**—the method for working on those tasks: sequence, boundaries, pitfalls, and examples of requests to the agent. The first part answers the question “what needs to be delivered,” the second “how to get there.” There isn't just one path; during the webinar, we'll follow one specific route.

## What Remains After the Webinar

A checkpoint is the accepted state of the project at the end of the webinar. I publish it in two forms:

- **archive of the accepted repository state** — `sea-radar-checkpoint-0N-<sha>.zip`;
- **checkpoint entry** — a page describing what was done, which checks were performed and with what results, the status of the data-source connection, what remains out of scope, which deviations from the brief were accepted and why, and how the next webinar will begin.


## How to Use a Checkpoint

The archive contains the project files without Git history. Unpack it, run the commands in the “Running” section of the checkpoint entry, and you will see on your screen the same state I had at the end of the webinar. From there, it's up to you:

- repeat the webinar's path in your own copy using the “How We Work” part of the sprint file;
- finish what I shortened during the webinar (the “What Remains Out of Scope” section of the entry);
- do the same thing differently and compare—in my opinion, this is the most interesting option;
- unpack two neighboring checkpoints and ask a fresh Claude Code session to compare the folders and identify what hasn't been checked in the changes;
- take a task from the “Nice to have” section at the end of the sprint file.

All of this is optional. It is not checked, graded, or a requirement for the next webinar. There is no individual final project or defense in this block.

## What You’ll Need If You Decide to Follow Along

Node.js 24, Git, Claude Code CLI, and a browser. For real data, you need your own free AISStream key from aisstream.io; the demo part works without a key, so you can start without one. My key is not shared.
