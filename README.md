# Omaha

A daily football puzzle. Each day recreates one game-deciding play from last week's NFL action. You are the offensive coordinator: read the defense, design one pass play, snap it, and find out whether you out-coached the pros.

The name comes from Peyton Manning's audible call at the line.

## Status

Pre-MVP. The visual design is done and lives in [design/](design/README.md). The app is a Vite + React + TypeScript starter shell. The engine contract and Gun Trey stub are ready for screen development. v1's pre-snap catalogs, validation, design helpers, scoring and disclosure tiers are implemented; the simulation is still being built. Work is tracked in [GitHub issues](https://github.com/mdedys/omaha/issues).

## Getting started

Requires Node and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm dev
```

| Command          | What it does                       |
| ---------------- | ---------------------------------- |
| `pnpm dev`       | Start the Vite dev server          |
| `pnpm build`     | Type-check and build to `dist/`    |
| `pnpm preview`   | Serve the production build         |
| `pnpm lint`      | Lint with oxlint                   |
| `pnpm fmt`       | Format with oxfmt                  |
| `pnpm fmt:check` | Check formatting without writing   |
| `pnpm test`      | Run the engine's Vitest node tests |

## Engine contract and stub

Screens import types from `src/engine/contract.ts`, `EngineError` from
`src/engine/error.ts`, and `loadPuzzle` from `src/engine/index.ts`. Load a raw
puzzle with `await loadPuzzle(json)` to get `{ puzzle, engine }`; every engine
method after loading is synchronous and pure. Unknown versions reject before
loading a version chunk. Version 1 currently loads the fixture-backed stub,
not the real simulation.

`src/engine/stub/gun-trey.json` is a complete example puzzle. The stub parses
assignment strings into tagged objects, checks field types, and requires exactly
11 defenders with unique roster IDs. v1 adds full puzzle validation and the seven
formations. Design screens use `preSnap`, `routeMenu`, `availableDepths`,
`protections` and `routePath` before calling `simulate`; impossible designs throw
`EngineError`.

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
entry and its dynamic stub chunk without wiring the starter app to the engine.
Engine files have scoped oxlint walls against React imports and nondeterministic
math or clocks. Engine behavior tests run in the CI `checks` job via `pnpm test`.

### v1 authoring helpers

Until the version map switches, engine authors and tests import `{ parsePuzzle,
engine }` directly from `src/engine/v1/index.ts`. `parsePuzzle(json)` validates
every required field, the formation and defensive assignment catalogs, the
eleven-player roster, field limits and the goal-to-go equivalence: a touchdown
goal requires `spot + distance === 100`, and that sum requires a touchdown goal.
The public `loadPuzzle` continues to load the stub for version 1.

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
