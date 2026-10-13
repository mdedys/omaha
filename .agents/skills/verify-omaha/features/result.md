# Result

**Status:** Live for the sheet and Run it back (#64) and the play art (#65): the field shows every player at the final frame with the revealed defense play art, feedback badges, ball path and, on a converted rep or rep 4, the key pill. #71 builds the reveal by rep (the decisive-defender ring, partial art on rep 2 and the hidden-art field label). The replay square and "See how the pros did" render with `aria-disabled="true"` until Replay (#67) and the Pros reveal land, so report `result-pros` and `result-replay` as skipped. Result is shown on the play screen at `/puzzle/:n`.

Result shows how the rep ended. The field shows the defense's play art and receiver feedback badges, and a sheet holds the headline, outcome tile, stats, rep boxes and the next action. The sheet is cream when reps remain, ink green when converted, and charcoal when out of reps. Spec: `design/08-result/spec.md`, with the seven end states (incomplete, short, sack, interception, throwaway, converted, out of reps) in `design/08-result/states/`.

## Sub-features

- `result-states` means each of the seven end states renders its headline, tile, stats, rep boxes and CTA per the spec's copy rules, with yards from the engine's `Rep` rather than the prototypes' numbers.
- `result-coverage-hidden` means that before the final rep or a conversion, the coverage name appears nowhere: not in visible text and not in any accessible name.
- `result-play-art` means the field draws `revealedPlayArt(rep.playArt, failedReps, puzzleEnded)`: zone ellipses in the Madden colour for their kind (30% fill, 85% stroke), drop, man and rush lines from each defender's track ending 10.5 units short with an arrowhead on man and rush, orange 2.4 px blitz lines for rushers who aren't linemen, a lineman's grey rush line only when he made the sack, and a start dot on every defender with a line. `failedReps` counts every non-converted rep played so far, the rep shown included.
- `result-badges` means each receiver in the rep's `feedback` gets its open (check), contested (wave) or covered (✕) badge up-right of the receiver, flipped up-left at the right sideline or over another player.
- `result-ball` means a thrown ball draws a dashed path from `ball.from` to `ball.to`; only an interception adds the football at `ball.to`; a throwaway's path ends past the sideline; a sack draws no ball.
- `result-key-pill` means "Defense · {coverage}" shows only on a converted rep or rep 4: under the situation pills on phone, and 8 px under the desktop-only "Final · defense revealed" pill at the stage's top left on desktop.
- `result-run-it-back` means "Run it back" opens Protect with the previous design kept.
- `result-pros` means "See how the pros did" (on a converted or final rep) opens the Pros reveal.
- `result-replay` means the replay square opens Replay, which returns here unchanged.

## How to get to it (user POV)

- Tap Snap on Read. Until Live play lands (#66), Snap opens Result directly.
- Let the live play finish after Snap, once #66 lands.
- Press Skip during the live play, once #66 lands.
- Go "back to Result" from Replay.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`, and the play loop works from Landing through Snap.

- **Reach it.** Design a play, then `click=button:Snap expect-role=region:"Rep result" shot=result`. Once #66 lands, add `click=button:Skip` after Snap. Use `complementary` on desktop. Focus is on the sheet heading.
- **Rep boxes.** `aria.yml` has a group named like `Reps: rep 1 no gain, rep 2 next, rep 3 unused, rep 4 unused`.
- **Coverage hidden.** On rep 1 of a failed design, grep `aria.yml` and the transcript for the puzzle's `coverageName` (`Cover 1 pressure` in puzzle 1). It must be absent. The field label reads `Rep N final frame with the defense revealed: <outcome>. <cause>` before the puzzle ends, and `Rep N final frame against Cover 1 pressure: <outcome>. <cause>` on a converted rep or rep 4.
- **Play art.** The engine's `revealedPlayArt` reveals nothing before two failed reps, only the DL and LB at two, and everything from three failed reps or once the puzzle ends. To see full art on puzzle 1, play the Slot WR's Out, then Hitch, then the route for the cause you want on rep 3 (Comeback for a sack, Post for an interception), or convert with In, and `shot=` it. Every revealed zone, man and blitz defender who moves more than the 10.5-unit trim gets a line and a start dot; linemen rushing get none unless one made the sack. On puzzle 1 DL4 drops into a hook zone, so it shows a drop line. Elements carry `data-zone`, `data-defense-path` (with `data-path-kind` drop, man, rush or blitz), `data-start-dot`, `data-feedback-badge`, `data-ball-path` and `data-football`.
- **Key pill.** Converted (`In` on the Slot WR) shows "Defense · Cover 1 pressure" on phone and desktop. On desktop the "Final · defense revealed" pill sits at the stage's top left with the key pill 8 px below it.
- **Run it back.** Run `click=button:"Run it back" expect-role=radiogroup:Blockers`. The previous protection is still selected.
- **Replay.** Once #67 lands, run `click=button:"Watch the replay again" shot=replay`, then return and `shot=back`. The two result screenshots match.
- **Determinism.** Run the same design twice in separate drives. The `final` screenshots and `aria.yml` files must be identical.

## Gotchas

- CTA labels are uppercase on screen. `click=` and `expect-role=` names match case-insensitively by substring, so `Run it back` works whether the source text is upper or lower case. `expect=` text matching is case-sensitive.
- Interception is a failed rep: cream sheet and a football at the end of the ball path. Only interception draws the football. The interceptor and the receiver finish on the catch point, so their discs cover the football; check `data-football` in the DOM rather than the pixels.
- Which end state you reach depends on the whole design. Record the design steps with the evidence.
- On puzzle 1, with 5-man Man protection, Left WR Post, TE Hitch, Right WR Go, RB Flat and the reads Slot WR then Left WR, the Slot WR's route picks the outcome: Out incomplete (the corner swats it), Hitch short at `+7`, Comeback or Hook sacked, Slant or Post picked off, In converted at `+20`. A throwaway on puzzle 1: 7-man Slide right, Left WR In, Right WR Go, Slot WR Hitch, and Right WR as the only read; its ball path ends past the right sideline. Out of reps takes four failed reps in one drive, for example Out, Hitch, Comeback, Post.
- What play art each rep reveals is under review in #71 (blocked by #34). The engine's `revealedPlayArt` reveals no art before two failed reps, less than the spec draws, and the field label says "with the defense revealed" even when the art is hidden, so recheck the play-art and field-label checks against the spec once #71 lands.
- The phone field shade dims the play art too; desktop shows the field with no shade.
