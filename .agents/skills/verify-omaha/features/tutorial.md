# Tutorial

**Status:** Live (#69). The three-step how-to-play at `/how-to-play`. Sending first-time visitors here automatically waits for stored progress (#57). Spec: `design/03-tutorial/spec.md`, whose Decisions section settles the behaviour.

Each step shows a field over a bottom sheet (phone) or on the turf stage beside a 440px panel (desktop). The sheet holds three progress dots, the step title as the page's `h1`, the step's content and its buttons: step 1 "Read the situation" (the 3rd & 10 · own 45 situation, four rep boxes), step 2 "Draw up the play" (Protect, Routes, Read), step 3 "Snap it, then run it back" (rep 1's result frame and a Snap › Result › Run it back strip). Skip, over the field on phone and in the top bar on desktop, and step 3's "Play today's puzzle" open today's puzzle.

## Sub-features

- `tutorial-steps` means `/how-to-play` opens on step 1, Next moves to steps 2 and 3, and the sheet (`region` on phone, `complementary` on desktop) is named `Step N of 3`. The current dot is 24px wide and the others 8px. After a step change, focus is on the new `h1`.
- `tutorial-field` means each step's field is the shared play-screen `Field` (`viewBox="0 0 403 495"`): step 1 is the `img` "The field at your own 45: the blue line of scrimmage and the yellow first-down line ten yards ahead" with the first-down zone, `FIRST DOWN`, `LINE OF SCRIMMAGE` and `10 YDS` markings; step 2 is "A full play drawn: the line sliding left, four routes, and the tight end marked as the first read" with four routes and a gold "1" read badge on the TE; step 3 is "The result of rep 1: the defense revealed, the throw to the Left WR" with the defense's play art, the ball path and receiver badges.
- `tutorial-exit` means Skip, on any step, and `Play today's puzzle` on step 3 open `/puzzle/<n>` for today's puzzle (the newest index entry dated on or before today, US Eastern). Until that number is known, or when the index fails or has no puzzle, both go to Landing (`/`), which shows its status.
- `tutorial-back` means steps 2 and 3 have a `Back` button that returns one step; step 1 has none. Steps add no history entries, so browser back from any step leaves to the page before `/how-to-play`.
- `tutorial-layout` means phone shows the field with the situation pill (step 1) or `Rep 1 result` pill (step 3) at top left, Skip at top right and a 398px (step 1) or 428px sheet. At 900px and wider the 64px top bar holds `OMAHA` and Skip, the field sits centered on the turf stage with the pill at 36/36, and the panel is 440px. Dark theme turns the page, sheet and panel Charcoal with Cream text; the field, pills and orange CTA are unchanged.

## How to get to it (user POV)

- Tap "How to play" on Landing (either link; desktop also has one in the top bar).
- Open `/how-to-play` directly.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`.

- **Steps.** `drive.mjs tutorial goto=/how-to-play expect-role=heading:"Read the situation" expect-role=img:"The field at your own 45" shot=step1 click=button:Next expect-role=heading:"Draw up the play" shot=step2 click=button:Next expect-role=heading:"Snap it, then run it back" expect-role=img:"The result of rep 1" shot=step3`. `aria.yml` has the `region "Step 3 of 3"`, the `heading [level=1]`, the strip `img "Snap, then the result, then run it back"`, `button "Back"` and `link "Play today's puzzle"` with `/url: /puzzle/<n>`.
- **From Landing.** `drive.mjs tutorial-entry expect-role=link:"Play today's puzzle" click=link:"How to play" expect-role=heading:"Read the situation" shot=step1` on phone. On desktop use the keyboard recipe in landing.md, since the link is duplicated.
- **Exit.** From any step, `expect-role=link:Skip click=link:Skip expect-role=navigation:"Play steps" shot=protect`; from step 3, `click=link:"Play today's puzzle"` instead. The shot shows Protect for today's puzzle (`2nd & goal` while puzzle 2 is the newest entry); `transcript.json` doesn't record the URL, so `e2e/tutorial.spec.ts` asserts `/puzzle/<n>`. A tap before the index loads goes to Landing.
- **Back.** On step 3, `click=button:Back expect-role=heading:"Draw up the play" click=button:Back expect-role=heading:"Read the situation" shot=back`. `aria.yml` has no `button "Back"` on step 1.
- **Themes and sizes.** Repeat the Steps recipe with `--theme dark` and `--viewport desktop`. Compare each shot with `design/03-tutorial/prototype-N{,-dark,-desktop,-desktop-dark}.html` for composition: field art differs by design (spec Decisions).

## Gotchas

- `drive.mjs` has no browser-back step. `e2e/tutorial.spec.ts` covers system back, the index failure fallback and the dot widths.
- Under the stub only X's route picks the rep (result.md Gotchas), so step 3 throws to the Left WR although step 2 reads the TE first. The step 3 field label names whichever receiver the rep throws to.
- The phone and desktop Skip are separate links; only the one for the current width is rendered, so `click=link:Skip` is never ambiguous.
- Nothing is stored: the tutorial always opens on step 1 and writes no local storage.
