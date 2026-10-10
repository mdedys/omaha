# Routes

**Status:** Live (#63). Read controls remain outside this feature.

Routes is step 2. Tap an eligible field receiver, pick a card from its ordered WR/Inside/RB menu, then pick an available depth. Phone has a carousel and gold selection ring only; desktop has a name row and four-column grid without shortcut tags/hints. Selected routes are bold; other assigned routes fade. Spec: `design/05-routes/spec.md`.

## Sub-features

- `routes-select-receiver` means tapping a route runner moves the gold ring to it. Kept-in blockers cannot be selected and keep their block line: the RB at 6-man, the RB and TE at 7-man.
- `routes-assign` means picking a card assigns the route. Every menu follows the route-tree order: Hitch, Flat, Slant, Comeback, Hook, Out, In, Corner, Post, Go (WR) or Seam (Inside, RB), Drag, Wheel. WR has everything but Wheel; Inside has all 12; RB has Flat, Hook, Out, In, Seam and Wheel.
- `routes-depth` means picking `5 yds`, `10 yds` or `15 yds` moves the route's break. Depths missing from `availableDepths` are dimmed and inert: Corner, Post and Comeback have no 5, and near the goal line deeper depths drop out.
- `routes-no-depth` means Slant, Drag, Hitch, Go/Seam, Flat and Wheel show the note `No depth for the <route>` (for example `No depth for the slant`) in place of the depth control.
- `routes-next` means "Next: read" is always enabled, even with unassigned runners.

## How to get to it (user POV)

- "Next: routes" on Protect.
- "2 Routes" in the step bar from Protect or Read.

## Driving it with drive.mjs

Preconditions:

- `doctor.sh` exits `0`, and Routes is reachable from Protect.

- **Select receiver.** `click=button:"Slot WR, no route" expect-role=listbox:"Routes for Slot WR" shot=selected`. The gold ring moves. On first entry the leftmost eligible receiver is selected, including flip.
- **Assign and depth.** Run `click=option:Out expect-role=radiogroup:"Out route depth" click=radio:"10 yds" shot=out-10`. `aria.yml` shows the option selected, the radio checked, and the receiver's button named like `Slot WR, Out, 10 yards`.
- **Dimmed depth.** Run `click=option:Corner`. In `aria.yml`, the `5 yds` radio carries `aria-disabled`.
- **No depth.** Run `click=option:Slant expect="No depth for the slant"`. No depth radiogroup is present.
- **Kept-in.** Set 6-man on Protect earlier in the same drive. The RB is not selectable here and keeps its block line. Switching to a protection that keeps a receiver in removes that receiver's route.
- **Next.** `click=button:"Next: read" expect-role=heading:Read`. The Read placeholder is the current destination, even with unassigned Routes.
- **Baseline accessibility.** Focus a field receiver and activate with Enter/Space; route listbox arrows/Home/End select locally; depth arrows skip disabled choices. No global shortcuts, tags or hints.
- **Preservation.** Assign a route, open Read, return using `click=button:"2 Routes"`; the same receiver/card/depth remain selected. Retap does not deselect; assigning a route does not advance.

## Gotchas

- Receivers are named by the engine's `displayName`, which follows the formation flip: X is "Left WR" unflipped and "Right WR" flipped. Read the names from `aria.yml` instead of assuming a side.
- Assert the menu order against the spec's route-tree table, not against whatever `routeMenu` returns, so a wrong engine order shows up as a failure.
- Routes are drawn from design state, not prototype paths. The break sits at y = 366 − depth × 12.8, so a 10-yard break is at field y=238. Judge it in the screenshot against the yard lines, not against the prototype.
- The carousel holds only the selected receiver's menu and scrolls horizontally on phone. Cards past the fold need the carousel scrolled or the option clicked by name (Playwright scrolls it into view).
- Neither slide arrow nor protection zigzag is drawn on Routes. Approved Man T marks and kept-in blocking artwork remain.
- Unassigned receiver depth area says `Choose a route to set its depth.` No routes are auto-assigned or clearable. Complete valid runner assignments pass the stub's simulation design check when supplied a valid read order; Read editing is not built here.
