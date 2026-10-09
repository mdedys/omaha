# Step 3: Read and snap

## Purpose

Third and last design step. The player picks the QB's first read from the route runners, sees the whole play drawn on the field, and snaps it.

## Prototypes

| File | Shows |
|---|---|
| `prototype.html` | Light theme, phone 390×844. Rep 1, 6-man (RB blocking). Four route runners: Left WR In, TE Corner, Slot WR Out, Right WR Go. **TE** picked as the first read: option checked, gold ring and gold "1" badge on the TE, TE route at 2.4px. Snap enabled. |
| `prototype-dark.html` | Same state in the dark theme. |
| `prototype-desktop.html` | Same state at ≥900px: top bar, field stage, 440px panel with a 20px heading, a vertical list of four 60px read options, Snap with an `Enter` hint and a keyboard hint line. Below 900px it collapses to one column. |
| `prototype-desktop-dark.html` | Same desktop state in the dark theme. |

The disabled Snap button is not prototyped.

## Entry and exit

Entry:
- "Next: read" on Routes (05-routes). Always allowed, even when some route runners have no route.
- Tapping "3 Read" in the step bar from Protect or Routes. Never gated. Intended behavior; not shown in any prototype.

Exit:
- "Snap" starts the live play (07-live-play) for the current rep. Enabled only when the snap unlock rule is met (README: every route runner has a route and a first read is picked).
- Tapping "1 Protect" or "2 Routes" in the step bar returns to that step with the design kept. Never gated. Intended behavior; not shown in any prototype.

## Layout

### Phone (390×844)

Root, header and field as on Protect: flex column, Cream `#F4EFE4` background, Ink Green `#244A3E` text.

1. **Header**, 52px. Same as 04-protect.
2. **Field**, SVG 390×479, `viewBox 0 0 403 495`.
3. **Panel** (`footer`), `flex-grow: 1` (313px), padding `14px 16px 22px`, flex column `space-between`.
   - Top group, flex column, **gap 12px**:
     - Step bar with `margin-bottom: 2px`.
     - Question heading (`h2`): margin 0, 16px, weight 600, Ink Green, sentence case.
     - Read options: grid `repeat(2, minmax(0,1fr))`, gap 8px. Options flow row by row: four runners fill a 2×2 grid.
   - Primary button at the bottom.

Height budget at 390×844: the top group with two rows of options is about 179px, plus the 52px button, out of 277px available, which leaves about 46px. A third row (five route runners, which is what the default 5-man protection gives in this formation) needs 60px more and overflows by about 14px. This case is not designed yet; see Open questions.

### Dark theme (`prototype-dark.html`, `prototype-desktop-dark.html`)

Phone: background Charcoal `#18201C`; text Cream; borders Dark Border `#34403A`; option fill Dark Surface `#232C27`; route names and inactive step labels Dark Muted `#A3B1A9`; done and current step bars Cream; selected option border 2px Cream; check circle Cream with a Charcoal `#18201C` check. Field and primary button unchanged.

Desktop: the same mapping for the 60px options (Dark Surface fill, 1px Dark Border, Dark Muted route names, 2px Cream selected border, Cream check circle with Charcoal check), plus top-bar and panel borders Dark Border; spot and meta Dark Muted; rep pips Dark Border with a Cream ring on the current rep; hint line Dark Muted with `kbd` keys on Dark Surface, 1px Dark Border, Cream text. Links Cream, hover Paper White. Stage, field and Snap button unchanged.

### Desktop (≥900px, `prototype-desktop.html`)

DESIGN.md "Layout › Desktop" and its desktop control variants apply. Same stylesheet as 05-routes desktop, plus the desktop read option.

- **Top bar** 64px: as in 05-routes desktop (`OMAHA`, situation, meta with `#148`, `Down 4 · 1:12`, rep pips with `aria-label="Rep 1 of 4"`).
- **Stage**: Turf Stage `#0C3322`, padding 24px, field `calc(100vh - 112px)` tall, radius 10px. Same field layers as phone.
- **Panel** (`aside aria-label="Design the play"`): 1px Sand Border left, padding 28px, flex column, gap 22px:
  1. Step bar, desktop variant (4px bars, gap 10px, labels `letter-spacing .03em`): Protect and Routes done (Ink Green at 45% opacity), Read current.
  2. Heading (`h2`): margin 0, 20px, weight 700, sentence case.
  3. Read options: vertical list (`role="radiogroup"`, flex column, gap 10px), one full-width option per route runner.
  4. Spacer (`flex-grow: 1`).
  5. Button group (column, gap 10px): Snap with a 20×20 play icon and `kbd` `Enter`, then the hint line.
- **Below 900px:** collapses as in 05-routes (one column, field full width, panel padding 16px, no left border; spot, puzzle number, hint line and button `kbd` hidden).

## Content and copy

| Element | String | Source |
|---|---|---|
| Header | `3rd & 10`, `own 45`, `Down 4 · 1:12` | Puzzle data |
| Rep dots label | `Rep 1 of 4` | Rep index |
| Step labels | `1 Protect`, `2 Routes`, `3 Read` | Static |
| Heading | `Who does the QB look to first?` | Static |
| Option names | `Left WR`, `TE`, `Slot WR`, `Right WR` (and `RB` when the RB runs a route) | Formation data |
| Option route names | `In`, `Corner`, `Out`, `Go` (sentence case; route name only, no depth) | Design state |
| Primary button | `Snap` (rendered uppercase), with a play icon before it | Static |
| Desktop button hint | `Enter` (in a `kbd`) | Static |
| Desktop hint line | `1`–`4` pick the first read (each key in a `kbd`; en dash) | Static; the upper number matches the number of route runners in this prototype |
| Desktop puzzle number | `#148` | Puzzle data |
| Read badge | `1` | Static |
| Radio group label | `First read` | Static |
| Field `aria-label` (example) | `Field: full play drawn, tight end marked as the first read` | Built from design state |

## Components

- **Step bar** (DESIGN.md "Step bar"): Protect and Routes done (Ink Green bars, Sage Muted labels), Read current (Ink Green bar and label). Desktop uses the 4px variant with done bars at 45% opacity.
- **Read option** (DESIGN.md "Read option", `read-option`): 52px tall, `box-sizing: border-box`, radius 12px, 1px Sand Border `#DCD3C1`, Paper White, flex row centered, gap 10px, padding `0 12px`, left-aligned text.
  - Swatch: SVG 14×14, `circle cx=7 cy=7 r=5.5`, fill `#0E2219`, stroke = the player color of the receiver's letter (ring color, not route tint: Y `#8E73F2`, H `#F0607A`), width 2, `aria-hidden`.
  - Text column (`flex-grow: 1`, gap 3px): name 14px 600, `line-height 1`; route name 12px Sage Muted (no weight set; renders 500), `line-height 1`.
  - Selected: 2px Ink Green border, padding `0 11px`, and a check at the right end: SVG 20×20, `circle r=9` Ink Green, check path `M6 10.2L8.8 13L14 7.6` in Cream, width 2, round caps and joins, `aria-hidden`.
  - Desktop variant: full width, 60px tall, radius 12px, 1px Sand Border, gap 12px, padding `0 16px`; swatch 16×16 (same 14-unit viewBox); text column gap 4px, name 16px 700, route name 13px Sage Muted; check 22×22. Selected: 2px Ink Green border, padding `0 15px`.
- **Primary button** (`button-primary`): 52px, radius 14px, Snap Orange `#E05A2B`, white, Figtree 900 19px uppercase (DESIGN.md `typography.button`; the phone prototypes still show 17px, follow DESIGN.md), `letter-spacing .01em`, flex centered with gap 8px. Icon: SVG 18×18, `viewBox 0 0 24 24`, `fill: currentColor`, path `M7 4.5v15l12-7.5z`, `aria-hidden`. Desktop variant: 58px, radius 10px, gap 12px, 20×20 icon, `kbd` `Enter` (700 11px, padding `3px 7px`, radius 5px, `rgba(255,255,255,.22)`).
- **Desktop hint line**: 12px 600 Sage Muted, centered; `kbd`s Paper White, 1px Sand Border, Ink Green, 700 11px, padding `3px 7px`, radius 5px.
- **Disabled primary button** (not prototyped; defined here from DESIGN.md tokens): same size, radius, type and icon. Light: background Sand Border `#DCD3C1`, text and icon Sage Muted `#5A6B62` (3.8:1). Dark: background Dark Border `#34403A`, text and icon Dark Muted `#A3B1A9` (4.8:1). No hover change. Applies to the desktop variant too.
- **Field** layers in paint order:
  1. Field base (as on Protect).
  2. Defenders at pre-snap positions.
  3. Routes group (no fill, width 2, round caps and joins, **full opacity**): every assigned route in its route color, drawn from the design state at its depth (10 yds breaks at y=238; arrowheads about 9 units at ±40°, DESIGN.md "Field glyphs › Routes"). The first read's route is width 2.4. The RB block line (`#5BDB8C`, 2) is drawn when the RB is kept in.
  4. Protection zigzag (`#06100B`, 1.5). No slide arrow.
  5. Linemen.
  6. **Read ring**: `circle r=14`, no fill, Read Gold `#F4B13E`, width 1.6, centered on the read receiver, drawn under the player glyphs.
  7. Receivers and QB.
  8. **Read badge**: group at the receiver center offset by (+13, −13) units (TE at 265,367 → badge at 278,354): `circle r=6.5` Read Gold, text `1` at `y=2.4`, font-size 8, weight 700, `text-anchor: middle`, fill `#0A1410`.

## States

| State | Description |
|---|---|
| **Read picked** (prototyped) | One option checked; gold ring, "1" badge and 2.4px route on that receiver; Snap enabled. |
| **No read picked** | Not prototyped. All options unchecked (1px Sand Border, no check). No gold ring, no badge; every route at 2px. Snap disabled. |
| **Snap disabled** | Not prototyped. Disabled primary button (above), `aria-disabled="true"`, stays focusable, does nothing when activated. Shown whenever the snap unlock rule is not met. |
| **Route runner without a route** | Possible, because moving between steps is never gated. Not prototyped. No route is drawn for that receiver and Snap stays disabled. What its option shows in place of the route name, and whether it can be picked as the read, are open. |
| **Snap enabled** | Snap Orange; hover/pressed Snap Orange Deep `#C94B20`. |
| **Three route runners** (7-man) | Not prototyped. Two options in row 1, one in row 2 (left column). |
| **Five route runners** (5-man, the default) | Not designed. With the prototype's grid it would be two, two, one, which overflows the phone panel by about 14px (Open questions). |
| **Carried-over design** (rep 2+) | The previous read is checked if that receiver still runs a route. |
| **Dark** | Per Layout › Dark theme. |

## Interactions

- **Tap a read option**: checks it and unchecks the others; moves the gold ring and badge on the field; sets that route to 2.4px and the previous read's route back to 2px; enables Snap if the unlock rule is now met.
- Radio group keyboard: Tab enters on the checked option (or the first one); arrow keys move and select.
- **Tap Snap** (enabled): locks the design for this rep and starts the live play.
- **Tap "1 Protect" / "2 Routes"** in the step bar: return to that step. Never blocked.
- **Desktop keyboard** (proposal; shown in the hint line and button): `1`–`4` pick the first read in list order; `Enter` Snap (only when enabled).
- **Focus order**: step bar (Protect, Routes) → read options in reading order → Snap.

## Motion

None on this screen. The live play that follows is specified in 07-live-play.

## Accessibility

- Field SVG: `role="img"` with an `aria-label` that names the first read (example in Content and copy).
- Read options: container `role="radiogroup"` with `aria-label="First read"`; each option `role="radio"` with `aria-checked`; swatch and check `aria-hidden`. The accessible name includes name and route (for example "TE, Corner").
- The selected state is shown by the border width and a check, not by color alone. On the field the read is shown by the ring plus the "1" badge.
- Gold on turf: 6.7:1. `#0A1410` text on the Read Gold badge: about 10:1.
- Touch targets (DESIGN.md "Layout › Touch targets"): options 52px tall (desktop 60px), wider than 44px.
- Disabled Snap uses `aria-disabled="true"` so screen-reader users can still reach it.
- White on Snap Orange is 3.7:1; the 19px 900 label counts as large text and passes AA.
- Desktop: `aside` has `aria-label="Design the play"`; hint `kbd`s are hidden below 900px.

## Data

- **Puzzle JSON:** header values; formation (receiver letter and display name per eligible receiver; the letter picks the player color); defense pre-snap alignment.
- **Design state:** `blockers`, `lineCall` (decide the route runners and whether the RB block line is drawn); `routes` (route and depth per runner, for drawing and for option route names); `firstRead`: a receiver id that must be a current route runner, or `null`. Kept between reps.
- **Derived:** `canSnap` = every route runner has a route AND `firstRead` is a current route runner.
- **On Snap:** the full design (`blockers`, `lineCall`, `routes`, `firstRead`) and the rep index go to the simulation.

## Open questions

- **Read progression.** The game-engine session leans toward the player setting a 1-2-3 read order on this step. If adopted, this screen (options, badges, unlock rule) changes. Not designed here.
- **Five route runners on phone (not designed).** The default 5-man protection gives five route runners in this formation. The two-column grid then needs a third row and overflows by about 14px at 390×844. The layout for this case is an open design question.
- **Option order.** The prototype lists runners left to right by field position (Left WR, TE, Slot WR, Right WR). Where the RB goes when it runs a route is not shown.
- What happens to the read when the player goes back and keeps the read receiver in to block.
- Whether the read can also be picked by tapping a receiver on the field.
- Whether the disabled Snap explains what is missing, for example unassigned routes (no copy is prototyped).
- What a route runner without a route shows in its option, and whether it can be picked as the read.
- Desktop keyboard: the digit range and hint text when there are three or five route runners; what `Enter` does while Snap is disabled; how digits and `Enter` interact with focus inside the radio group.

## Acceptance criteria

- [ ] At 390×844 the layout matches `prototype.html`: 52px header, 390×479 field, panel padding 14/16/22, top-group gap 12px.
- [ ] Heading reads `Who does the QB look to first?` (16px, 600).
- [ ] One read option per current route runner (kept-in blockers are excluded), in a two-column grid with 8px gaps, each 52px with a swatch in the player color, the name, and the route name from the design state.
- [ ] Selecting an option gives it a 2px Ink Green border and the 20px check, and unchecks the others.
- [ ] The field draws every route at full opacity; the read's route is 2.4px, the others 2px.
- [ ] The read receiver has a Read Gold ring (r=14, 1.6) and a gold "1" badge at (+13, −13) units.
- [ ] With no read picked, no ring or badge is drawn and Snap shows the disabled style (Sand Border fill, Sage Muted text and icon; dark: `#34403A` / `#A3B1A9`) with `aria-disabled="true"`, and activating it does nothing.
- [ ] Snap is enabled only when every route runner has a route and a first read is picked; then it is Snap Orange with the play icon, 19px 900 uppercase, and opens the live play.
- [ ] Read opens from Next: read or the step bar even when some route runners have no route; Snap stays disabled in that case.
- [ ] Routes are drawn from the design state at their depth (the Slot WR 10-yd Out breaks at y=238).
- [ ] Desktop (≥900px) matches `prototype-desktop.html`: 4px step bars, 20px 700 heading, vertical list of 60px read options with 10px gaps, 58px Snap with `Enter`, hint line `1–4 pick the first read`.
- [ ] On desktop (proposed shortcuts), digit keys pick the read in list order and `Enter` triggers Snap when it is enabled.
- [ ] Below 900px the desktop layout collapses to one column and hides the hints, the spot and the puzzle number.
- [ ] A carried-over read stays checked on rep 2+ if that receiver still runs a route.
- [ ] Options are a keyboard-operable radio group named "First read".
- [ ] Dark theme matches `prototype-dark.html` and `prototype-desktop-dark.html` (Cream selected border, Cream check circle with Charcoal check); the field is identical between themes.
