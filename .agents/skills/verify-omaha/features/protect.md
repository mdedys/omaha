# Protect

**Status:** Not built (T08). The route path is not decided yet. Report this feature as skipped until the screen exists.

Protect is step 1 of the play design. The player picks how many blockers stay in (5-, 6- or 7-man) and the line call (Slide left, Man, Slide right), and the field redraws the protection art. Spec: `design/04-protect/spec.md`.

## Sub-features

- `protect-defaults` means a new puzzle opens on `5-man` and `Man`.
- `protect-blockers` means 6-man keeps the RB in and draws its block line. 7-man also keeps the TE, and is hidden when the formation has no TE or the TE is split out.
- `protect-line-call` means Slide left and Slide right draw the slide arrow, and the RB block line takes the opposite edge.
- `protect-next` means "Next: routes" always opens Routes, and the step bar opens any step without gating.
- `protect-carry-over` means Run it back reopens Protect with the previous rep's blockers and line call.

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
- **Keyboard (desktop).** Run with `--viewport desktop` and `press=6 press=ArrowLeft`. The result matches the clicks. Then `press=Enter` opens Routes.
- **Next.** Run `click=button:"Next: routes" expect-role=listbox` to open Routes.
- **Carry-over.** Play a full rep in one drive, then `click=button:"Run it back"`. Blockers and Line call show the previous rep's picks, and a `storage=` step shows the design key holds them.

## Gotchas

- Both slide options show the text "Slide". Drive them by accessible name (`Slide left` or `Slide right`). If the name is only "Slide", that is an accessibility bug to report.
- The field must be pixel-identical in light and dark. Compare the field area of the two screenshots, not the whole page.
- Whether 7-man renders depends on the fixture's formation, so check the fixture before asserting it is absent.
