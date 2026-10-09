# Result

**Status:** Not built. #64 builds the sheet and Run it back, #65 the play art, and #71 the reveal by rep. Result is shown on the play screen at `/puzzle/:n`. Report this feature as skipped until the screen exists.

Result shows how the rep ended. The field shows the defense's play art and receiver feedback badges, and a sheet holds the headline, outcome tile, stats, rep boxes and the next action. The sheet is cream when reps remain, ink green when converted, and charcoal when out of reps. Spec: `design/08-result/spec.md`, with the seven end states (incomplete, short, sack, interception, throwaway, converted, out of reps) in `design/08-result/states/`.

## Sub-features

- `result-states` means each of the seven end states renders its headline, tile, stats, rep boxes and CTA per the spec's copy rules, with yards from the stub's `Rep` rather than the prototypes' numbers.
- `result-coverage-hidden` means that before the final rep or a conversion, the coverage name appears nowhere: not in visible text and not in any accessible name.
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
- **Coverage hidden.** On rep 1 of a failed design, grep `aria.yml` and the transcript for the puzzle's `coverageName` (`Cover 1 pressure` in the Gun Trey stub fixture). It must be absent, and the field label reads `Rep 1 final frame with the defense revealed: …`.
- **Run it back.** Run `click=button:"Run it back" expect-role=radiogroup:Blockers`. The previous protection is still selected.
- **Replay.** Run `click=button:"Watch the replay again" shot=replay`, then return and `shot=back`. The two result screenshots match.
- **Determinism.** Run the same design twice in separate drives. The `final` screenshots and `aria.yml` files must be identical.

## Gotchas

- CTA labels are uppercase on screen. `click=` and `expect-role=` names match case-insensitively by substring, so `Run it back` works whether the source text is upper or lower case. `expect=` text matching is case-sensitive.
- Interception is a failed rep: cream sheet and a football at the end of the ball path. Only interception draws the football.
- Which end state you reach depends on the design, under the stub simulation and later under the engine. Record the design steps with the evidence.
- Under the stub, only X's route picks the outcome: In or Slant sack, Hook throwaway, Out or Corner incomplete, Post or Drag interception, Go short, Comeback converted, Flat touchdown, and any other route falls back to a sack. Out of reps takes four failed reps in one drive.
- What play art each rep reveals is under review in #71 (blocked by #34). The stub's `revealedPlayArt` already returns less art on early reps than the spec draws, so recheck the play-art and field-label checks against the spec once #71 lands.
