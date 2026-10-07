# Result

**Status:** Not built (T12). The route path is not decided yet. Report this feature as skipped until the screen exists.

Result shows how the rep ended. The field shows the defense's play art and receiver feedback badges, and a sheet holds the headline, outcome tile, stats, rep boxes and the next action. The sheet is cream when reps remain, ink green when converted, and charcoal when out of reps. Spec: `design/08-result/spec.md`, with the six end states in `design/08-result/states/`.

## Sub-features

- `result-states` means each of the six end states renders its exact headline, tile, stats, rep boxes and CTA from stub simulation data.
- `result-coverage-hidden` means that before the final rep or a conversion, the coverage name appears nowhere: not in visible text and not in any accessible name.
- `result-run-it-back` means "Run it back" opens Protect with the previous design kept.
- `result-pros` means "See how the pros did" (on a converted or final rep) opens the Pros reveal.
- `result-replay` means the replay square opens Replay, which returns here unchanged.

## How to get to it (user POV)

- Let the live play finish after Snap.
- Press Skip during the live play.
- Go "back to Result" from Replay.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`, and the play loop works from Landing through Snap.

- **Reach it.** Design a play, Snap, then `click=button:Skip expect-role=region:"Rep result" shot=result`. Use `complementary` on desktop. Focus is on the sheet heading.
- **Rep boxes.** `aria.yml` has a group named like `Reps: rep 1 no gain, rep 2 next, rep 3 unused, rep 4 unused`.
- **Coverage hidden.** On rep 1 of a failed design, grep `aria.yml` and the transcript for the coverage name (Cover 4 in the fixture). It must be absent, and the field label reads `Rep 1 final frame with the defense revealed: …`.
- **Run it back.** Run `click=button:"Run it back" expect-role=radiogroup:Blockers`. The previous protection is still selected.
- **Replay.** Run `click=button:"Watch the replay again" shot=replay`, then return and `shot=back`. The two result screenshots match.
- **Determinism.** Run the same design twice in separate drives. The `final` screenshots and `aria.yml` files must be identical.

## Gotchas

- CTA labels are uppercase on screen. `click=` and `expect-role=` names match case-insensitively by substring, so `Run it back` works whether the source text is upper or lower case. `expect=` text matching is case-sensitive.
- Interception is a failed rep: cream sheet and a football at the end of the ball path. Only interception draws the football.
- Which end state you reach depends on the design, under the stub simulation and later under the engine. Record the design steps with the evidence.
