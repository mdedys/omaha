# Landing

**Status:** Not built (#60). Landing lives at `/`, and an unknown path also renders it. Report this feature as skipped until the screen exists.

Landing shows today's puzzle: the wordmark, a hero field drawing, and a puzzle card with down, distance, spot, briefing and goal from the puzzle data. Its primary CTA starts rep 1. Spec: `design/01-landing/spec.md`.

## Sub-features

- `landing-card` means the puzzle card renders the fixture's number, down and distance, spot, briefing and goal.
- `landing-play` means "Play today's puzzle" opens Protect on rep 1 with 5-man and Man selected.
- `landing-nav` means "All puzzles" opens Puzzles at `/puzzles` and "How to play" opens Tutorial step 1 at `/how-to-play`, without a full page reload. Browser back returns to Landing.
- `landing-states` means Landing shows a loading state while the puzzle loads, an error state on a failed fetch, and a no-puzzle state when no puzzle is dated today or earlier.
- `landing-focus` means phone focus order is CTA → All puzzles → How to play.
- `landing-progress` means stored reps used, or a finished puzzle, changes the card and CTA (spec states 2–4). Blocked on #57: nothing reads or writes local storage until it lands.

## How to get to it (user POV)

- Open the site root (the installed PWA opens here too).
- Use the back button from Puzzles.
- Close Share, if the open question in the Share spec settles that way.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`, and `/` shows Landing rather than the starter page.

- **Card.** Run `drive.mjs landing expect-role=region:"Today's puzzle" shot=card`. Use `complementary` instead of `region` on desktop, where the panel is an `aside`. The screenshot shows the down and distance and the spot from the served puzzle's JSON (the Gun Trey stub fixture is 3rd & 10, own 45).
- **Play.** Add `click=link:"Play today's puzzle"`. The spec makes every Landing control a link; fall back to the `button` role only if the screen differs. The play screen opens. Once Protect's controls land (#62), add `expect-role=radiogroup:Blockers` and check that `aria.yml` shows `radio "5-man" [checked]` and `radio "Man" [checked]`.
- **Nav.** In separate drives, `click=link:"All puzzles"` and `click=link:"How to play"`, then `shot=`. Until Puzzles (#70) and Tutorial (#69) land, each target is a placeholder, so the screenshot proves only that Landing navigated away. `drive.mjs` has no URL assertion.
- **Hero.** `aria.yml` contains `img "A play drawn on the field: four receivers' routes and the running back's check-down"`.
- **Desktop.** Run with `--viewport desktop`. Check the 64px top bar and 520px panel, and that the nav links are each at least 44×44.

## Gotchas

- Card copy comes from `public/puzzles/<n>.json`, picked as the newest `public/puzzles/index.json` entry dated on or before today in US Eastern time. Assert that puzzle's values, not prototype strings copied from the HTML.
- No real team or player names may appear. Grep `aria.yml` for them as part of the proof.
- Once #57 lands, the in-progress and finished states (2–4) need local storage set by actually playing reps in the same drive. Don't inject it.
