# Step 1: Protect

## Purpose

First of the three design steps. The player sets pass protection for the puzzle's fixed formation: how many players block (5-, 6- or 7-man) and the offensive line's call (slide left, man, slide right). The field shows the defense's pre-snap alignment so the player can match protection to the pressure they expect.

## Prototypes

| File | Shows |
|---|---|
| `prototype.html` | Light theme, phone 390×844. Example state: rep 1, **6-man** selected, line call **Slide left**. Field draws the zigzag, a slide arrow pointing left and the RB's block line ending in a T at the right edge. |
| `prototype-dark.html` | Same state in the dark theme. Only the paper colors change; the field is identical. |
| `prototype-desktop.html` | Same state at ≥900px: top bar, field stage, 440px panel with the two labeled segmented controls, the button with an `Enter` hint and a keyboard hint line. Below 900px it collapses to one column. |
| `prototype-desktop-dark.html` | Same desktop state in the dark theme. |

## Entry and exit

Entry:
- Landing "Play today's puzzle" CTA (01-landing).
- A puzzle card in the Puzzles list (02-puzzles).
- Tutorial step 3 CTA or its "Skip" link (03-tutorial).
- Result screen "Run it back" (08-result) when reps remain. The previous rep's whole design (protection, routes, read) is kept and editable.
- Tapping "1 Protect" in the step bar from Routes or Read. Intended behavior; not shown in any prototype.

Exit:
- "Next: routes" opens Step 2: Routes (05-routes). Always enabled.
- Tapping "2 Routes" or "3 Read" in the step bar opens that step. Moving between steps is never gated; only Snap is (README Snap unlock). Intended behavior; not shown in any prototype.

## Layout

### Phone (390×844)

Root is a flex column, `overflow: hidden`, background Cream `#F4EFE4`, text Ink Green `#244A3E`.

1. **Header**, 52px tall, `flex-shrink: 0`, padding `0 16px`, 1px Sand Border `#DCD3C1` bottom border. Flex row, `space-between`, items centered.
   - Left group (baseline-aligned, gap 6px): down and distance in Title type (Figtree 900, 20px, uppercase, `letter-spacing .01em`); spot in 13px 800 uppercase Sage Muted `#5A6B62`.
   - Right group (centered, gap 12px): score and clock in 13px Sage Muted with tabular numerals (prototype sets no weight; with only 500–900 loaded it renders at 500); then four rep dots.
   - Rep dots: 8×8px circles, radius 4px, gap 5px. Current rep: transparent with a 2px Ink Green border (`box-sizing: border-box`). Future reps: Sand Border fill. Used reps: Sage Muted fill (taken from 09-replay; the design-step prototypes only show rep 1).
2. **Field**, SVG 390×479, `viewBox="0 0 403 495"`, `display: block`, `flex-shrink: 0`. Layers listed under Components.
3. **Panel** (`footer`), `flex-grow: 1` (313px tall at 390×844), padding `14px 16px 22px`, `box-sizing: border-box`, flex column `justify-content: space-between`.
   - Top group, flex column, gap 16px: Step bar, then the Blockers section, then the Line call section.
   - Each section: flex column, gap 8px. Section header row: flex, `space-between`, `align-items: baseline`, 13px, `line-height: 1`. Label in 600 Ink Green; helper in Sage Muted (no weight set; renders 500).
   - Primary button pinned at the bottom by `space-between`.

### Dark theme (`prototype-dark.html`, `prototype-desktop-dark.html`)

Phone: background Charcoal `#18201C`; text Cream `#F4EFE4`; header border, inactive step bars, rep dots for future reps and segmented track border Dark Border `#34403A`; spot, score/clock, helper text, step labels and unselected options Dark Muted `#A3B1A9`; segmented track Dark Surface `#232C27`; selected option Cream fill with Charcoal `#18201C` text; current step bar and label Cream; current rep dot border Cream. Field and primary button unchanged.

Desktop: the same mapping, plus top-bar and panel borders Dark Border; spot and meta Dark Muted; rep pips Dark Border with a Cream ring on the current rep; group helpers Dark Muted; hint line Dark Muted with `kbd` keys on Dark Surface, 1px Dark Border, Cream text. Links Cream, hover Paper White. Stage and field unchanged.

### Desktop (≥900px, `prototype-desktop.html`)

DESIGN.md "Layout › Desktop" and its desktop control variants apply. Same stylesheet as 05-routes desktop.

- **Top bar** 64px, padding `0 28px`, 1px Sand Border bottom, flex `space-between`, gap 16px: `OMAHA` wordmark (24px 900, `letter-spacing .02em`); situation (`3rd & 10` 20px 900 uppercase, `own 45` 14px 800 uppercase Sage Muted, baseline-aligned, gap 10px); meta (14px 600 Sage Muted, tabular numerals, gap 14px): `#148`, `Down 4 · 1:12`, rep pips (9×9px, radius 5px, gap 5px; current: 2px Ink Green ring; future: Sand Border; `aria-label="Rep 1 of 4"`).
- **Body**: grid `minmax(0,1fr) 440px`.
  - **Stage**: Turf Stage `#0C3322`, padding 24px, field centered, `height: calc(100vh - 112px)`, width auto, `max-width: 100%`, radius 10px. Same field layers as phone.
  - **Panel** (`aside aria-label="Design the play"`): 1px Sand Border left, padding 28px, flex column, gap 22px:
    1. Step bar, desktop variant: gap 10px; 4px bars, radius 2px; labels 12px 800 uppercase, `letter-spacing .03em`, column gap 8px. Protect current (Ink Green bar and label); Routes and Read inactive.
    2. Blockers group (column, gap 10px): label row (flex `space-between`, centered): `Blockers` in 13px 800 uppercase, `letter-spacing .04em`; helper `Line + RB stay in` in 13px 700 Sage Muted, sentence case, no letter-spacing. Then the segmented control with 42px options.
    3. Line call group: same structure, label `Line call`, helper `RB takes the right edge`, segmented control with 42px options and the same arrow icons (gap 6px).
    4. Spacer (`flex-grow: 1`).
    5. Button group (column, gap 10px): primary button `Next: routes` with `kbd` `Enter`, then the hint line.
- **Below 900px:** use the phone layout above, not the simplified desktop-prototype fallback: 52px header with the spot visible, full-width field, step bar inside the panel below it. Hide the desktop wordmark, puzzle number and keyboard hints. The task's phone situation requirement and DESIGN.md's shipped-layout rule supersede the prototype fallback's hidden spot.

## Content and copy

| Element | String | Source |
|---|---|---|
| Down and distance | `3rd & 10` (rendered uppercase) | Puzzle data |
| Spot | `own 45` (rendered uppercase) | Puzzle data |
| Score and clock | `Down 4 · 1:12` (middle dot U+00B7, spaces either side) | Puzzle data |
| Rep dots group label | `Rep 1 of 4` | Rep index; total is 4 |
| Step labels | `1 Protect`, `2 Routes`, `3 Read` (rendered uppercase) | Static |
| Blockers label | `Blockers` | Static |
| Blockers helper (6-man) | `Line + RB stay in` | Static per option; strings for 5-man and 7-man not prototyped |
| Blockers options | `5-man`, `6-man`, `7-man` (rendered uppercase) | Static |
| Line call label | `Line call` | Static |
| Line call helper (6-man, slide left) | `RB takes the right edge` | Static per state; other strings not prototyped |
| Line call options | `Slide` with a left arrow before the text, `Man`, `Slide` with a right arrow after the text (rendered uppercase) | Static |
| Primary button | `Next: routes` (rendered uppercase) | Static |
| Desktop button hint | `Enter` (in a `kbd`) | Static |
| Desktop hint line | `5` `6` `7` blockers · `←` `M` `→` line call (each key in a `kbd`; middle dot separator) | Static |
| Desktop puzzle number | `#148` | Puzzle data |
| Field `aria-label` (example) | `Field: six-man protection, line sliding left, running back taking the right edge` | Built from design state |

## Components

- **Step bar** (DESIGN.md "Step bar"). `nav aria-label="Play steps"`, flex row, gap 8px. Each step: `flex: 1`, column, gap 7px; bar 3px tall, radius 2px; label 12px 800 uppercase, `letter-spacing .02em`, `line-height 1`. On this screen: Protect is current (Ink Green bar and label); Routes and Read are inactive (Sand Border bar, Sage Muted label). Desktop uses the 4px variant (DESIGN.md "Layout › Desktop").
- **Segmented control** (`segmented-control`, `segmented-option-selected`), used twice. Track: Paper White `#FFFFFF`, 1px Sand Border, radius 12px (`rounded.control`), padding 3px, gap 3px. Options: `flex: 1`, 40px tall (desktop 42px), no border, radius 9px (`rounded.control-inner`), transparent, Sage Muted, Figtree 800 14px uppercase, flex centered with gap 6px. Selected: Ink Green fill, Cream text.
  - Line call arrows: inline SVG 16×12, `viewBox 0 0 16 12`, `stroke: currentColor`, width 2, round caps and joins, `aria-hidden`. Left: `M15 6H2M6 2L2 6L6 10`. Right: `M1 6H14M10 2L14 6L10 10`.
- **Primary button** (`button-primary`): 52px tall, full width, no border, radius 14px (`rounded.cta`), Snap Orange `#E05A2B`, white text, Figtree 900 19px uppercase (DESIGN.md `typography.button`), `letter-spacing .01em`. Hover/pressed Snap Orange Deep `#C94B20`. The phone prototypes still show 16px; follow DESIGN.md. Desktop variant: 58px tall, radius 10px, 19px, flex centered with gap 12px, with a `kbd` (`Enter`): 700 11px, padding `3px 7px`, radius 5px, background `rgba(255,255,255,.22)`, text inherits.
- **Desktop hint line**: 12px 600 Sage Muted, centered, margin 0. Its `kbd`s: Paper White, 1px Sand Border, Ink Green text, 700 11px, padding `3px 7px`, radius 5px.
- **Field** (DESIGN.md "Field glyphs", "Field palette", "Field geometry"). Layers in paint order:
  1. Field base: turf, 5-yard stripes, hash marks, yard lines, yard numbers, first-down line (y=238, `#E2C044`, 2px), line of scrimmage (y=366, `#3B8EEA`, 2px).
  2. Defenders at the puzzle's pre-snap positions: r=7.5, fill `#071710`, Cream stroke 2.2.
  3. **Protection zigzag** (always drawn): `M156 376L162 383L168 376 … L252 376` (alternating y 376/383 every 6 units from x=156 to x=252), no fill, stroke Protection zigzag `#06100B`, width 1.5, round joins.
  4. **Slide arrow** (slide left shown): horizontal line `M252 393H148` with chevron `M154 387L148 393L154 399`, no fill, stroke Lineman stroke `#DADDE0` (DESIGN.md "Field glyphs › Protection"), width 2, round caps and joins.
  5. **RB block line** (6-man shown): `M180 425L258 386` plus the T bar `M255.3 380.6L260.7 391.4` (about 12 units, perpendicular to the line), no fill, stroke Receiver RB `#5BDB8C`, width 2, round caps. It runs from the RB to just outside the end lineman on the edge opposite the slide (DESIGN.md "Field glyphs › Protection").
  6. Linemen: r=8, fill `#A4AAAF`, stroke `#DADDE0` 1.2, at y=366, x = 160, 181, 202, 223, 244.
  7. Receivers (r=8.5, fill `#0E2219`, 2.2 ring in the player color, white 6.5px 700 label `WR`/`TE`/`RB`) and QB (r=8.5, fill `#F2F5F3`, label `QB` in `#0A1410`). Positions from puzzle data. Labels: `text-anchor: middle`, `y=2.3`.

## States

| State | Description |
|---|---|
| **Default, first rep** | 5-man and Man selected. Field: zigzag only from the protection layer (no RB block line because the RB runs a route). Whether Man draws any arrow, and the helper strings for 5-man and Man, are not prototyped (Open questions). |
| **6-man, slide left** (prototyped) | As in `prototype.html`. RB stays in; slide arrow points left; RB block line ends at the right edge. Helpers `Line + RB stay in` and `RB takes the right edge`. |
| **Slide right** | Not prototyped. Option 3 selected. Arrow direction reversed (chevron at the right end). The RB block line (6- or 7-man) goes to the left edge, per the rule "edge opposite the slide". Exact geometry is not prototyped. |
| **7-man** | Not prototyped. RB and TE both stay in. How the TE's block is drawn is not prototyped (Open questions). |
| **7-man hidden** | When the formation has no TE, or the TE is split out, the 7-man option is not rendered. The control shows two options, `5-man` and `6-man`, each `flex: 1`. |
| **Carried-over design** (rep 2+ via Run it back) | Controls show the previous rep's values. Rep dots: used reps filled Sage Muted, current rep ringed. |
| **Returned via step bar** | Controls show current values. Routes and read set earlier remain in the design state. |
| **Dark** | Per Layout › Dark theme. |
| **Primary button pressed/hover** | Snap Orange Deep `#C94B20`. |

The primary button has no disabled state on this screen.

## Interactions

- Tap a Blockers option: selects it; field and helpers update immediately. Moving to 6-man keeps the RB in; 7-man keeps the RB and TE in; 5-man returns both to route running.
- Tap a Line call option: selects it; slide arrow, RB block line side and helper update immediately.
- Segmented controls follow the ARIA radio group pattern: Tab enters the group on the checked option; arrow keys move and select.
- Tap "Next: routes": go to Routes.
- Tap "2 Routes" or "3 Read" in the step bar: open that step. Never blocked.
- **Desktop keyboard** (proposal; shown in the hint line and button): `5`, `6`, `7` select 5-man, 6-man, 7-man; `←` Slide left, `M` Man, `→` Slide right; `Enter` Next: routes.
- Focus order: step bar (Routes, Read) → Blockers group → Line call group → Next: routes. The header and the field are not focusable.

## Motion

None.

## Accessibility

- Field SVG: `role="img"` with an `aria-label` that describes the current protection in words (example in Content and copy). Update it when the state changes.
- Rep dots: wrapping element has `aria-label="Rep N of 4"`.
- Segmented controls: `role="radiogroup"` with `aria-label="Blockers"` and `aria-label="Line call"`; options `role="radio"` with `aria-checked`.
- The two line call options both read "Slide" because the arrows are `aria-hidden`. Give them accessible names `Slide left` and `Slide right` (for example with `aria-label`).
- Touch targets (DESIGN.md "Layout › Touch targets"): at least 44×44px. Options are 40px tall, so extend each option's hit area to at least 44px without changing its look.
- Contrast (measured): Sage Muted on Cream 4.9:1; Sage Muted on Paper White 5.7:1; Cream on Ink Green 8.6:1; Dark Muted on Charcoal 7.5:1; Dark Muted on Dark Surface 6.5:1. White on Snap Orange is 3.7:1, which passes AA only as large text; the 19px 900 button label qualifies.
- Desktop: `aside` has `aria-label="Design the play"`; hint `kbd`s are hidden below 900px.
- Everything works without sound.

## Data

- **Puzzle JSON:** down, distance, spot label, score difference and clock (header); yard line labels for the visible window; formation (each player's role and x/y in field units, including whether a TE exists and whether it is split out); defense pre-snap alignment (11 defender positions).
- **Design state (shared across all three steps, kept between reps):** `blockers` (5 | 6 | 7), `lineCall` (slide left | man | slide right). Initial value for a new puzzle: 5, man. Derived: the set of receivers kept in to block (6: RB; 7: RB and TE) and so the set of route runners.
- **Rep state:** current rep index (1–4) and which reps are used.
- **7-man availability:** derived from formation data (TE present and not split out).

## Open questions

- Helper strings for 5-man and 7-man, and the line call helper for every state other than 6-man + slide left (including 5-man, where no RB blocks).
- Field drawing for the Man call: is a slide arrow drawn at all, and which edge does the RB block in 6- and 7-man?
- Field drawing for the TE's block in 7-man.
- RB block line geometry for slide right and for other formations (the prototype gives one example path).
- Whether the field on Protect shows routes already designed (rep 2+ or after returning from Routes). The prototype shows none.
- What happens to routes and the read when the blocker count changes after they are set: for example, the read is the RB and the player switches to 6-man.
- Step bar affordance is settled: native buttons with a pointer cursor, raised-surface hover, a 3px accent focus-visible outline and at least 44×44px targets. All three buttons remain keyboard reachable, including the selected step, with `aria-current="step"` identifying it. Activation is never gated.
- How the player leaves the puzzle from this screen. The header has no back or menu control.
- Desktop keyboard: what `7` does when 7-man is hidden; how `←`/`→` and `Enter` interact with focus inside a radio group or on a button (which use those keys themselves).

## Acceptance criteria

- [ ] At 390×844 the header is 52px, the field is 390×479 with `viewBox="0 0 403 495"`, and the panel fills the remaining 313px with padding 14/16/22.
- [ ] A new puzzle opens Protect with `5-man` and `Man` selected.
- [ ] The Blockers control shows `5-man`, `6-man`, `7-man`. With a formation that has no TE, or a split TE, only `5-man` and `6-man` render, each half the width.
- [ ] Selecting 6-man draws the RB block line (`#5BDB8C`, 2px, T end) and removes the RB from the route runners; selecting 5-man removes it and returns RB (and TE) to route running.
- [ ] Selecting Slide left draws the `#DADDE0` arrow pointing left at y=393 between x=148 and x=252; the RB block line ends at the right edge. Slide right reverses both.
- [ ] The zigzag (`#06100B`, 1.5px) is drawn under the linemen in every state.
- [ ] With 6-man + Slide left, the helpers read `Line + RB stay in` and `RB takes the right edge`, and the field matches `prototype.html`.
- [ ] Segmented options are 40px tall, Figtree 800 14px uppercase; selected is Ink Green with Cream text (dark: Cream with Charcoal text).
- [ ] Step bar shows Protect current (Ink Green bar and label), Routes and Read inactive.
- [ ] `Next: routes` is a 52px Snap Orange button with a 19px label pinned to the bottom, and it opens Routes.
- [ ] Tapping "2 Routes" or "3 Read" in the step bar opens that step without any gating.
- [ ] Desktop (≥900px) matches `prototype-desktop.html`: 64px top bar, `#0C3322` stage, 440px panel, 4px step bars, labeled groups with 42px options, 58px button with `Enter`, hint line `5 6 7 blockers · ← M → line call`.
- [ ] On desktop, `5`/`6`/`7`, `←`/`M`/`→` and `Enter` work as listed in Interactions.
- [ ] Below 900px the shipped phone layout preserves the spot; desktop wordmark, puzzle number and keyboard hints are hidden.
- [ ] Segmented options have hit areas at least 44px tall.
- [ ] Run it back opens this screen with the previous rep's blockers and line call selected, and with the routes and read still in the design state.
- [ ] Both radio groups work with keyboard (Tab into the group, arrows to change); line call options are announced as "Slide left", "Man", "Slide right".
- [ ] The field `aria-label` changes when protection changes.
- [ ] Dark theme matches `prototype-dark.html` and `prototype-desktop-dark.html`; the field is pixel-identical between themes.

## Play-screen frame decisions

The frame is live independently of Protect's controls. A numbered route loads that puzzle through the engine loader, starts an in-memory rep-1 session with the domain `Design` draft (5-man, man, no routes, empty read order), and opens Protect. Protect, Routes and Read each show an explicitly unavailable-controls placeholder until their pieces land. Step activation retains the draft; reloading resets the session. Protection zigzags, arrows, block lines, primary buttons and shortcuts are not part of the frame.

The field's frame-stage accessible name describes only down, distance, spot and the pre-snap alignment, not hidden assignments or coverage. Protection-specific descriptions arrive with the controls. Four visible rep pips form the accessible “Rep 1 of 4” group. Desktop retains the named “Design the play” aside; phone places the step navigation in the panel beneath the field.

The header exit remains an open question for the Protect-controls piece. The frame adds no exit button or history replacement: browser back returns to the actual originating page.
