# Landing

**Status:** Not built (T17). The route path is not decided yet; the spec only says the site root. Report this feature as skipped until the screen exists.

Landing shows today's puzzle: the wordmark, a hero field drawing, and a puzzle card with down, distance, spot, briefing and goal from the puzzle data. Its primary CTA starts rep 1. Spec: `design/01-landing/spec.md`.

## Sub-features

- `landing-card` means the puzzle card renders the fixture's number, down and distance, spot, briefing and goal.
- `landing-play` means "Play today's puzzle" opens Protect on rep 1 with 5-man and Man selected.
- `landing-nav` means "All puzzles" opens Puzzles and "How to play" opens Tutorial step 1.
- `landing-progress` means local storage with reps used, or a finished puzzle, changes the card and CTA (spec states 2–4).

## How to get to it (user POV)

- Open the site root (the installed PWA opens here too).
- Use the back button from Puzzles.
- Close Share, if the open question in the Share spec settles that way.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`, and `/` shows Landing rather than the starter page.

- **Card.** Run `drive.mjs landing expect-role=region:"Today's puzzle" shot=card`. Use `complementary` instead of `region` on desktop, where the panel is an `aside`. The screenshot shows the fixture's 3rd & 10, own 45.
- **Play.** Add `click=button:"Play today's puzzle" expect-role=radiogroup:Blockers`. If the CTA is a link, use the `link` role. Protect opens, and `aria.yml` shows `radio "5-man" [checked]` and `radio "Man" [checked]`.
- **Nav.** In separate drives, `click=` "All puzzles" and "How to play", then `shot=`. Each shows its target screen.
- **Hero.** `aria.yml` contains `img "A play drawn on the field: four receivers' routes and the running back's check-down"`.
- **Desktop.** Run with `--viewport desktop`. Check the 64px top bar and 520px panel, and that the nav links are each at least 44×44.

## Gotchas

- Card copy comes from fixture JSON. Assert the fixture's values, not prototype strings copied from the HTML.
- No real team or player names may appear. Grep `aria.yml` for them as part of the proof.
- The in-progress and finished states (2–4) need local storage set by actually playing reps in the same drive. Don't inject it.
