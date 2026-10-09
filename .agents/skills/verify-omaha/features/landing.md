# Landing

Landing is live at `/` and unknown paths. It shows the newest published Eastern-date puzzle, a fixed hero field and the wordmark, with navigation to three labelled route placeholders. Spec: `design/01-landing/spec.md`.

## Sub-features

- `landing-card`: number, down/distance, spot, briefing and authored goal render from the selected public JSON.
- `landing-play`: "Play today's puzzle" opens `/puzzle/<n>` without reloading. Protect controls remain #61/#62.
- `landing-nav`: both secondary links, plus the duplicate desktop top-bar links, navigate to `/puzzles` and `/how-to-play`.
- `landing-states`: loading covers index and puzzle fetch; failed fetch or EngineError shows error; no eligible date shows no-puzzle. Hero, wordmark and secondary navigation remain, and the primary CTA is absent.
- `landing-focus`: phone order is CTA → All puzzles → How to play. Desktop order is top-bar All puzzles → top-bar How to play → CTA → panel All puzzles → panel How to play. Enter and Space activate every link.
- `landing-layout`: 390×844 has the 520px hero and bottom-pinned 392px sheet without scrolling; desktop has the 64px bar, centered field stage and 520px panel.
- `landing-progress`: not built, #57. No local storage is read or written.

## How to get to it (user POV)

- Open the site root or an unknown URL.
- Use browser Back or the placeholder's "Back to Landing" link.

## Driving it with drive.mjs

Precondition: `doctor.sh` exits `0`.

- **Card:** `drive.mjs landing expect-role=heading:Omaha expect-role=link:"Play today's puzzle" shot=card`. Inspect the screenshot and `aria.yml` against the newest eligible `public/puzzles/index.json` entry. Puzzle 1 is 3rd & 10, own 45, first-down goal; puzzle 2 is 2nd & goal, opp 6, touchdown goal.
- **Hero:** `aria.yml` must contain `img "A play drawn on the field: four receivers' routes and the running back's check-down"`.
- **Phone focus:** add `press=Tab shot=cta-focus press=Tab shot=all-focus press=Tab shot=help-focus press=Space expect-role=heading:"How to play" shot=activated`.
- **Desktop focus:** with `--viewport desktop`, tab through the two top-bar links, CTA and two panel links, capturing each focus. The links each have at least 44×44px hit areas.
- **Play:** capture before and after `click=link:"Play today's puzzle" expect="This screen is not available yet."`; this proves navigation only.
- **Theme/layout:** run the card recipe for both viewports in light and dark. Inspect against all four prototypes, with spec corrections for field centering and desktop CTA 58px / 10px radius / 19px label.
- **Failure/date paths:** `pnpm test:e2e` uses controlled browser time and intercepted index/puzzle responses to cover Eastern summer/winter midnight, unsorted indexes, authored changes, independent pending requests, network/HTTP errors, engine rejection and empty/future-only indexes. Do not edit fixtures just to drive failures manually.

## Gotchas

- Desktop duplicates mean drive.mjs's unqualified link click may be ambiguous. Use the keyboard recipe for desktop navigation; Playwright covers both pairs by scoped/indexed accessible queries.
- Hero art is deliberately fixed and is not derived from the puzzle formation.
- Goal copy may wrap beside the rep indicator; there is no character-limit contract.
- Fixtures are synthetic and must not name real teams or players. The stub simulation is not yet a recalculated simulation for these fixtures.
- Stored progress, finished and first-visit states remain #57, not part of this delivery.
