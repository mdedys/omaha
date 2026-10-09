# Step 2: Routes

## Purpose

Second design step. The player gives every route runner a route from the route tree and a depth. They tap a receiver on the field to select it, pick a route card, and pick 5, 10 or 15 yards. Receivers kept in to block by the Protect step cannot be selected.

## Prototypes

| File | Shows |
|---|---|
| `prototype.html` | Light theme, phone 390×844. Rep 1, 6-man protection (RB blocking). Slot WR selected (gold ring) with **Out** at **10 yds**. Other routes already assigned: Left WR In, TE Corner, Right WR Go, drawn at 45% opacity. Carousel shows five cards: In, Slant, Out (selected), Corner, Go. |
| `prototype-dark.html` | Same state in the dark theme. |
| `prototype-desktop.html` | Same state at ≥900px: top bar, field stage, 440px panel with a "Slot WR" label row, all nine route cards in a 3×3 grid, a depth control, the button with an `Enter` hint, and a keyboard hint line. Below 900px it collapses to one column. |
| `prototype-desktop-dark.html` | Same desktop state in the dark theme. |

## Entry and exit

Entry:
- "Next: routes" on Protect (04-protect).
- Tapping "2 Routes" in the step bar from Read. Intended behavior; not shown in any prototype.

Exit:
- "Next: read" opens Step 3: Read (06-read). Always enabled, even when some route runners have no route; only Snap is gated (README Snap unlock).
- Tapping "1 Protect" or "3 Read" in the step bar opens that step with the design kept. Never gated. Intended behavior; not shown in any prototype.

## Layout

### Phone (390×844)

Root, header and field as on Protect: flex column, Cream `#F4EFE4` background, Ink Green `#244A3E` text, 52px header, 390×479 field (`viewBox 0 0 403 495`).

1. **Header**, 52px. Same as 04-protect: Title-type down and distance, 13px 800 Sage Muted spot, 13px Sage Muted score and clock (renders 500), four 8px rep dots (current ringed 2px Ink Green, future Sand Border, used Sage Muted).
2. **Field**, 390×479.
3. **Panel** (`footer`), `flex-grow: 1` (313px), padding `14px 16px 22px`, flex column `space-between`.
   - Top group, flex column, gap 16px:
     - Step bar with `margin-bottom: 2px`.
     - Route card carousel: wrapper `margin: 0 -16px; overflow: hidden` (full 390px bleed). Inner strip: flex row, gap 10px. The prototype offsets the strip by `margin-left: -55px`, which centers the selected card (Out) at x=195. The first and last visible cards are cut off by the screen edges.
     - Depth segmented control.
   - Primary button at the bottom.

### Desktop (≥900px, `prototype-desktop.html`)

DESIGN.md "Layout › Desktop" and its desktop control variants (58px button, 4px step bars, 3×3 route cards with a filled label band) apply.

- **Top bar** 64px, padding `0 28px`, 1px Sand Border bottom, flex `space-between`, gap 16px:
  - `OMAHA` wordmark: 24px 900, `letter-spacing .02em`.
  - Situation: `3rd & 10` 20px 900 uppercase, then `own 45` 14px 800 uppercase Sage Muted, baseline-aligned, gap 10px.
  - Meta (14px 600 Sage Muted, tabular numerals, gap 14px): puzzle number `#148`, `Down 4 · 1:12`, rep pips (9×9px, radius 5px, gap 5px; current: transparent with 2px Ink Green border; future: Sand Border).
- **Body**: grid `minmax(0,1fr) 440px`.
  - **Stage**: background Turf Stage `#0C3322`, padding 24px, field centered. Field height `calc(100vh - 112px)`, width auto, `max-width: 100%`, radius 10px.
  - **Panel** (`aside aria-label="Design the play"`): 1px Sand Border on the left, padding 28px, flex column, gap 22px:
    1. Step bar, desktop variant: gap 10px; bars 4px, radius 2px; labels 12px 800 uppercase, `letter-spacing .03em`, column gap 8px. Done bar Ink Green at 45% opacity; current bar Ink Green, current label Ink Green; inactive bar Sand Border, label Sage Muted.
    2. Receiver label row: flex `space-between`, centered. Left: selected receiver name, 13px 800 uppercase, `letter-spacing .04em`. Right: helper in 13px 700 Sage Muted, sentence case, no letter-spacing.
    3. Route grid: `repeat(3, minmax(0,1fr))`, gap 10px, all nine cards.
    4. Depth group: column, gap 10px. Label `Depth` (same style as the receiver label), then the depth control with 42px options.
    5. Spacer (`flex-grow: 1`).
    6. Button group: column, gap 10px. Primary button, then the hint line.
- **Below 900px:** one column; stage padding 0; field `width: 100%`, `height: auto`, radius 0; panel padding 16px, no left border; top bar padding `0 16px`; spot and puzzle number hidden; keyboard hints (hint line and the `kbd` in the button) hidden.

### Dark theme (`prototype-dark.html`, `prototype-desktop-dark.html`)

Phone: background Charcoal `#18201C`; text Cream. Header border, inactive step bars, card and track borders: Dark Border `#34403A`. Card and track fill: Dark Surface `#232C27`. Muted text and unselected options: Dark Muted `#A3B1A9`. Done and current step bars Cream; current step label Cream. Selected card border: 2px Cream. Selected depth option: Cream fill, Charcoal text. Field, mini-diagram turf and primary button unchanged.

Desktop: the same mapping, plus top-bar and panel borders Dark Border; spot, meta and the label-row helper Dark Muted; rep pips Dark Border with a Cream ring on the current rep; route cards Dark Surface with a 2px Dark Border; selected card 2px Cream border with a Cream label band and Charcoal label; hint line Dark Muted with `kbd` keys on Dark Surface, 1px Dark Border, Cream text. Links Cream, hover Paper White. Stage, field and mini diagrams unchanged.

## Content and copy

| Element | String | Source |
|---|---|---|
| Header | `3rd & 10`, `own 45`, `Down 4 · 1:12` | Puzzle data |
| Rep dots label | `Rep 1 of 4` | Rep index |
| Step labels | `1 Protect`, `2 Routes`, `3 Read` | Static |
| Route card names | `In`, `Slant`, `Out`, `Corner`, `Post`, `Go`, `Curl`, `Flat`, `Wheel` (rendered uppercase), in this order | Static route tree |
| Depth options | `5 yds`, `10 yds`, `15 yds` (rendered uppercase) | Static |
| Primary button | `Next: read` (rendered uppercase) | Static |
| Desktop receiver label | `Slot WR` (rendered uppercase) | Selected receiver's name (formation data) |
| Desktop helper | `Tap any receiver on the field` | Static |
| Desktop depth label | `Depth` | Static |
| Desktop button hint | `Enter` (in a `kbd`) | Static |
| Desktop hint line | `1`–`9` pick a route · `←` `→` depth (each key in a `kbd`; en dash between 1 and 9; middle dot separator) | Static |
| Desktop puzzle number | `#148` | Puzzle data |
| Route listbox label | `Routes for the slot receiver` | Built from the selected receiver |
| Depth group label | `Out route depth` | Built from the selected route |
| Field `aria-label` (example) | `Field: the slot receiver's out route set to break at 10 yards` | Built from design state |

Receiver names used across the design steps: `Left WR`, `TE`, `Slot WR`, `Right WR`, `RB`.

## Components

- **Step bar** (DESIGN.md "Step bar"). Phone: as on Protect. Protect is done (Ink Green bar, Sage Muted label), Routes is current (Ink Green bar and label), Read is inactive.
- **Route card carousel** (DESIGN.md "Route card carousel", `route-card`).
  - Phone card: 92×88px, `flex-shrink: 0`, `box-sizing: border-box`, radius 12px, 1px Sand Border, Paper White, `overflow: hidden`, flex column. Diagram SVG on top (90×60 inside the 1px border; 88×60 when selected, because of the 2px border), then a label area that fills the rest and centers the name: Figtree 800 13px uppercase, Ink Green. Selected: 2px Ink Green border.
  - Desktop card: grid cell width, radius 10px, **2px** Sand Border, diagram SVG `width: 100%`, label band 34px tall. Selected: Ink Green border, and the label band is filled Ink Green with Cream text.
  - Mini diagram (92×60 units): turf rect `#0F3A27`; line of scrimmage `M0 54H92`, stroke `#3B8EEA` at 60% opacity, width 1; receiver at (46, 54), r=4.5, fill `#0E2219`, stroke = the selected receiver's player color, width 1.8; route path with no fill, stroke = the receiver's route color, width 2, round caps and joins. Paths from the prototypes:

    | Route | Path |
    |---|---|
    | In | `M46 50V28H22M27 23.5L22 28L27 32.5` |
    | Slant | `M46 50V44L30 22M30.1 26.5L30 22L34.3 23.5` |
    | Out | `M46 50V28H70M65 23.5L70 28L65 32.5` |
    | Corner | `M46 50V30L64 12M59.6 12.8L64 12L63.2 16.4` |
    | Post | `M46 50V30L28 12M32.4 12.8L28 12L28.8 16.4` |
    | Go | `M46 50V8M41.5 12.5L46 8L50.5 12.5` |
    | Curl | `M46 50V26L40 31M44.5 30.6L40 31L41.2 26.7` |
    | Flat | `M46 50V44H72M67 39.5L72 44L67 48.5` |
    | Wheel | `M46 50Q70 46 70 12M65.5 16.5L70 12L74.5 16.5` |

    The diagrams are drawn for a receiver on the right side of the formation (Out goes right, In goes left). Mini-diagram arrowheads are 6–7 units (DESIGN.md "Field glyphs › Routes").
- **Segmented control** (`segmented-control`) for depth. Track as on Protect (Paper White, 1px Sand Border, radius 12px, padding 3px, gap 3px). Options: phone 38px tall, desktop 42px; Figtree 800 14px uppercase, Sage Muted, radius 9px. Selected: Ink Green fill, Cream text.
- **Primary button** (`button-primary`). Phone: 52px, radius 14px, Snap Orange, white Figtree 900 19px uppercase (DESIGN.md `typography.button`; the phone prototypes still show 16px, follow DESIGN.md). Hover/pressed Snap Orange Deep `#C94B20`. Desktop variant: 58px tall, radius 10px, Figtree 900 19px, full width, flex centered with gap 12px, with a `kbd` (`Enter`): 700 11px, padding `3px 7px`, radius 5px, background `rgba(255,255,255,.22)`, text inherits.
- **Desktop hint line**: 12px 600 Sage Muted, centered, margin 0. Its `kbd`s: Paper White, 1px Sand Border, Ink Green text, 700 11px, padding `3px 7px`, radius 5px.
- **Field** layers in paint order:
  1. Field base (as on Protect).
  2. Defenders at pre-snap positions.
  3. Routes group (no fill, width 2, round caps and joins):
     - Assigned routes of receivers that are not selected: wrapped in a group at `opacity: .45`, stroke = route color.
     - Selected receiver's route: stroke width 2.4, full opacity.
     - RB block line (when the RB is kept in): stroke `#5BDB8C`, width 2, full opacity, same geometry as on Protect.
  4. Protection zigzag (`#06100B`, 1.5). The slide arrow is **not** drawn on this screen.
  5. Linemen.
  6. **Selection ring**: `circle r=14`, no fill, stroke Read Gold `#F4B13E`, width 1.6, centered on the selected receiver, drawn under the player glyphs.
  7. Receivers and QB.
  - Route colors by receiver letter (DESIGN.md Player palette): X `#EAC54F`, Y `#B7A6F5`, H `#F27C8E`, Z `#55AEF5`, RB `#5BDB8C`. A flipped formation moves a receiver to the other side; its color stays with its letter.
  - Routes start just outside the receiver's ring (for example `M321 380` for the slot WR at y=389). The break depth is measured from the line of scrimmage: y = 366 − depth × 12.8 (5 yds → y=302, 10 yds → y=238, 15 yds → y=174). Draw every route from the design state and the route tree at the chosen depth, never from prototype paths. Arrowheads are open chevrons about 9 units long at ±40° (DESIGN.md "Field glyphs › Routes").
  - Example paths from the prototype: Slot WR Out 10 yds `M321 380V238H375M368 232L375 238L368 244`; Left WR In `M54 359V229H170M163 223L170 229L163 235` (breaks at y=229, about 10.7 yds; a prototype drawing inaccuracy, the app draws a 10-yd In at y=238); TE Corner `M265 358V302L333 236M324.1 237.4L333 236L331.3 244.8`; Right WR Go `M385 372V176M379 183L385 176L391 183`.

## States

| State | Description |
|---|---|
| **Receiver selected, route assigned** (prototyped) | Gold ring on the receiver; its route at 2.4px; its card selected and scrolled to the center (phone); its depth selected; other assigned routes at 45%. |
| **Receiver selected, no route yet** | Not prototyped. Gold ring on the receiver; no route drawn for it; no card selected. What the depth control shows is open. |
| **No receiver selected** | Not prototyped. No gold ring; no card selected; no route at 2.4px. Whether this state can happen (or one receiver is auto-selected on entry), and what the carousel and depth control show, are open questions. Desktop has the helper `Tap any receiver on the field` for this purpose. |
| **Unassigned route runner** | No route line is drawn for it. |
| **Kept-in receiver** (RB in 6-man; RB and TE in 7-man) | Drawn normally, with its block line. It cannot be selected: tapping it does nothing. |
| **5-man** | RB and TE run routes; both can be selected; no RB block line. |
| **Next: read** | Always enabled, whether or not every route runner has a route. Snap Orange; hover Snap Orange Deep. |
| **Carried-over design** (rep 2+) | All previous routes and depths shown. |
| **Dark** | Per Layout › Dark theme. |

## Interactions

- **Tap a receiver** on the field: selects it if it is a route runner. Moves the gold ring, sets that route to 2.4px, drops the previously selected route to 45%, updates the cards (diagrams in the receiver's colors, its route selected) and the depth control. Receivers are 17 units across; give each selectable receiver a hit circle of at least r=23 units (about 44px on the 390px phone field). Where hit circles overlap, the nearest receiver center wins. The QB, linemen, defenders and kept-in receivers are not hit targets.
- **Tap a route card**: assigns that route to the selected receiver and redraws it on the field.
- **Swipe the carousel** horizontally (phone) to see all nine cards.
- **Tap a depth option**: sets the selected receiver's break depth and redraws the route.
- **Tap Next: read**: go to Read.
- **Tap "1 Protect" or "3 Read"** in the step bar: open that step. Never blocked.
- **Desktop keyboard** (proposal; as shown in the hint line and button):
  - `1`–`9`: pick a route; numbers follow grid order (1 In, 2 Slant, 3 Out, 4 Corner, 5 Post, 6 Go, 7 Curl, 8 Flat, 9 Wheel).
  - `←` `→`: change depth.
  - `Enter`: Next: read.
- **Focus order**: step bar (Protect, Read) → selectable receivers on the field, left to right → route cards (listbox) → depth group → Next: read.

## Motion

None.

## Accessibility

- Field SVG: `role="img"` with an `aria-label` that names the selected receiver, its route and its depth (example in Content and copy). Selectable receivers also need to be reachable and selectable by keyboard and screen reader, for example as focusable elements with `role="button"`, `aria-pressed` and a name such as "Slot WR, Out, 10 yards".
- Route cards: `role="listbox"` with `aria-label="Routes for the <receiver>"`; each card `role="option"` with `aria-selected`; diagrams `aria-hidden`.
- Depth: `role="radiogroup"` with `aria-label="<Route> route depth"`; options `role="radio"` with `aria-checked`.
- Touch targets (DESIGN.md "Layout › Touch targets"): at least 44×44px. Phone cards are 92×88. Depth options are 38px tall, so extend their hit area to at least 44px without changing the look. Receivers get a hit circle of at least r=23 SVG units (above).
- Gold ring on turf: 6.7:1. The selected route is also marked by stroke width (2.4 vs 2 at 45%), not by color alone.
- Contrast figures for text as on Protect. White on Snap Orange is 3.7:1; the 19px 900 button label counts as large text and passes AA.
- Desktop: `aside` has `aria-label="Design the play"`; hint `kbd`s are hidden below 900px.

## Data

- **Puzzle JSON:** header values; puzzle number (desktop); formation (role, display name, side of the formation and x/y for each eligible receiver); defense pre-snap alignment.
- **Design state:** `blockers` and `lineCall` from Protect (these decide the route runners); `routes`: per route-runner receiver id, `{ route: In | Slant | Out | Corner | Post | Go | Curl | Flat | Wheel, depth: 5 | 10 | 15 }`. Kept between reps.
- **UI state:** `selectedReceiverId` (route runners only).
- **Route tree definition:** field geometry for each route at each depth for a receiver at any alignment and side, shared with the simulation so the drawn route matches the simulated one.
- **Player palette:** ring color and route color per receiver letter.

## Open questions

- Which receiver, if any, is selected when Routes opens (first visit, rep 2+, and returning from Read).
- What the carousel and depth control show with no receiver selected, or with a selected receiver that has no route.
- The default depth when a route is first picked.
- Whether depth applies to every route. Go, Wheel and Flat may not use 5/10/15; if a route has no depth, what does the depth control show?
- Whether the card diagrams (and route geometry) mirror for receivers on the left side of the formation. The prototype only shows the right-side slot WR.
- Whether the phone screen gets a receiver name row like the desktop `Slot WR` label. On phone the selection is shown only by the gold ring.
- Whether tapping a kept-in receiver gives any feedback (for example a hint that the receiver is blocking).
- Whether picking a route moves the selection to the next unassigned receiver.
- Whether a route can be cleared once assigned.
- Carousel behavior: scroll snapping, and whether it scrolls the selected card to the center when the selection changes.
- Desktop keyboard: what `←`/`→` do at 5 and 15 yds; how `←`/`→` and `Enter` interact with focus inside the route listbox and the depth radio group (which use arrow keys and Enter themselves); how to select a receiver from the keyboard (no shortcut is shown).
- Step bar: how the steps show they can be tapped (prototypes draw it as static).

## Acceptance criteria

- [ ] Phone layout matches `prototype.html` at 390×844: 52px header, 390×479 field, panel padding 14/16/22, gap 16px, step bar margin-bottom 2px.
- [ ] Tapping a route-runner receiver moves the gold ring (r=14, `#F4B13E`, 1.6) to it and draws its route at 2.4px; all other assigned routes render at 45% opacity.
- [ ] Kept-in receivers (per blocker count) cannot be selected and keep their block line.
- [ ] The phone carousel shows 92×88 cards with the mini diagram in the selected receiver's colors; the selected card has a 2px Ink Green border; the strip scrolls horizontally and bleeds to both screen edges.
- [ ] All nine routes are available in the order In, Slant, Out, Corner, Post, Go, Curl, Flat, Wheel, using the diagram paths in this spec.
- [ ] Picking a card assigns the route; picking a depth moves the break to y = 366 − depth × 12.8 on the field.
- [ ] The depth control shows `5 yds`, `10 yds`, `15 yds` with 38px options (desktop 42px).
- [ ] `Next: read` is always enabled (Snap Orange, 52px, 19px label) and opens Read, even with unassigned route runners.
- [ ] Tapping "1 Protect" or "3 Read" in the step bar opens that step without any gating.
- [ ] Routes are drawn from the design state at the chosen depth (10 yds breaks at y=238), not copied from prototype paths.
- [ ] The slide arrow is not drawn on this screen; the zigzag and RB block line are.
- [ ] Desktop (≥900px) matches `prototype-desktop.html`: 64px top bar, `#0C3322` stage, 440px panel, 3×3 grid, `Slot WR` label row with `Tap any receiver on the field`, 58px button with `Enter`, hint line `1–9 pick a route · ← → depth`.
- [ ] On desktop (proposed shortcuts), keys `1`–`9` pick routes in grid order, `←`/`→` change depth and `Enter` triggers Next: read.
- [ ] Below 900px the desktop layout collapses to one column and hides the hints, the spot and the puzzle number.
- [ ] Selectable receivers have hit areas of at least 44px on phone.
- [ ] Route listbox, depth radio group and receivers are operable by keyboard and announced with the receiver, route and depth.
- [ ] Dark theme matches `prototype-dark.html` and `prototype-desktop-dark.html`; the field and mini diagrams are identical between themes.
