# Omaha

A daily football puzzle. Each day recreates one game-deciding play from last week's NFL action. You are the offensive coordinator: read the defense, design one pass play, snap it, and find out whether you out-coached the pros.

The name comes from Peyton Manning's audible call at the line.

## Status

Pre-MVP. The visual design lives in [design/](design/README.md). The app shell and Landing are implemented in React and SVG, with system light/dark themes and a static daily puzzle source. The other three routes are labelled placeholders. Version 1 of the engine (pre-snap catalogs, validation, design helpers, the simulation, scoring and disclosure tiers) runs behind the engine contract. Work is tracked in [GitHub issues](https://github.com/mdedys/omaha/issues).

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

`/` renders Landing; `/puzzles`, `/how-to-play` and `/puzzle/:n` render placeholders until those screens land. Links use browser history without reloading; unknown paths render Landing. Static hosting must rewrite non-asset URLs to `index.html` so direct entry into those routes works.

`public/puzzles/index.json` is an array of `{ number, date }` entries. Landing selects the newest ISO date on or before today in `America/New_York`, independently of index order, then fetches `/puzzles/<number>.json` and parses it through `loadPuzzle`. The fixtures are synthetic situations and contain no real team or player names. A puzzle includes engine data plus authored `goalText` for the Landing goal row. Field position is yards from the offense's own goal line; spots beyond midfield display as `opp <100 - spot>`. Goal-to-go displays when distance reaches the opposing goal line.

The hero is fixed playbook art, not a preview of the selected formation. Figtree weights 500–900 are self-hosted through `@fontsource/figtree`. Loading, fetch/engine errors and no eligible puzzle retain the wordmark, hero and secondary navigation but hide the play CTA. Stored progress and first-visit behavior belong to #57.

Playwright runs both 390×844 and 1280×800 projects in the pull-request `checks` job. Its tests use browser-controlled time and network interception for date boundaries and unavailable states; the manual [verification map](.agents/skills/verify-omaha/features/README.md) drives the actual committed fixtures.

## Engine contract

Screens import types from `src/engine/contract.ts`, `EngineError` from
`src/engine/error.ts`, and `loadPuzzle` from `src/engine/index.ts`. Load a raw
puzzle with `await loadPuzzle(json)` to get `{ puzzle, engine }`; every engine
method after loading is synchronous and pure. Unknown versions reject before
loading a version chunk. Version 1 loads `src/engine/v1/`.

Design screens use `preSnap`, `routeMenu`, `availableDepths`, `protections` and
`routePath` before calling `simulate`; impossible designs throw `EngineError`.
Each scenario in `src/engine/v1/scenarios/` is a complete example puzzle with a
design and its expected rep. Production builds include an exported engine-loader
entry and its dynamic v1 chunk; Landing also loads the selected puzzle through
that boundary. Engine files have scoped oxlint walls against React imports and
nondeterministic math or clocks. Engine behavior tests run in the CI `checks`
job via `pnpm test`.

### v1 authoring helpers

v1's `parsePuzzle(json)` validates
every required field, the formation and defensive assignment catalogs, the
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

v1's `simulate` rejects impossible designs using the helpers' rules, then runs
the play tick by tick. Scoring and play-art disclosure are usable independently
of simulation.

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
