# AGENTS.md

Omaha is a daily football puzzle: the player designs one pass play (protection, routes, read order) against a hidden defense and gets up to 4 reps to convert. See [README.md](README.md) for the overview.

## Commands

Use pnpm, not npm or yarn.

- `pnpm dev` — dev server
- `pnpm build` — type-check (`tsc -b`) and build
- `pnpm lint` — oxlint
- `pnpm fmt` / `pnpm fmt:check` — oxfmt

There is no test runner yet. Before calling work done, run `pnpm lint`, `pnpm fmt:check` and `pnpm build`.

## Where to look

- **What to build next:** open [GitHub issues](https://github.com/mdedys/omaha/issues). The game engine comes before the front end.
- **How a screen looks and feels:** the screen's folder under `design/` (`spec.md` plus prototype HTML), indexed in [design/README.md](design/README.md).
- **Tokens, type, components, field art:** [design/DESIGN.md](design/DESIGN.md).
- **Game logic** (rules, simulation, scoring, puzzle format): the game engine's `wayfinder:map` issue on GitHub, then the engine spec it produces.
- **Product rules and scope:** [PRODUCT.md](PRODUCT.md), then [GAME_CONCEPT.md](GAME_CONCEPT.md).

## Design sources of truth

When sources disagree:

1. `design/DESIGN.md` wins on visual values (colors, sizes, type).
2. A screen's `spec.md` wins on UX: layout, flow, interaction and motion.
3. Prototype HTML files are hand-built mockups, not reference code. Don't copy their markup or field coordinates; `design/README.md` lists their known inaccuracies.
4. The repo `design/` folder wins over the external design canvas.

The decisions table in `design/README.md` is settled for UX; raise a question instead of building around it. `design/` doesn't decide game logic: its rules and data contracts are proposals the game engine work may change.

## Product constraints

- **Deterministic simulation.** No randomness anywhere in play resolution: the same design against the same puzzle always gives the same result.
- **Legible over realistic.** Every failed rep must be explainable at a glance.
- **MVP is pass plays only.** The puzzle sets the formation and defense; the player never picks them.
- **No real team logos, uniforms or player likenesses.**
- **Phone-first.** Design for 390px wide and touch, then scale up to desktop. Support light and dark themes.
- **The game engine** (simulation, read progression, scoring) is built before the front end.

## Code conventions

- TypeScript, React 19 and SVG. Don't add a game engine or canvas library.
- Formatting is oxfmt with an 80-column print width; `docs/`, `design/`, `public/` and `.impeccable/` are excluded from formatting.
- Lint is oxlint with the `react`, `typescript` and `oxc` plugins.
- Don't edit files in `design/` unless the task is a design change.

## Agent skills

### Issue tracker

GitHub Issues on `mdedys/omaha` via the `gh` CLI; external PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root, created as terms and decisions get resolved. See `docs/agents/domain.md`.
