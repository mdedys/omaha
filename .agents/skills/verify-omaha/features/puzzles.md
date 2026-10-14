# Puzzles

**Status:** Live (#70). The season's puzzle list at `/puzzles`, built from `public/puzzles/index.json`. Spec: `design/02-puzzles/spec.md`, whose Decisions section settles the behaviour. A fixed header holds the `Back` link and the `h1` "Puzzles" (desktop adds the `OMAHA` wordmark and centres the title in a 64px top bar). Below it, the today card shows the newest entry dated on or before today (US Eastern) over static field art, then an "Earlier" list of every other published entry, newest first. Status chips and the Open/Converted filter wait for stored progress (#57), so every row is unplayed and no filter shows.

## Sub-features

- `puzzles-back` means the header link `Back` opens Landing (`/`). The header stays put while the list scrolls under it.
- `puzzles-today` means the today card is a link to `/puzzle/<n>` named `Today's puzzle: <down> and <distance>, <spot>. <label without its final period>`, for example `Today's puzzle: 2nd and goal, opp 6. Six yards. Don't choke`. It shows `Today`, the down and distance, the spot, the short label and a `Play` pill, and no date or number.
- `puzzles-earlier` means the `region "Earlier"` lists every other entry dated on or before today, newest first. Each row is a link to `/puzzle/<n>` named `Puzzle <n>: <down> and <distance>, <spot>. <label>`, shows `#<n>` at its right edge and no date, and its label stays on one line with an ellipsis.
- `puzzles-thumbnail` means each row's 56×56 field draws the line of scrimmage at y 44 and the line to gain 2.4 units per yard above it, never closer than 10 units. The goal line (3px, cream at 50%) is drawn at the same scale when it falls inside the frame.
- `puzzles-states` means an index with only today's entry shows `No earlier puzzles yet. Come back tomorrow.` under "Earlier". While the index loads, when it fails, or when no entry is dated on or before today, Landing's `status` block (`Loading today's puzzle…`, `Couldn't load today's puzzle.`, `No puzzle available yet.`) replaces the card and list.
- `puzzles-layout` means phone follows `prototype.html` (52px header, 168px card, 76px rows) and 900px and wider follows `prototype-desktop.html` (64px top bar, a centred column at most 760px wide, the card art anchored right and cropped). Dark theme turns the page Charcoal with Cream text and Dark Muted labels; the today card and thumbnails don't change.

## How to get to it (user POV)

- Tap "All puzzles" on Landing (either link; desktop also has one in the top bar).
- Open `/puzzles` directly.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`.

- **List.** `drive.mjs puzzles goto=/puzzles expect-role=heading:Puzzles expect-role=link:"Today's puzzle:" expect-role=link:"Puzzle 1:" shot=list`. `aria.yml` has `link "Back"` with `/url: /`, the `heading "Puzzles" [level=1]`, the today link with `/url: /puzzle/<n>` and the `region "Earlier"` list. Puzzle 1 is 3rd & 10, own 45, `Field goal won't cut it.`; puzzle 2 is 2nd & goal, opp 6, `Six yards. Don't choke.`. Which one is today depends on the real date against the index.
- **Open a puzzle.** Add `click=link:"Today's puzzle:" expect-role=navigation:"Play steps" shot=protect`, or `click=link:"Puzzle 1:"` for a row. The shot shows Protect for that puzzle.
- **Back.** `goto=/puzzles click=link:Back expect-role=heading:Omaha shot=landing`.
- **Focus.** `press=Tab` moves Back → today card → each row; capture each focus.
- **Themes and sizes.** Repeat List with `--theme dark` and `--viewport desktop`. Compare with `design/02-puzzles/prototype{,-dark,-desktop,-desktop-dark}.html`, ignoring the prototype's filter and chips (spec Decisions 1) and its uneven thumbnail scale.

## Gotchas

- `shot=` captures the viewport only: the list scrolls inside the page, not the document. `e2e/puzzles.spec.ts` scrolls a 30-entry index to prove the header stays put.
- The shipped index has two entries, so a real-date drive shows at most one row and never a goal line in a row thumbnail. `e2e/puzzles.spec.ts` stubs the index to cover ordering, future entries, truncation, thumbnail lines, loading, errors and the no-earlier state. Don't edit `public/puzzles/index.json` just to drive those.
- `click=link:Back` is a substring match; on `/puzzles` "Back" is the only matching link.
- Index entries repeat each puzzle's down, distance and spot; `src/puzzles.test.ts` fails when they disagree with the puzzle JSON.
