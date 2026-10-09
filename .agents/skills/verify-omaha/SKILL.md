---
name: verify-omaha
description: Launch the Omaha web app (Vite + React football puzzle) from this checkout and drive it in headless Chromium at phone or desktop size, light or dark, to prove a UI change works and capture screenshots, ARIA snapshots and console logs as evidence. Use when asked to verify, smoke-test, screenshot or demo an Omaha screen or flow, or before calling front-end work done.
---

# Verify Omaha

Omaha's only surface is a single-page web app served by Vite. A user touches it in a phone browser first (390×844, touch) and on desktop at 900px and wider, in a light or dark system theme. There is no backend: puzzle data is fixture JSON and progress lives in the browser's local storage. That means one fresh browser context is one fresh player.

All helpers live in `scripts/` next to this file. Run them from anywhere; they find the checkout with `git rev-parse`, so they always serve the worktree they belong to.

## Run contract

| Variable              | Used for                                                                      | Default                                  |
| --------------------- | ----------------------------------------------------------------------------- | ---------------------------------------- |
| `VERIFY_RUN_ID`       | Names the run's server state, so runs with different IDs never share a server | `local`                                  |
| `VERIFY_EVIDENCE_DIR` | Root for every proof artifact                                                 | `$TMPDIR/omaha-verify/<run-id>/evidence` |

Scratch state (pid, port, URL, server log) lives in `$TMPDIR/omaha-verify/<run-id>/state`. Each run gets its own free port. Two runs with different IDs, from the same or different worktrees, can be up at once. Never point a run at a server you didn't start: `pnpm dev` started by Mike on port 5173 is not yours.

## Launch

```bash
export VERIFY_RUN_ID=my-check VERIFY_EVIDENCE_DIR=/path/to/evidence   # optional
.claude/skills/verify-omaha/scripts/launch.sh
```

The script installs deps if `node_modules` is missing, picks a free port and starts `vite --host 127.0.0.1 --strictPort` from the checkout root. It waits until `GET /` returns the app shell (`<div id="root">`). It is ready when it prints `READY http://127.0.0.1:<port>/`. If the run ID already has a live server, it refuses: clean up first or use another ID.

## Doctor

```bash
.claude/skills/verify-omaha/scripts/doctor.sh
```

This is read-only. Run it first and whenever anything looks off. It checks that the recorded pid is alive and is the process listening on the recorded port, and that the process's working directory is this checkout (so you are not driving another worktree's build). It also checks that `/` serves the shell, that `/src/main.tsx` transforms, and that Playwright's Chromium is installed. Every line must say `ok`; a non-zero exit means don't drive.

## Drive

```bash
.claude/skills/verify-omaha/scripts/drive.mjs <scenario> [--viewport phone|desktop] [--theme light|dark] [step ...]
```

The script opens the server URL in headless Chromium using the `playwright` devDependency. The viewport is `phone` (390×844, touch) by default or `desktop` (1280×800), and the color scheme is `light` by default or `dark`. It then runs the steps in order, all in one browser context:

| Step                        | Does                                                     |
| --------------------------- | -------------------------------------------------------- |
| `goto=/path`                | Navigate relative to the server URL                      |
| `click=<role>:<name>`       | Click by ARIA role and accessible name (substring match) |
| `press=<key>`               | Keyboard press: `Enter`, `ArrowLeft`, `5`, `Tab`         |
| `expect=<text>`             | Wait up to 5s for visible text                           |
| `expect-role=<role>:<name>` | Wait up to 5s for a visible role + name                  |
| `expect-title=<text>`       | Document title equals text                               |
| `storage=<key>`             | Record `localStorage[key]` in the transcript             |
| `wait=<ms>`                 | Pause, for animations only; prefer an `expect`           |
| `shot=<label>`              | Full-page screenshot                                     |

The first failing step stops the run. Any console error or uncaught page error also fails it, even when every step passed. Exit code `0` means the scenario passed.

Example (the current starter page):

```bash
.claude/skills/verify-omaha/scripts/drive.mjs counter --theme dark \
  expect-title=omaha click=button:"Count is 0" expect="Count is 1" shot=after-click
```

Prefer roles and accessible names over CSS. The specs in `design/<screen>/spec.md` list the accessible names each screen must have (for example the "Read order" group or the field's `aria-label`). Drive by those names, so a pass also proves the accessibility criteria. If a handle you need has no accessible name, that is a bug in the screen, not a reason to fall back to CSS.

## Evidence

Each drive writes to `$VERIFY_EVIDENCE_DIR/<scenario>-<viewport>-<theme>/`:

- `NN-<label>.png` holds full-page screenshots: `00-loaded`, one for each `shot=` step, and the last one is `final`.
- `aria.yml` is the ARIA snapshot of the final state, which is the text proof of what a screen reader and a role-based query see.
- `console.log` has every browser console line and page error.
- `transcript.json` records the scenario, viewport, theme, URL, the steps, and each step's result and time.

`cleanup.sh` also copies the server log to `$VERIFY_EVIDENCE_DIR/vite-<run-id>.log`.

Proof standards:

- Go through the real user path: tap the controls a player taps, starting from the screen a player starts on. Don't set store state from the console or deep-link past a step the feature map lists as the entry.
- Capture the action and the result: a `shot=` before the interaction and after it, plus the `aria.yml`.
- Verify side effects as well as pixels. When a feature persists (design state, rep history), add a `storage=` step for the key and a `goto=` reload in the same drive, and show that the state came back.
- Cover what the spec says differs: phone and desktop (the layout switches at 900px), light and dark. One drive per combination the change touches.
- No mocks. The fixture puzzle and stub simulation are the product's own data until the engine lands, so drive them as-is.
- Determinism is a product rule. If a result screen differs between two identical drives, that is a finding, not flake.

## Cleanup

```bash
.claude/skills/verify-omaha/scripts/cleanup.sh
```

The script stops only the vite pid recorded for this run, and only after checking it is vite running from this checkout. It copies the server log into the evidence dir and deletes the run's `state/` dir. Evidence is never deleted. Run it after every drive session, including failed ones.

## Feature map

[`features/README.md`](features/README.md) indexes what to verify and how to reach each feature. Read it before driving, and drive every entry point it lists for the feature you are proving.
