# Live play

**Status:** Live (#66). Snap on Read opens Live play on the play screen at `/puzzle/:n`; it ends on Result. Replay (#67, replay.md) drives the same playback clock (`src/playback.ts`).

Live play animates the rep the player just designed. Every player holds his pre-snap spot through Set (0.8 s), then moves along the `Rep`'s tracks, one tick per `TICK_SECONDS`. A gold vision cone follows the QB's current read, the football flies from the throw to the catch, and a caption narrates Set, Snap, Throw and the outcome. Nothing of the play art (routes, zones, defense paths, badges, ball path) is drawn until the reveal. At the reveal the phone sheet slides up while the camera pans to the result framing and the play art fades in. On desktop the panel swaps to the result. The last frame is the Result screen. Spec: `design/07-live-play/spec.md`.

## Sub-features

- `live-set` means the screen opens on the caption `Set` with a protection line (for example `Five in protection. Man up front.`), every player at the Read step's spots, and focus on Skip.
- `live-motion` means after 0.8 s the players move, the cone aims at the current read (`data-vision-cone` names the letter), and on a throw the football (`data-football="in-flight"`) flies from `ball.from` to `ball.to`. The cone is gone 0.3 s after the throw or the sack.
- `live-captions` means the caption region (`aria-live="polite"`, only the current phase in it) shows `Set`, `Snap` (`Eyes locked on the <read>.`, and `Nothing there. Eyes to the <read>.` at a read change), `Throw` (none on a sack; `Nobody open. Into the seats.` on a throwaway; `… He forces it to the <receiver>.` on a forced throw), then the outcome word: `Sacked`, `Thrown away`, `Broken up`, `Picked off`, `Stopped short`, `First down` or `Touchdown`.
- `live-reveal` means 0.6 s after motion ends, for 0.5 s: phone sheet from `bottom:-420px` to `0` and camera pan with `cubic-bezier(.2,.8,.2,1)`, shade to `.22`, and the play art, badges, converted first-down line and key pills fading in together. Desktop swaps the panel to the result at once and fades in the "Final · defense revealed" pill with the art. It ends on the Result screen with focus on the result heading.
- `live-skip` means Skip (phone and desktop) or desktop `Esc`, before the reveal ends, shows Result at once.
- `live-reduced-motion` means with `prefers-reduced-motion: reduce`, Snap shows Result straight away.
- `live-layout` means phone shows the field at `viewBox="0 -180 403 872"` (390×844), the two situation pills at the top, and a 92 px cream caption bar with a `SKIP` button; desktop shows the standard `viewBox="0 0 403 495"` field beside a 440 px `Live play` panel with a 56 px phase word and a full-width "Skip to result" button with an `Esc` hint.
- `live-back` means browser back during Live play leaves the puzzle, as on any play step; Snap adds no history entry.

## How to get to it (user POV)

- Snap on Read, with every route runner assigned and at least one read picked.
- Desktop: `Enter` on Read when Snap is unlocked.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`, and Read is reachable through Protect and Routes (see read.md).

- **Open it.** Design puzzle 1's Slot WR `Out` play from result.md (5-man Man; Left WR `Post`, TE `Hitch`, Slot WR `Out`, Right WR `Go`, RB `Flat`; reads `Slot WR, Out` then `Left WR, Post`), then `click=button:Snap expect-role=complementary:"Live play" shot=set`. `aria.yml` shows the `Live play` complementary with the `Set` caption and the button `Skip to result`.
- **Watch it.** Wait on each caption line with `expect=` and `shot=` after it: `expect="Eyes locked on the Slot WR."` (Snap), `expect="Let it rip to the Slot WR."` (Throw), `expect="Swatted. The corner closed on it."` (the outcome), then `expect-role=heading:INCOMPLETE` once the reveal starts. On this play the throw is at 2.7 s from Snap, the catch at 3.6 s and the reveal at 4.2–4.7 s; `wait=` steps work too but drift by a frame or two of real time.
- **Read change.** Give the Slot WR a `Drag` instead (`click=option:Drag`, reads `Slot WR, Drag` then `Left WR, Post`). The QB reads the Slot WR, then at 1.85 s turns to the Left WR: `expect="Eyes locked on the Slot WR." shot=first-read expect="Nothing there. Eyes to the Left WR." shot=read-change`. The cone (`data-vision-cone`) changes from `H` to `X` and swings from up-right to up-left of the QB. He then forces the throw at 2.8 s (`Heat's coming. He forces it to the Left WR.`) and the corner breaks it up (`Swatted. The corner was waiting.`).
- **Skip.** After Snap, `click=button:"Skip to result" expect-role=region:"Rep result" shot=skipped` (use `complementary` on desktop). On desktop, `press=Escape` does the same.
- **Let it end.** After Snap, `wait=5000 expect-role=region:"Rep result" shot=after-reveal`. The screenshot matches a skipped Result for the same design.
- **Dark and desktop.** Repeat with `--theme dark` and `--viewport desktop`. The caption bar and desktop panel turn Charcoal with a Cream phase word; the field, pills, cone and ball don't change.

## Gotchas

- `drive.mjs` can't emulate reduced motion or pause the clock, so prove `live-reduced-motion`, exact phase timings and the reveal's easing with `e2e/live-play.spec.ts`, which drives Playwright's page clock.
- Timings come from the engine's `Rep` and change with the design. Most puzzle 1 designs keep one read the whole play; the Slot WR `Drag` above changes reads. Other puzzle 1 captions: Slot WR `Comeback` is sacked at 2.85 s with no Throw phase (`Nobody blocked the nickel.`); TE `Out` at 5 yds as the only read is thrown away (`Nobody open. Into the seats.`, then `His only read was covered.`); Left WR `Hitch` with the Slot WR's `In` is a touchdown (`The Slot WR takes it to the house.`) whose runner keeps going until the reveal at 11.4 s.
- On phone the sheet covers Skip within a few frames of the reveal starting, and on desktop the panel swaps it away, so during the reveal skip with `Esc` on desktop.
- The field's accessible name changes from `Live play, rep N: …` during the play to Result's `Rep N final frame …` once the reveal starts.
