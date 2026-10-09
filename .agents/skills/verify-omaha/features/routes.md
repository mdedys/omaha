# Routes

**Status:** Not built (#63). Routes is a step of the play screen at `/puzzle/:n`, which shows a placeholder panel for it until #63 lands. Report this feature as skipped until the screen exists.

Routes is step 2. The player taps a route-running receiver on the field, which moves a gold ring to it. They then pick a card from that receiver's route menu (WR 11 cards, Inside 12, RB 6, all in route-tree order) and, for routes that take one, a depth of 5, 10 or 15 yards. Phone shows the menu as a carousel; desktop shows a 4-column grid with key tags. The selected route draws bold and the others fade. Spec: `design/05-routes/spec.md`.

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

- **Select receiver.** Tap a receiver on the field by its accessible name, for example `click=button:"Slot WR"`, then `expect-role=listbox:"Routes for the slot receiver" shot=selected`. The ring moves to that receiver.
- **Assign and depth.** Run `click=option:Out expect-role=radiogroup:"Out route depth" click=radio:"10 yds" shot=out-10`. `aria.yml` shows the option selected, the radio checked, and the receiver's button named like `Slot WR, Out, 10 yards`.
- **Dimmed depth.** Run `click=option:Corner`. In `aria.yml`, the `5 yds` radio carries `aria-disabled`.
- **No depth.** Run `click=option:Slant expect="No depth for the slant"`. No depth radiogroup is present.
- **Kept-in.** Set 6-man on Protect earlier in the same drive. The RB is not selectable here and keeps its block line. Switching to a protection that keeps a receiver in removes that receiver's route.
- **Next.** Run `click=button:"Next: read" expect-role=group:"Read order"`. This passes even with runners unassigned.
- **Desktop keys.** Run with `--viewport desktop`. Keys are route-tree keys (`0`–`9`, `D`, `W`), not grid positions, and a key outside the menu does nothing: `press=5` picks Out. `press=ArrowRight` changes the depth, skipping unavailable ones, and `press=Enter` opens Read. The hint line reads `0–9 D W pick a route · ← → depth`.

## Gotchas

- Receivers are named by the engine's `displayName`, which follows the formation flip: X is "Left WR" unflipped and "Right WR" flipped. Read the names from `aria.yml` instead of assuming a side.
- Assert the menu order against the spec's route-tree table, not against the stub's `routeMenu`. The stub's menus in `src/engine/stub/catalog.ts` are not in route-tree order.
- Routes are drawn from design state, not prototype paths. The break sits at y = 366 − depth × 12.8, so a 10-yard break is at field y=238. Judge it in the screenshot against the yard lines, not against the prototype.
- The carousel holds only the selected receiver's menu and scrolls horizontally on phone. Cards past the fold need the carousel scrolled or the option clicked by name (Playwright scrolls it into view).
- The slide arrow is not drawn on this screen, but the zigzag and RB block line are.
- The initial selection, empty states, clearing a route and the keyboard are open questions in the spec that #63 settles. Recheck the recipe against the spec once it lands.
