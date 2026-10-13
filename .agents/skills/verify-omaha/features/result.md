# Result

**Status:** Live for the sheet and Run it back (#64): the field shows every player at the final frame, with no play art, badges, ball path or key pill yet (#65), and #71 builds the reveal by rep. The replay square and "See how the pros did" render with `aria-disabled="true"` until Replay (#67) and the Pros reveal land, so report `result-pros` and `result-replay` as skipped. Result is shown on the play screen at `/puzzle/:n`.

Result shows how the rep ended. The field shows the defense's play art and receiver feedback badges, and a sheet holds the headline, outcome tile, stats, rep boxes and the next action. The sheet is cream when reps remain, ink green when converted, and charcoal when out of reps. Spec: `design/08-result/spec.md`, with the seven end states (incomplete, short, sack, interception, throwaway, converted, out of reps) in `design/08-result/states/`.

## Sub-features

- `result-states` means each of the seven end states renders its headline, tile, stats, rep boxes and CTA per the spec's copy rules, with yards from the engine's `Rep` rather than the prototypes' numbers.
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
- **Coverage hidden.** On rep 1 of a failed design, grep `aria.yml` and the transcript for the puzzle's `coverageName` (`Cover 1 pressure` in puzzle 1). It must be absent. Until #65 the field label reads `Rep 1 final frame: …`; with the play art it becomes `Rep 1 final frame with the defense revealed: …`.
- **Run it back.** Run `click=button:"Run it back" expect-role=radiogroup:Blockers`. The previous protection is still selected.
- **Replay.** Once #67 lands, run `click=button:"Watch the replay again" shot=replay`, then return and `shot=back`. The two result screenshots match.
- **Determinism.** Run the same design twice in separate drives. The `final` screenshots and `aria.yml` files must be identical.

## Gotchas

- CTA labels are uppercase on screen. `click=` and `expect-role=` names match case-insensitively by substring, so `Run it back` works whether the source text is upper or lower case. `expect=` text matching is case-sensitive.
- Interception is a failed rep: cream sheet and a football at the end of the ball path. Only interception draws the football.
- Which end state you reach depends on the whole design. Record the design steps with the evidence.
- On puzzle 1, with 5-man Man protection, Left WR Post, TE Hitch, Right WR Go, RB Flat and the reads Slot WR then Left WR, the Slot WR's route picks the outcome: Out incomplete (the corner swats it), Hitch short at `+7`, Comeback or Hook sacked, Slant or Post picked off, In converted at `+20`. A throwaway on puzzle 1: 7-man Slide right, Left WR In, Right WR Go, Slot WR Hitch, and Right WR as the only read. Out of reps takes four failed reps in one drive, for example Out, Hitch, Comeback, Post.
- What play art each rep reveals is under review in #71 (blocked by #34). The engine's `revealedPlayArt` reveals no art before two failed reps, less than the spec draws, so recheck the play-art and field-label checks against the spec once #71 lands.
