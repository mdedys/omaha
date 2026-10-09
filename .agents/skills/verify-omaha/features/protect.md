# Protect

**Status:** Not built. #61 builds the play screen at `/puzzle/:n`, which opens on Protect with a placeholder panel; #62 adds Protect's controls. Report this feature as skipped until the controls exist.

Protect is step 1 of the play design. The player picks how many blockers stay in (5-, 6- or 7-man) and the line call (Slide left, Man, Slide right), and the field redraws the protection art. Spec: `design/04-protect/spec.md`.

## Sub-features

- `protect-defaults` means a new puzzle opens on `5-man` and `Man`.
- `protect-blockers` means 6-man keeps the RB in and draws its block line. 7-man also keeps the TE (Y) in. The control offers exactly the counts `protections(puzzle)` returns, so 7-man is hidden when the formation has no attached TE.
- `protect-line-call` means Slide left and Slide right draw the slide arrow, and the RB block line takes the opposite edge.
- `protect-next` means "Next: routes" always opens Routes, and the step bar opens any step without gating.
- `protect-carry-over` means Run it back reopens Protect with the previous rep's blockers and line call. #64 delivers it, and the puzzle session is in memory, so a reload restarts at rep 1.

## How to get to it (user POV)

- "Play today's puzzle" on Landing.
- A puzzle card in Puzzles.
- Tutorial step 3's CTA or its Skip link.
- "Run it back" on Result while reps remain.
- "1 Protect" in the step bar from Routes or Read.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`, and Protect is reachable from Landing.

- **Defaults.** Enter from Landing. `aria.yml` shows `radiogroup "Blockers"` with `5-man` checked and `radiogroup "Line call"` with `Man` checked.
- **6-man, slide left.** Run `click=radio:6-man click=radio:"Slide left" expect="Line + RB stay in" expect="RB takes the right edge" shot=six-slide-left`. The field `img` aria-label changes from the default and names six-man protection sliding left.
- **Keyboard (desktop).** Run with `--viewport desktop` and `press=6 press=ArrowLeft`. The result matches the clicks. Then `press=Enter` opens Routes. The desktop keys are an open question in the spec, so check the keys #62 settles before asserting these.
- **Next.** Run `click=button:"Next: routes" expect-role=listbox` to open Routes.
- **Carry-over.** Play a full rep in one drive, then `click=button:"Run it back"`. Blockers and Line call show the previous rep's picks. There is no storage key to check until #57 lands.

## Gotchas

- Both slide options show the text "Slide". Drive them by accessible name (`Slide left` or `Slide right`). If the name is only "Slide", that is an accessibility bug to report.
- The field must be pixel-identical in light and dark. Compare the field area of the two screenshots, not the whole page.
- Whether 7-man renders depends on `protections(puzzle)`, not on the puzzle JSON. The stub engine always returns 5, 6 and 7, and Gun Trey's Y is attached, so 7-man renders under the stub.
