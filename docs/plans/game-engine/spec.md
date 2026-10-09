# Game engine

**Status:** Draft
**Source:** [Game engine](https://github.com/mdedys/omaha/issues/3) wayfinder map

## Overview & Goals

The game engine resolves a rep: given a loaded puzzle and the player's design, it steps all 22 players and the ball through a pass play on a 0.05 s tick and returns what happened, why, and the defense's play art. It also scores a finished puzzle and gives the design screens the catalog data they need. It is plain TypeScript with no React, built before the screens that draw it, with its front-end contract pinned first so screen work can start against a stub.

**Goals**

- The same design against the same puzzle gives the same rep, bit for bit, in Node, Chromium, Firefox and WebKit.
- Every failed rep names one cause and one decisive defender that the player can see on the field.
- A published puzzle replays exactly as it did on its day, through every later release.
- The front end draws only what the engine computed: the separation on screen is the separation the engine judged.

**Non-goals**

- Realism past legibility. Physics, ratings, randomness and anything the play art can't explain are left out on purpose.
- Brute-forcing a puzzle's design space. One rep resolves instantly on a phone; solvability tooling uses the engine as it is, on the next map.
- Writing player-facing text. The engine returns codes and facts; the front end writes every caption.

## Scope

**In**

- The front-end contract (`src/engine/contract.ts`), `EngineError`, and a fixture-backed stub engine, delivered first.
- `loadPuzzle` with puzzle validation and the version loader.
- Engine v1: the formation, route, zone and gap catalogs; the rules in [rules.md](rules.md); `tuning.ts`; `simulate`, `score`, `revealedPlayArt` and the five design-screen helpers.
- Vitest scenario tests in Node and per-tick golden hashes in Chromium, Firefox and WebKit, seeded with the ten prototype scenarios, one scenario per cause code, the anchored timings, and a converting design against each of Cover 0 to 4.
- The determinism lint and the React import wall on `src/engine/**`.
- One GitHub Actions workflow on pull requests running lint, format check, build and `pnpm test`.
- AGENTS.md: `pnpm test` joins the pre-done checklist, and "the game engine is built before the front end" becomes "the engine contract and stub come first; screens build against the stub while v1 is built".

**Out**

- Everything in the map's **Out of scope**: the out-of-bounds goal, difficulty, play action and motion, switch calls, press jams, pattern-match zones, stunts, half-slides, check-releases, scrambles, hot reads, drops, fumbles, broken tackles, lane deflections, blocking after the catch, and the audible, run plays, practice, hard mode and leaderboards (post-MVP).
- Puzzle authoring shortcuts (named alignments, call templates, defense mirroring, defaults): the authoring-tool map. See [Puzzle authoring shortcuts in the format](https://github.com/mdedys/omaha/issues/40).
- The authoring tool, solvability checks, publishing, results API, stats, streaks, the puzzle archive: the next map.
- Every screen, including the screen redesigns the map handed off ([Routes step](https://github.com/mdedys/omaha/issues/28), [Read step](https://github.com/mdedys/omaha/issues/32), [Result reveal by rep](https://github.com/mdedys/omaha/issues/34), [Pros reveal](https://github.com/mdedys/omaha/issues/24)), and the dev-only scenario replay route used for tuning sign-off: front-end issues.
- Playwright e2e tests and the `pnpm test:e2e` CI step: they arrive with the first screen.
- Stale route and read text in `PRODUCT.md` and `GAME_CONCEPT.md`: the [Routes step](https://github.com/mdedys/omaha/issues/28) and [Read step](https://github.com/mdedys/omaha/issues/32) follow-ups.

## Domain Concepts & Language

Every game term is defined in [CONTEXT.md](../../../CONTEXT.md) and used here as defined there: puzzle, situation, goal, look, defensive call, assignment, zone, carry, gap, free rusher, design, protection, line call, read order, route menu, throw point, read time, catch point, forced throw, rep verdict, receiver feedback, cause, decisive defender, play art, yards gained and the rest.

Engine-local terms:

**Engine version**: The integer a puzzle's `engine` field names. Each version is a self-contained folder, `src/engine/v<N>/`, with its own rules, catalogs, tuning and validator. A version freezes when the first puzzle naming it is published.

**Scenario**: One test case, `{ puzzle, design, expect }`, stored as JSON in a version's `scenarios/` folder.

**Golden hash**: A SHA-256 per tick over a canonical byte encoding of the rep's state, stored per scenario, so any change to a rep names the first tick that differs.

**Event log**: The named events rules write as they fire, such as `rusher-free` or `zone-choose`. The cause is picked from it. Internal, with no stability promise.

**Stub engine**: A fixture-backed object that satisfies `Engine`, so the front end can build screens before v1 exists. Deleted when v1 replaces it.

## System Architecture

### Technical Approach & Trade-offs

```
src/engine/
  contract.ts   types only: Engine, Puzzle, Design, Rep, Cause, DefensePlayArt, ...
  error.ts      EngineError
  index.ts      loadPuzzle and the version map
  stub/         fixture-backed Engine, until v1 lands
  v1/           rules, catalogs, tuning.ts, validator, scenarios/, tests
```

The front end imports only `contract.ts`, `error.ts` and `index.ts`. `loadPuzzle` reads the puzzle's `engine` field, dynamically imports that version from an explicit map (one chunk per version), has the version validate the puzzle, and returns the puzzle with its `Engine`. Every later call is synchronous and pure on the main thread. Until v1 lands, the map points version 1 at the stub; switching it to `./v1` is the stub's last day.

A rep is a time-stepped simulation. Each tick, every rule reads the previous tick's frozen snapshot, all players move at once, and events are checked in a fixed order. Rules write to the event log; the cause is picked from the log, never rebuilt from positions afterward. The rules themselves are in [rules.md](rules.md).

- **Time-stepped steering over outcome-first animation** — the animation is the engine's own positions, so the separation the player sees is the separation that was judged, and no result has to be authored per design. [Simulation model](https://github.com/mdedys/omaha/issues/9), [ADR 0002](../../adr/0002-no-body-collisions.md).
- **Frozen full copies per version over a shared core** — a change for v2 can never quietly change a v1 puzzle; the duplication is deliberate. Don't factor code out of version folders. [ADR 0006](../../adr/0006-frozen-engine-versions.md).
- **Exact maths only** — `+ - * / %`, `Math.sqrt` and the rounding functions give the same bits everywhere; `sin`, `atan2`, `hypot`, `pow`, `**` don't. Directions are vectors normalized with `sqrt`, 45° is `(1,1)/√2`, and time is an integer tick. Lint bans the approximated Math functions, `Math.random`, `Date` and `performance.now` in `src/engine/**`; `**` can't be linted, so the golden test and review catch it. Every loop and sort has a fixed order with a consistent comparator. [Determinism across browsers](../../research/determinism-across-browsers.md).
- **Per-defender assignments over coverage templates** — the puzzle gives each defender a spot and one assignment; the coverage name is a label the engine never reads. [ADR 0003](../../adr/0003-per-defender-assignments.md).
- **Ownership over blocking rolls** — who blocks whom is fixed at the snap, and every blocked rusher holds for one global hold time. [ADR 0004](../../adr/0004-protection-by-ownership.md).
- **A player-set read order over a judging QB** — the QB only throws to an open read in the player's order, so every rep is explained by the design. [ADR 0005](../../adr/0005-player-set-read-order.md).
- **Codes over text** — the engine returns cause codes and facts; captions and aria-labels belong to the front end, so copy changes never touch a frozen version. [Engine contract with the front end](https://github.com/mdedys/omaha/issues/17).
- **The engine applies the play-art tier** — `revealedPlayArt(playArt, failedReps, puzzleEnded)` holds the reveal rule, so the front end can't drift from it. [What a rep tells the player](https://github.com/mdedys/omaha/issues/15).
- **The app stores designs, not reps** — it re-simulates on reload and Replay, which is safe because the puzzle pins its version. [Engine contract with the front end](https://github.com/mdedys/omaha/issues/17).
- **Plain JSON puzzles over encoded ones** — a player with devtools can read the defensive call; accepted, since encoding only stops a glance. [Puzzle format](https://github.com/mdedys/omaha/issues/18).
- **Inputs are the puzzle and the design only** — no rep number, no state between reps, so the defense never adapts. The `design/` specs that pass the rep index to the simulation are superseded on this point. [Simulation model](https://github.com/mdedys/omaha/issues/9).

**Tuning.** All tunable values live in `v1/tuning.ts` as named constants with units in the names (`holdTimeS`, `contestRadiusYd`), starting exactly from the [prototype's constants](https://github.com/mdedys/omaha/blob/prototype/legibility/PROTOTYPE_NOTES.md). Each carries a comment with its range and source (NGS, ESPN, prototype, or "free"); a public anchor is a hard bound unless a decision beside the value says otherwise. Values are global to the version, with no per-puzzle override. Scenarios gate CI; Mike's live sign-off on the dev replay route gates the v1 freeze. [Tuning values before launch](https://github.com/mdedys/omaha/issues/39).

**Tests.** Vitest with two projects. `node` runs every test; `browser` (Playwright provider) runs only the golden-hash comparison in Chromium, Firefox and WebKit. Tests go end to end through the contract: puzzle JSON through `loadPuzzle`, `simulate` and `score`. Unit tests exist only for pure geometry helpers where a scenario is too blunt (route polylines, mirroring). One test file loops over `scenarios/`. `expect` must assert the cause code, the decisive defender and yards gained; badges, the target and `times` (closed ranges in seconds for the throw, sack and catch) are optional. Golden hashes hash a canonical byte encoding of each tick's state (no JSON of floats) with `crypto.subtle`, and are re-blessed with `vitest -u` until the version freezes. [Engine code layout and tests](https://github.com/mdedys/omaha/issues/36).

**The stub engine.** It satisfies `Engine` with Gun Trey catalog data and a small set of fixture `Rep`s, captured from the prototype's engine or written by hand, covering every cause code. `simulate` picks a fixture deterministically from the design so every screen state is reachable. It shares the import wall and determinism lint, and it has no tests of its own beyond type-checking against the contract.

### Data Models & Schema

A puzzle is one plain JSON file: situation, goal, formation and flip, eleven defenders each with a spot in yards from the ball and an assignment string, the coverage name, and the pros' result. Catalogs (seven flippable formations, three route menus, the zone catalog, eight gaps) live in the version folder, never in the puzzle. Full schema and validation rules: [contracts.md](contracts.md#puzzle).

### API & Interface Contracts

The engine coordinate frame is yards: x from the middle of the field toward the offense's right (sidelines at ±15.75), y downfield from the line of scrimmage. A rep returns one position per player per tick plus the ball's flight, the reads, the outcome, verdict, cause, receiver feedback and play art. Signatures and every type: [contracts.md](contracts.md).

## User Stories

- **As a player, I can replay any rep, on any device, and see exactly what I saw the first time** so that the puzzle feels fair and shareable.
  - Reload and Replay re-simulate from the stored design; the result must not drift between browsers or releases.
- **As a player, I can tell from a failed rep why it failed** so that I know what to change for the next rep.
  - Every rep has exactly one cause, with its decisive defender ringed even on rep 1 when no play art shows.
  - Supporting events (a zone choice, a carry, a rub, a hug rush) never become the cause; the replay and play art carry them.
- **As a player, I see more of the defense after each failed rep** so that four reps are a puzzle and not four guesses.
  - The tier is fixed by failed-rep count; the coverage name waits for the end.
- **As Mike authoring puzzles, I get a clear `EngineError` when a puzzle file is wrong** so that a broken puzzle never reaches players.
  - An unknown or missing `engine` version fails in the loader, before any version code runs.
- **As Mike, I can ship a rules or tuning change without changing a puzzle already published** so that old puzzles keep their results.
  - A frozen version's golden hashes never change; a rep-changing change goes into a new version.
- **As a front-end developer, I can build every design and result screen against the contract and the stub before v1 exists** so that the screens and the engine are built in parallel.
  - `loadPuzzle` is async (it loads a chunk), so screens show a loading state for it; everything after it is synchronous.
  - A design the helpers would never offer, or a rep hitting the 20 s cap, throws `EngineError`. The screen shows a generic error and doesn't spend the rep.
  - Screens that judge timing and feel (Result reveal by rep, Replay) get a second pass against the real v1.
