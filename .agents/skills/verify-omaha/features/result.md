# Result

**Status:** Live for the sheet and Run it back (#64) and the play art (#65): the field shows every player at the final frame with the revealed defense play art, feedback badges, ball path and, on a converted rep or rep 4, the key pill. #71 builds the reveal by rep (the decisive-defender ring, partial art on rep 2 and the hidden-art field label). The replay square opens Replay (#67, replay.md). "See how the pros did" renders with `aria-disabled="true"` until the Pros reveal lands, so report `result-pros` as skipped. Result is shown on the play screen at `/puzzle/:n`.

Result shows how the rep ended. The field shows the defense's play art and receiver feedback badges, and a sheet holds the headline, outcome tile, stats, rep boxes and the next action. The sheet is cream when reps remain, ink green when converted, and charcoal when out of reps. Spec: `design/08-result/spec.md`, with the seven end states (incomplete, short, sack, interception, throwaway, converted, out of reps) in `design/08-result/states/`.

## Sub-features

- `result-states` means each of the seven end states renders its headline, tile, stats, rep boxes and CTA per the spec's copy rules, with yards from the stub's `Rep` rather than the prototypes' numbers.
- `result-coverage-hidden` means that before the final rep or a conversion, the coverage name appears nowhere: not in visible text and not in any accessible name.
- `result-play-art` means the field draws `revealedPlayArt(rep.playArt, failedReps, puzzleEnded)`: zone ellipses in the Madden colour for their kind (30% fill, 85% stroke), drop, man and rush lines from each defender's track ending 10.5 units short with an arrowhead on man and rush, orange 2.4 px blitz lines for rushers who aren't linemen, a lineman's grey rush line only when he made the sack, and a start dot on every defender with a line. `failedReps` counts every non-converted rep played so far, the rep shown included.
- `result-badges` means each receiver in the rep's `feedback` gets its open (check), contested (wave) or covered (✕) badge up-right of the receiver, flipped up-left at the right sideline or over another player.
- `result-ball` means a thrown ball draws a dashed path from `ball.from` to `ball.to`; only an interception adds the football at `ball.to`; a throwaway's path ends past the sideline; a sack draws no ball.
- `result-key-pill` means "Defense · {coverage}" shows only on a converted rep or rep 4: under the situation pills on phone, and 8 px under the desktop-only "Final · defense revealed" pill at the stage's top left on desktop.
- `result-run-it-back` means "Run it back" opens Protect with the previous design kept.
- `result-pros` means "See how the pros did" (on a converted or final rep) opens the Pros reveal.
- `result-replay` means the replay square opens Replay, which returns here unchanged.

## How to get to it (user POV)

- Tap Snap on Read, then let the live play finish (live-play.md).
- Tap Snap on Read, then press Skip during the live play (or `Esc` on desktop).
- With reduced motion, Snap shows Result straight away.
- Go "back to Result" from Replay.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`, and the play loop works from Landing through Snap.

- **Reach it.** Design a play, then `click=button:Snap click=button:"Skip to result" expect-role=region:"Rep result" shot=result`. Use `complementary` on desktop. Focus is on the sheet heading.
- **Rep boxes.** `aria.yml` has a group named like `Reps: rep 1 no gain, rep 2 next, rep 3 unused, rep 4 unused`.
- **Coverage hidden.** On rep 1 of a failed design, grep `aria.yml` and the transcript for the puzzle's `coverageName` (`Cover 1 pressure` in the Gun Trey stub fixture). It must be absent. The field label reads `Rep N final frame with the defense revealed: <outcome>. <cause>` before the puzzle ends, and `Rep N final frame against Cover 1 pressure: <outcome>. <cause>` on a converted rep or rep 4.
- **Play art.** The stub reveals nothing on rep 1, DL and LB only on rep 2, and everything from rep 3 or once the puzzle ends. To see full art for a cause, play Out, then Out, then X's route for that cause on rep 3, and `shot=` it. Under the stub only the decisive defender moves, so only its line and start dot show; zones show for every revealed zone defender. Elements carry `data-zone`, `data-defense-path` (with `data-path-kind` drop, man, rush or blitz), `data-start-dot`, `data-feedback-badge`, `data-ball-path` and `data-football`.
- **Key pill.** Converted (`Comeback` on X) shows "Defense · Cover 1 pressure" on phone and desktop. On desktop the "Final · defense revealed" pill sits at the stage's top left with the key pill 8 px below it.
- **Run it back.** Run `click=button:"Run it back" expect-role=radiogroup:Blockers`. The previous protection is still selected.
- **Replay.** Run `shot=result click=button:"Watch the replay again" expect-role=slider:"Replay position" shot=replay click=button:"Back to the result" shot=back`. The `result` and `back` screenshots match (replay.md).
- **Determinism.** Run the same design twice in separate drives. The `final` screenshots and `aria.yml` files must be identical.

## Gotchas

- CTA labels are uppercase on screen. `click=` and `expect-role=` names match case-insensitively by substring, so `Run it back` works whether the source text is upper or lower case. `expect=` text matching is case-sensitive.
- Interception is a failed rep: cream sheet and a football at the end of the ball path. Only interception draws the football. In the stub the interceptor and receiver finish on the catch point, so their discs cover the football; check `data-football` in the DOM rather than the pixels.
- Which end state you reach depends on the design, under the stub simulation and later under the engine. Record the design steps with the evidence.
- Under the stub, only X's route picks the outcome: In or Slant sack, Hook throwaway, Out or Corner incomplete, Post or Drag interception, Go short, Comeback converted, Flat touchdown, and any other route falls back to a sack. Out of reps takes four failed reps in one drive.
- What play art each rep reveals is under review in #71 (blocked by #34). The stub's `revealedPlayArt` already returns less art on early reps than the spec draws, and the field label says "with the defense revealed" even when the art is hidden, so recheck the play-art and field-label checks against the spec once #71 lands.
- The phone field shade dims the play art too; desktop shows the field with no shade.
