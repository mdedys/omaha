# Omaha verification map

This directory is the maintained source for verifying what an Omaha player sees and does. Read this index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- `launch.sh` printed `READY` for this `VERIFY_RUN_ID` and `doctor.sh` exits `0`.
- Every drive starts in a fresh browser context: empty local storage, rep 1 of the fixture puzzle.
- Evidence goes under `${VERIFY_EVIDENCE_DIR}`; `drive.mjs` names the subfolder `<scenario>-<viewport>-<theme>`.
- Never drive a server this run did not start.

## Driving conventions

- Drive by ARIA role and accessible name. Use the names in the screen's `design/<screen>/spec.md` Accessibility section.
- Phone (`--viewport phone`, the default) is the primary layout. Add `--viewport desktop` when a change touches the ≥900px layout or the keyboard shortcuts.
- Run `--theme light` and `--theme dark` whenever a change touches color.
- Keep a multi-screen flow in one `drive.mjs` call, because local storage only lives as long as the context.

## Proof and skip reporting

- Capture a screenshot before and after the action under test, plus the final `aria.yml`.
- When state persists, prove it with a `storage=` step and a reload in the same drive.
- Record the feature file and sub-feature ID with each evidence folder you report.
- A feature marked **Not built** cannot be verified. Report it as skipped and name the issue that builds it. Never report a different screen as proof for it.

## Feature entry contract

Each feature file starts with an H1 and one paragraph on what the player sees. It has four H2s in this order: `Sub-features`, `How to get to it (user POV)`, `Driving it with drive.mjs` and `Gotchas`. Planned screens carry a **Status** line and the handles and end states their spec requires, so the recipe is ready when the screen lands. Update the file once the screen exists.

## Features

| Feature                     | Status                   | Builds in                                 |
| --------------------------- | ------------------------ | ----------------------------------------- |
| [App shell](./app-shell.md) | Live                     | #60                                       |
| [Landing](./landing.md)     | Live (not-started state) | #60; stored progress remains #57          |
| [Protect](./protect.md)     | Live                     | #61 (play screen), #62 (controls)         |
| [Routes](./routes.md)       | Live                     | #63                                       |
| [Read and snap](./read.md)  | Not built                | #64                                       |
| [Result](./result.md)       | Not built                | #64 (sheet), #65 (play art), #71 (reveal) |

Issue numbers are GitHub issues on `mdedys/omaha`, all children of #58. Not mapped yet: Puzzles (#70), Tutorial (#69), Live play (#66), Replay (#67), Pros reveal (#72), Share (#68), stored progress (#57). Add a file for each when its issue starts.
