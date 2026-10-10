# Protect

**Status:** Live. Numbered puzzles open on Protect with engine-backed blocker availability and protection artwork. Routes/Read are navigable placeholders until their pieces land.

Protect is step 1 of the play design. The player picks how many blockers stay in (5-, 6- or 7-man) and the line call (Slide left, Man, Slide right), and the field redraws the protection art. Spec: `design/04-protect/spec.md`.

## Sub-features

- `protect-defaults` means a new puzzle opens on `5-man` and `Man`.
- `protect-blockers` means the offered counts exactly match `protections(puzzle)`, each equally wide: Gun Empty offers only 5, split TE formations 5/6, attached TE formations 5/6/7. Blocking RB/TE marks appear at their actual pre-snap positions.
- `protect-line-call` means slides draw a directional line arrow and the blocking RB takes the opposite edge; Man draws upside-down T marks without arrows. In 7-man, Y follows the line's artwork. No zigzag is drawn.
- `protect-next` means "Next: routes" always opens Routes, and the step bar opens any step without gating.
- `protect-keyboard` means checked-only radio Tab stops and local wrapping arrow navigation. At ≥900px offered numeric keys and ←/M/→ select; Enter advances unless a native button/link has focus. Focus order includes Protect, Routes and Read before the groups and Next.
- `protect-carry-over` means Run it back reopens Protect with the previous rep's blockers and line call. #64 delivers it, and the puzzle session is in memory, so a reload restarts at rep 1.

## How to get to it (user POV)

- "Play today's puzzle" on Landing.
- Numbered puzzle links (`/puzzle/1` and `/puzzle/2`) for both shipped fixtures.
- The today card and Earlier rows on `/puzzles`.
- "Run it back" on Result, and Skip or "Play today's puzzle" in the Tutorial.
- "1 Protect" in the step bar from Routes or Read.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`, and Protect is reachable from Landing.

- **Defaults.** Enter from Landing. `aria.yml` shows `radiogroup "Blockers"` with `5-man` checked and `radiogroup "Line call"` with `Man` checked.
- **6-man, slide left.** Run `click=radio:6-man click=radio:"Slide left" expect="Line + RB stay in" expect="RB takes the right edge" shot=six-slide-left`. The field accessible name describes 6-man protection and the opposite edge. Then select Slide right and Man; inspect directional arrows / opposite edge / upside-down T marks.
- **7-man.** Run `click=radio:7-man click=radio:Man shot=seven-man`. Y uses the line's upside-down T artwork; repeat with both slides to inspect its directional arrow.
- **Keyboard (desktop).** With no button focused, `press=6 press=ArrowLeft` matches clicks; `press=Enter` opens Routes. If a radio has focus, arrows instead move/select within that group. If a step button has focus, Enter activates that step. Also inspect 899/900px boundary and unavailable numeric counts via browser tests.
- **Next.** Run `click=button:"Next: routes" expect-role=heading:Routes`; the Routes placeholder visibly reports the retained draft. Return via `click=button:"1 Protect"` and inspect checked choices.
- **Focus.** Tab order: Protect, Routes, Read, checked Blockers, checked Line call, Next. Arrow navigation wraps inside each group, including at desktop sizes.
- **Carry-over.** Run it back is still owned by #64; do not claim it is implemented here. Reload resets the in-memory draft.

## Gotchas

- Both slide options show the text "Slide". Drive them by accessible name (`Slide left` or `Slide right`). If the name is only "Slide", that is an accessibility bug to report.
- The field must be pixel-identical in light and dark. Compare the field area of the two screenshots, not the whole page.
- The shipped v1 fixtures both have attached Y and offer 5/6/7. Browser tests load all seven real formation input forms (both flips) through the numbered JSON transport to cover 5-only and 5/6 availability. No unavailable choice is rendered.
