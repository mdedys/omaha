# Replay

**Status:** Live (#67). Result's replay square (`Watch the replay again`) opens Replay on the play screen at `/puzzle/:n`; "Back to the result" returns to Result. Replay drives the same playback clock as Live play (`src/playback.ts`), counted in ticks from the snap.

Replay is a video-style replay of the rep just played. The field shows only the players and the ball (with its dashed path after the throw): no routes, zones, defense paths, badges or vision cone. A "Rep N replay" pill sits on the field. The `Playback` panel holds a scrubber in phase segments, the time readout, a 0.25×/0.5×/1× speed control, frame-step and play/pause buttons, a "Jump to a moment" row and "Back to the result". Spec: `design/09-replay/spec.md`, whose Decisions section settles the behaviour.

## Sub-features

- `replay-open` means the replay square opens Replay paused at 0.0s at 0.5× with the Snap moment selected, the pill reading `Rep N replay` with a pause glyph, and header pips labelled `Rep N used, M left`. It opens this way every time.
- `replay-back` means "Back to the result" (or desktop `Enter`) returns to the same Result, with focus on the result heading.
- `replay-play` means Play runs the clock at the selected speed, the button turns into a two-bar `Pause`, the pill shows a play glyph, and the readout and thumb follow. At the end it stops on Play; Play then restarts from 0.0s.
- `replay-scrub` means the `Replay position` slider runs from 0 to the rep's end (`aria-valuemax` in seconds, `aria-valuetext` like `2.0 seconds, throw`). Tapping or dragging the track, arrow keys (one tick), `Home` and `End` move it. Back/Forward one frame move exactly one tick, clamped to 0 and the end.
- `replay-speed` means the `Playback speed` radio group switches 0.25×, 0.5× and 1× and keeps the position.
- `replay-moments` means the jump-to buttons move to Snap, Break, Throw and End and show their times; the one at the current tick is `aria-pressed="true"`, none between moments. A sack shows Snap, Break and End only. The scrubber splits into phase segments at Break and Throw (two segments at Break on a sack).
- `replay-pause-on-seek` means scrubbing, frame stepping or a jump-to while playing pauses.
- `replay-frame` means each frame draws the players and ball where Live play draws them at that tick. At Throw the QB still holds the ball; one frame later the football and its path appear. At End the football rests at the catch with the full path.
- `replay-desktop-keys` means on desktop `Space` toggles play, `,` and `.` step a frame and `Enter` goes back, unless focus is on a button or the slider, which keep their own keys.
- `replay-layout` means phone shows the 52 px header, the 390×479 field, the pill at 12/12 and a 313 px panel; desktop shows the field stage with the pill at 36/36 beside a 440 px `Playback` aside with a 180 px speed control, 52/68 px transport buttons, a vertical `Jump to` list, a 58 px button with `Enter` and the hint line.

## How to get to it (user POV)

- From Result (result.md), tap the replay square, `Watch the replay again`.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`, and Result is reachable (result.md).

- **Open it.** Design a play with Left WR `Out` at 5 yards (`click=option:Out click=radio:"10 yds" press=ArrowLeft`, because `click=radio:"5 yds"` also matches `15 yds`) and the Left WR as the first read, then `click=button:Snap click=button:"Skip to result" shot=result click=button:"Watch the replay again" expect-role=slider:"Replay position" shot=replay-open`. `aria.yml` shows the `Replay position` slider at 0, the `Playback speed` radio group with `0.5×` checked, and the `Jump to a moment` group with `Snap 0.0s`, `Break 1.6s`, `Throw 2.0s`, `End 3.0s`.
- **Moments.** `click=button:Throw shot=throw click=button:"Forward one frame" shot=after-throw click=button:End shot=end`. The throw frame has no football; the next frame has the football by the QB and a short dashed path; the end frame has the full path to the catch.
- **Sack.** Use Left WR `Slant` instead: the jump-to row is `Snap 0.0s`, `Break 1.0s`, `End 2.0s`, and no football is ever drawn.
- **Back.** `click=button:"Back to the result" shot=back`. The `back` and `result` screenshots match.
- **Dark and desktop.** Repeat with `--theme dark` and `--viewport desktop`. On desktop, `press=Enter` from the opened replay returns to Result.

## Gotchas

- `drive.mjs` can't pause the clock, so prove playback rate, the end stop and pause-on-seek with `e2e/replay.spec.ts`, which drives Playwright's page clock. `wait=` steps while playing are real time.
- Under the stub only Left WR's route picks the rep, and the tracks are straight lines from the pre-snap spot, so a receiver's track doesn't follow his route. Break is the first tick the first read's track gets as deep as his route's first break, so it depends on the route's depth: a 10-yard Out breaks at the end tick, with Break and End both at 3.0s.
- A first read on Go or Seam has no break, and a deep first read can outlast the rep; then there is no Break button and no Break split (open question in the spec).
- The Routes step defaults Out to 10 yards; pick `5 yds` for the times above.
