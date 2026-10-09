# Omaha

A daily football puzzle. Each day recreates one game-deciding play from last week's NFL action. You are the offensive coordinator: read the defense, design one pass play, snap it, and find out whether you out-coached the pros.

The name comes from Peyton Manning's audible call at the line.

## Status

Pre-MVP. The visual design is done and lives in [design/](design/README.md). The app is a Vite + React + TypeScript starter shell. The engine contract and Gun Trey stub are ready for screen development while v1 is built; work is tracked in [GitHub issues](https://github.com/mdedys/omaha/issues).

## Getting started

Requires Node and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm dev
```

| Command          | What it does                     |
| ---------------- | -------------------------------- |
| `pnpm dev`       | Start the Vite dev server        |
| `pnpm build`     | Type-check and build to `dist/`  |
| `pnpm preview`   | Serve the production build       |
| `pnpm lint`      | Lint with oxlint                 |
| `pnpm fmt`       | Format with oxfmt                |
| `pnpm fmt:check` | Check formatting without writing |

## Engine contract and stub

Screens import types from `src/engine/contract.ts`, `EngineError` from
`src/engine/error.ts`, and `loadPuzzle` from `src/engine/index.ts`. Load a raw
puzzle with `await loadPuzzle(json)` to get `{ puzzle, engine }`; every engine
method after loading is synchronous and pure. Unknown versions reject before
loading a version chunk. Version 1 currently loads the fixture-backed stub,
not the real simulation.

`src/engine/stub/gun-trey.json` is a complete example puzzle. The stub parses
assignment strings into tagged objects and checks field types, but full puzzle
validation and other formations belong to v1. Design screens use `preSnap`,
`routeMenu`, `availableDepths`, `protections` and `routePath` before calling
`simulate`; impossible designs throw `EngineError`.

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
math or clocks. There are no permanent stub tests or test runner yet.

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
