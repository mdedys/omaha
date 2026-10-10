# Omaha

A daily football puzzle. Each day recreates one game-deciding play from last week's NFL action. You are the offensive coordinator: read the defense, design one pass play, snap it, and find out whether you out-coached the pros.

The name comes from Peyton Manning's audible call at the line.

## Status

Pre-MVP. The visual design lives in [design/](design/README.md). The app shell, Landing and numbered puzzle play-screen frame are implemented in React and SVG, with system light/dark themes and a static daily puzzle source. Protect, Routes and Read are built, and Snap plays the rep live into Result, with Replay and Share. The Puzzles list and How to play are built. The engine contract, v1 design helpers and fixture-backed simulation are ready for screen development while the v1 tick loop is built; work is tracked in [GitHub issues](https://github.com/mdedys/omaha/issues).

## Getting started

Requires Node and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm dev
```

| Command          | What it does                           |
| ---------------- | -------------------------------------- |
| `pnpm dev`       | Start the Vite dev server              |
| `pnpm build`     | Type-check and build to `dist/`        |
| `pnpm preview`   | Serve the production build             |
| `pnpm lint`      | Lint with oxlint                       |
| `pnpm fmt`       | Format with oxfmt                      |
| `pnpm fmt:check` | Check formatting without writing       |
| `pnpm test`      | Run the engine unit tests              |
| `pnpm test:e2e`  | Run phone and desktop Playwright tests |

Install Chromium before the first browser run with `pnpm exec playwright install chromium`.

## Shell and daily puzzles

`/` renders Landing; `/puzzle/:n` loads numbered puzzle `n` directly through the engine boundary and shows its pre-snap field. `/puzzles` and `/how-to-play` remain placeholders. Links use browser history without reloading; browser back returns to the actual origin and unknown paths render Landing. Static hosting must rewrite non-asset URLs to `index.html` so direct entry into those routes works.

`public/puzzles/index.json` is an array of `{ number, date }` entries. Landing selects the newest ISO date on or before today in `America/New_York`, independently of index order, then fetches `/puzzles/<number>.json` and parses it through `loadPuzzle`. The fixtures are synthetic situations and contain no real team or player names. A puzzle includes engine data plus authored `goalText` for the Landing goal row. Field position is yards from the offense's own goal line; spots beyond midfield display as `opp <100 - spot>`. Goal-to-go displays when distance reaches the opposing goal line.

The hero is fixed playbook art, not a preview of the selected formation. Figtree weights 500–900 are self-hosted through `@fontsource/figtree`. Loading, fetch/engine errors and no eligible puzzle retain the wordmark, hero and secondary navigation but hide the play CTA. Stored progress and first-visit behavior belong to #57.

Playwright runs both 390×844 and 1280×800 projects in the pull-request `checks` job. Its tests use browser-controlled time and network interception for date boundaries and unavailable states; the manual [verification map](.agents/skills/verify-omaha/features/README.md) drives the actual committed fixtures.

## Puzzle field and session

The shared `Field` uses `engine.preSnap(puzzle)` in engine yards, projected by `fieldPoint`: center `(201.5, 366)`, downfield y decreasing by 12.8 units per yard, and 31.5 yards across the 403-unit width. The fixed viewBox is `0 0 403 495`. Turf stripes, numbers and hashes follow absolute field position; the yellow line marks the first-down target or replaces the goal line for a touchdown target. A visible end line adds the path, wall and a deterministic seat-hashed crowd, extended across the desktop stage. Field colors never change with theme.

Each numbered puzzle owns an in-memory session: rep 1, 5-man/man protection, no routes, empty read order, Protect selected. Protect offers exactly the engine's blocker counts at equal widths, updates the shared draft and field immediately, and advances to Routes without gating. The ungated step buttons retain the draft; Routes and Read remain placeholder panels. Reloading or opening a different puzzle creates a fresh session; no progress is persisted. The phone step bar sits inside the panel below the field, with the spot retained below 900px. Desktop uses a 64px header and 440px named design aside. Exit uses browser Back.

Unit coverage exercises projection, actual pre-snap player mapping and fresh session isolation; browser coverage exercises numbered loading/errors, goal decorations, steps, history, reload, responsive geometry, accessibility and theme invariance. The `checks` CI job runs both suites.

## Engine contract and stub

Screens import types from `src/engine/contract.ts`, `EngineError` from
`src/engine/error.ts`, and `loadPuzzle` from `src/engine/index.ts`. Load a raw
puzzle with `await loadPuzzle(json)` to get `{ puzzle, engine }`; every engine
method after loading is synchronous and pure. Unknown versions reject before
loading a version chunk. Version 1 currently loads the fixture-backed stub,
not the real simulation.

`src/engine/stub/gun-trey.json` is a complete example puzzle. The active
fixture-backed engine uses v1's parser and all five design helpers directly,
so every supported formation has truthful alignment, route menus and blocker
availability through the public loader. The duplicate Gun-Trey-only parser
and catalog are removed. `simulate` still selects authored replay fixtures;
this is not a cutover to v1's unfinished tick loop. Design screens use
`preSnap`, `routeMenu`, `availableDepths`, `protections` and `routePath` before
calling `simulate`; impossible designs throw `EngineError`.

For the example puzzle, use five blockers, a `man` line call, read order `["X"]`,
and routes Y = Seam, Z = Go, H = Seam, RB = Flat. X selects these authored replay
fixtures (depths in yards):

- In 5: `sack-free-rusher`
- Slant: `sack-beat-block`
- Hook 5: `throwaway`
- Out 5: `breakup-closed`
- Corner 10: `breakup-forced`
- Post 10: `interception-closed`
- Drag: `interception-forced`
- Go: `short`
- Comeback 10: `converted`
- Flat: `touchdown`

The forced breakup uses pressure; the forced interception uses out-of-reads.
Other valid designs deterministically select by X's route, with Hitch using the
first fixture. Replays are authored for the example puzzle, not recalculated
from another puzzle's defense or routes. Score and reveal helpers apply the
contract's real rules. Production builds include an exported engine-loader
entry and its dynamic stub chunk; Landing also loads the selected puzzle through
that boundary. Engine files have scoped oxlint walls against React imports and
nondeterministic math or clocks. Engine behavior tests run in the CI `checks`
job via `pnpm test`.

### v1 authoring helpers

Engine authors and tests can import `{ parsePuzzle, engine }` directly from
`src/engine/v1/index.ts`. The public `loadPuzzle` uses that same parser and
design catalog through the fixture-backed engine, while retaining authored
simulation until the tick-loop cutover. `parsePuzzle(json)` validates every
required field, the formation and defensive assignment catalogs, the
eleven-player roster, a distance of at least one yard, field limits and the
goal-to-go equivalence: a touchdown goal requires `spot + distance === 100`,
and that sum requires a touchdown goal.

v1 supports Gun Trey, Gun Doubles, Gun Trips, Gun Spread, Gun Empty, Gun Doubles
12 and Ace, each flipped or unflipped on all three hashes. Outside receivers
remain on the field's numbers when flipped; the line and attached receivers
are placed from the ball, and detached slots interpolate to their side's numbers.
On the middle hash, flipping mirrors receiver positions and route paths exactly.
On a side hash, keeping the numbers fixed means outside receivers cannot also
be reflected exactly about the ball. Linemen and gap names always refer to the
side as drawn. Defenders use the ball plus their authored `at`, without flipping.

Gun Empty's split-out RB uses the Inside menu (Seam and Wheel included); Ace's
second attached TE H also uses Inside. These are formation-authored menus, not
per-puzzle choices.

Route paths start at the receiver alignment, or at the RB's release outside
his tackle. Hooks settle two yards back and one inside using an axial segment
followed by an exact 45-degree segment. Run routes stop a yard inside the
sideline or end line. `zoneCatalog(puzzle)` in `v1/zones.ts` supplies the fixed
ellipse geometry, including hash-relative hooks; `gapPoints(puzzle)` in
`v1/formations.ts` supplies all eight gaps. Geometry constants with units,
sources and ranges are in `v1/tuning.ts`.

Ace's RB depth is fixed at seven yards by the resolved formation rule in
[issue #4](https://github.com/mdedys/omaha/issues/4#issuecomment-6039554200),
not by a prototype measurement. Its tuning source is `free`;
`PROTOTYPE_NOTES.md` specifies a seven-yard QB set depth, but no Ace RB depth.

v1's `simulate` rejects impossible designs using the helpers' rules. A valid
design then throws an explicit `EngineError` because the tick loop is not yet
available; it never returns an authored or fabricated rep. Scoring and play-art
disclosure are usable independently of simulation.

## Stack

TypeScript, React and SVG, with no game engine library. React renders menus, briefing and result screens; SVG renders and animates the field. Planned: static hosting with one JSON file per daily puzzle, an anonymous results API on Cloudflare (Worker + D1), and a PWA install.

## Docs

| File                                 | What's in it                                        |
| ------------------------------------ | --------------------------------------------------- |
| [PRODUCT.md](PRODUCT.md)             | Users, positioning, MVP scope and game rules        |
| [GAME_CONCEPT.md](GAME_CONCEPT.md)   | Concept, design pillars, style and risks            |
| [design/README.md](design/README.md) | Screen index, flow and settled design decisions     |
| [design/DESIGN.md](design/DESIGN.md) | Design tokens, type, components and field-art rules |
| [AGENTS.md](AGENTS.md)               | Instructions for coding agents                      |
