# Routes

**Status:** Not built (T09). The route path is not decided yet. Report this feature as skipped until the screen exists.

Routes is step 2. The player taps a route-running receiver on the field, picks one of nine routes from a carousel (a 3×3 grid on desktop), and picks a depth of 5, 10 or 15 yards. The selected route draws bold and the others fade. Spec: `design/05-routes/spec.md`.

## Sub-features

- `routes-select-receiver` means tapping a route runner moves the gold ring to it. Kept-in blockers cannot be selected.
- `routes-assign` means picking a card assigns the route, from the nine routes In, Slant, Out, Corner, Post, Go, Curl, Flat and Wheel in that order.
- `routes-depth` means picking `5 yds`, `10 yds` or `15 yds` moves the route's break.
- `routes-next` means "Next: read" is always enabled, even with unassigned runners.

## How to get to it (user POV)

- "Next: routes" on Protect.
- "2 Routes" in the step bar from Protect or Read.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`, and Routes is reachable from Protect.

- **Select receiver.** Tap a receiver on the field by its accessible name, for example `click=button:"Slot WR"` (use the receiver names the screen exposes). Then `shot=selected`. The ring moves to that receiver.
- **Assign and depth.** Run `click=option:Out click=radio:"10 yds" shot=out-10`. `aria.yml` announces the receiver, route and depth.
- **Kept-in.** Set 6-man on Protect earlier in the same drive. The RB is not selectable here and keeps its block line.
- **Next.** Run `click=button:"Next: read" expect-role=radiogroup:"First read"`. This passes even with runners unassigned.
- **Desktop keys.** Run with `--viewport desktop`: `press=3` picks the third route in grid order, `press=ArrowRight` changes the depth, and `press=Enter` opens Read.

## Gotchas

- Routes are drawn from design state, not prototype paths. A 10-yard break sits at field y=238. Judge it in the screenshot against the yard lines, not against the prototype.
- The carousel scrolls horizontally on phone. Routes past the fold need the carousel scrolled or the option clicked by name (Playwright scrolls it into view).
- The slide arrow is not drawn on this screen, but the zigzag and RB block line are.
