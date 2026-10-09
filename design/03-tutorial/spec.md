# Tutorial

## Purpose

A three-step introduction to how Omaha works: read the situation, design the play (protect, routes, read), then snap and run it back. It ends by sending the player into a puzzle.

## Prototypes

| File | Shows |
|---|---|
| `prototype-1.html` | Phone, 390×844. Step 1 "Read the situation": field with the line of scrimmage, first-down line and a 10-yard bracket; four rep boxes. |
| `prototype-2.html` | Phone, 390×844. Step 2 "Draw up the play": a complete design on the field (slide left, four routes, RB check-down, TE as first read); numbered list Protect / Routes / Read. |
| `prototype-3.html` | Phone, 390×844. Step 3 "Snap it, then run it back": the rep 1 result frame (defense revealed, ball thrown to the TE); three-card strip Snap › Result › Run it back; final CTA. |
| `prototype-1-desktop.html` | Desktop (≥900px). Step 1: field on the stage at left, step content in the 440px panel, Skip in the top bar. |
| `prototype-2-desktop.html` | Desktop (≥900px). Step 2, same structure. |
| `prototype-3-desktop.html` | Desktop (≥900px). Step 3, same structure. |
| `prototype-1-dark.html`, `prototype-2-dark.html`, `prototype-3-dark.html` | Phone, dark theme. Steps 1–3, same content. |
| `prototype-1-desktop-dark.html`, `prototype-2-desktop-dark.html`, `prototype-3-desktop-dark.html` | Desktop, dark theme. Steps 1–3, same content. |

Where the prototypes and DESIGN.md disagree on a token value (the CTA label size), this spec follows DESIGN.md.

## Entry and exit

**Entry**
- "How to play" on Landing → step 1.
- Possibly on first-ever visit (open question in the Landing spec).

**Exit**
- "Next" on step 1 → step 2. "Next" on step 2 → step 3.
- "Play your first puzzle" on step 3 → Protect (`04-protect`) for today's puzzle.
- "Skip" on any step → Protect for today's puzzle.
- System/browser back: behavior not specified (open question).

## Layout

Phone baseline 390×844. Background `cream`, text `ink-green`. Every step has the same structure: a field SVG at the top (full width), a Skip link over the field's top right, and a bottom sheet. No page scroll.

**Shared elements**
- **Skip**: absolute, right 8, top 8; 44px tall, padding 0 12px, `cream` text 14px 800 uppercase, no background. Hover: white text.
- **Sheet**: absolute, bottom 0, full width; `cream`; top corners 28px (`sheet`); shadow `0 -12px 32px rgba(0,0,0,.35)`; padding 24px 20px 28px; column, `justify-content: space-between`. It overlaps the bottom of the field.
- **Top group** in the sheet: column, 14px gap: progress dots, then the step heading, then (steps 1 and 3) a paragraph.
- **Progress dots**: row, 6px gap. Inactive dot 8×8, 4px radius, `sand-border`. Active dot 24×8, `ink-green`.
- **Heading**: `h2`, 36px, 900, line-height 0.95, uppercase, -0.01em.
- **Paragraph**: 16px, line-height 1.45, `sage-body`.
- **CTA**: full width, 56px, 16px radius (`cta-result`), `snap-orange`, white label in `button` type (19px, 900, uppercase, 0.01em; the prototypes still show 18px). Hover `snap-orange-deep`.

**Step 1** (`prototype-1.html`)
- Field SVG 390×470 (viewBox `0 0 390 470`). Turf with stripe bands at y 40, 168, 296 (64px) and 424 (46px); lines every 64 from y 40. Yard numbers "40", "50", "40" at x 40, y 104/232/360, rotated 90°, 22px 700, `field-number` at 70% opacity. First-down zone: rect y 232–360 in `first-down-line` at 8% opacity. First-down line y 232 and line of scrimmage y 360, both 3px. Seven defenders (r 7.5, `defender-fill`, 2.2px `defender-ring`) at 70% group opacity. Five linemen at y 360, QB at 200,410. A two-headed cream arrow at x 338 from y 240 to 352 with "10 YDS" (14px 900 cream, right-aligned at x 326, y 300). Labels "FIRST DOWN" at 16,224 in `first-down-line` and "LINE OF SCRIMMAGE" at 16,380 in `scrimmage-label`, both 11px 800, 0.04em.
- Situation pill: absolute, left 16, top 16; 30px tall, padding 0 12px, 15px radius, `rgba(6,13,10,.82)`, `cream` 13px 800 uppercase.
- Sheet 398px tall. Between the top group and the CTA: a rep row with 14px vertical padding, 1px `sand-border` top and bottom borders, 12px gap: four rep boxes (30×30, 8px radius, 1.5px `ink-green` border, 12px 700 numbers 1–4, 6px gap) and a 14px 600 `sage-body` line (line-height 1.3).

**Step 2** (`prototype-2.html`)
- Field SVG 390×440 (viewBox `0 0 390 440`). Stripes at y 20, 148, 276 (64px) and 404 (36px). First-down line y 212, line of scrimmage y 340, both 2px.
  - Protection zigzag under the line (x 154–250, y 350–357, stroke `protection-zigzag` 1.5px) and a slide arrow pointing left at y 367 (x 250 → 146, `lineman-stroke` 2px, open arrowhead).
  - Routes 2.2px with open arrowheads: X (`receiver-x`), Y (`receiver-y-route`, 2.8px as the selected route), H (`receiver-h-route`), Z (`receiver-z`), RB block line ending in a T (`receiver-rb`).
  - Linemen at y 340; receivers and QB per DESIGN.md Player palette; QB at 200,404, RB at 170,404.
  - Read marker on the TE: 14-unit `read-gold` ring (1.6px) and a gold "1" badge (r 6.5, 8px 700 `quarterback-text`) at 275,328.
  - No situation pill.
- Sheet 428px tall. Top group has dots and heading only. Then an ordered list (column, 14px gap), each item: a 28px `ink-green` circle with a `cream` 14px 900 number, 12px gap, then a column (3px gap) of title (15px 900 uppercase, line-height 1.1) and description (14px, line-height 1.35, `sage-body`).

**Step 3** (`prototype-3.html`)
- Field SVG 390×440, same frame as step 2. The result frame of rep 1, at the throw: 11 defenders in their post-snap positions, four defender paths (`defense-path` 1.6px at 80% opacity), receivers mid-route, linemen at y 344, a dashed ball path from the QB (2 on / 5 off, `quarterback` color, 1.8px) curving to the TE, the football (`football`, 4.5×2.8, rotated -44°, white 0.8px edge) in the air, and an Open receiver feedback badge (r 7 white disc with dark check) on the Left WR at 149,192.
- Result pill: absolute, left 16, top 16; 30px tall, padding 0 12px, 15px radius, `rgba(6,13,10,.82)`, `cream` 12px 700, text only (no icon).
- Sheet 428px tall. Top group: dots, heading, paragraph. Then a strip (row, centered, 6px gap) of three equal cards separated by 14px chevrons (`sand-strong`, 2px). Each card: 64px tall, 12px radius, 1px `sand-border`, `paper-white`, column centered, 6px gap, 18px icon over a 12px 900 uppercase label. Icons: filled play triangle (Snap), screen with a play triangle (Result), counter-clockwise arrow (Run it back).
- CTA has an 18px filled play triangle before the label, 8px gap.

### Desktop (`prototype-1-desktop.html`, `-2-desktop`, `-3-desktop`, ≥900px)

Same three steps, same field art and same copy. The layout follows the DESIGN.md desktop grid.

1. **Top bar**: 64px, padding 0 28px, 1px `sand-border` bottom border, space-between, centered.
   - Left: "OMAHA" wordmark, 24px, 900, 0.02em.
   - Right: "Skip" text link, 14px 800 uppercase, `ink-green`, no underline (`href="#"` in the prototype; goes to Protect). Skip moves here from over the field.
2. **Body**: grid `minmax(0,1fr) 440px`.
3. **Stage** (left): `turf-stage` background, 24px padding, content centered. The step's field SVG (same viewBox and art as the phone step: `0 0 390 470` for step 1, `0 0 390 440` for steps 2 and 3) at `height: calc(100vh - 112px)`, `width: auto`, `max-width: 100%`, 10px radius.
   - Step 1 situation pill and step 3 result pill: absolute at left 36, top 36 of the stage, same styling as phone (30px, 15px radius, 13px 800 uppercase for step 1; 12px 700 for step 3). Step 2 has no pill.
4. **Panel** (right, `aside`, `aria-label="Step N of 3"`): 440px, 1px `sand-border` left border, padding 48px 40px, column, 28px gap, `justify-content: space-between`. No sheet radius or shadow. Contents per step are the phone sheet contents in the same order: top group (dots, heading, paragraph), then the step's middle block (rep row / numbered list / phase strip), then the CTA.
   - CTA: the prototypes render the phone button (56px, 16px radius, 18px) because a later CSS rule overrides the desktop one. Use DESIGN.md's desktop primary variant (58px, 10px radius, 19px).
   - No keyboard hints (`kbd`) are shown.
5. **Below 900px**: the phone layout (`prototype-N.html`).

### Dark theme (`prototype-N-dark.html`, `prototype-N-desktop-dark.html`)

Only what differs from light:
- Page, sheet and desktop panel background Charcoal (`dark-bg`); text, headings and the desktop top-bar Skip Cream (hover Paper White).
- Progress dots: inactive Dark Border (`dark-border`), active Cream.
- Paragraphs, the step 1 rep-row line and the step 2 list descriptions: Dark Muted Strong (`dark-muted-strong`).
- Rules (step 1 rep row, desktop top-bar border, panel left border): Dark Border.
- Step 1 rep boxes: Cream border and number.
- Step 2 list numbers: Cream circle with a Charcoal number.
- Step 3 strip cards: Dark Surface (`dark-surface`) fill, 1px Dark Border, Cream icon and label; chevrons Sage Muted (`sage-muted`).
- Unchanged: the field art, the pills, the phone Skip over the field, the sheet shadow and the orange CTA.

## Content and copy

All copy is static. Record it exactly; the casing shown is the source text (CSS uppercases headings, labels, Skip and the CTA).

**Shared**
- Skip link: `Skip`
- Sheet `aria-label`s: `Step 1 of 3`, `Step 2 of 3`, `Step 3 of 3`

**Step 1**
- Situation pill: `3rd & 10 · own 45`
- Heading: `Read the situation`
- Paragraph: `Every puzzle is one snap from a game. You know the down, the distance, the score and the clock. Get past the yellow line.`
- Rep row: `Four reps. Use what each one shows you.`
- Field labels: `FIRST DOWN`, `LINE OF SCRIMMAGE`, `10 YDS`
- Field `aria-label`: `The field at your own 45: the blue line of scrimmage and the yellow first-down line ten yards ahead`
- CTA: `Next`

**Step 2**
- Heading: `Draw up the play`
- List:
  1. `Protect` — `Who stays in to block, and which way the line slides.`
  2. `Routes` — `A route and a depth for every receiver.`
  3. `Read` — `Who the quarterback looks to first.`
- Field `aria-label`: `A full play drawn: the line sliding left, four routes, and the tight end marked as the first read`
- CTA: `Next`

**Step 3**
- Result pill: `Rep 1 result`
- Heading: `Snap it, then run it back`
- Paragraph: `Watch it play out, then see what the defense was really doing. Change the call and go again until you convert.`
- Strip cards: `Snap`, `Result`, `Run it back` (separated by chevrons)
- Strip `aria-label`: `Snap, then the result, then run it back`
- Field `aria-label`: `The result of rep 1: the defense revealed, the throw to the tight end, the left receiver open`
- CTA: `Play your first puzzle`

**Desktop only**
- Top-bar wordmark: `OMAHA`

The example situation (3rd & 10, own 45) is fixed tutorial content, not today's puzzle.

**Voice:** the game's voice is trash talk everywhere (README Decisions), but this copy is straight. A voice pass is optional and not part of this spec; implement the copy as written.

## Components

- **Primary button**: `button-primary-result` on phone (56px, 16px radius, 19px `button` type); DESIGN.md's desktop variant on desktop (58px, 10px radius, 19px). One per step.
- **Field pills** (`field-pill`): the situation pill on step 1 and the result pill on step 3. They are 30px tall with 12–13px text on both phone and desktop. That matches DESIGN.md's desktop pill variant; on phone it is larger than the token's 28px / 12px.
- **Rep boxes** (step 1): four 30px boxes in the "next rep" style (Ink Green border and number).
- **Result sheet** shape for the phone bottom sheet (28px top radius), with the Landing/Tutorial sheet shadow (`0 -12px 32px rgba(0,0,0,.35)`) from DESIGN.md Elevation.
- **Field glyphs**: players, routes, protection zigzag and slide arrow, read ring and "1" badge, defender paths, ball path, football, Open receiver feedback badge.
- **Progress dots**, **Skip text link**, **numbered list item**, **phase strip card**: tutorial-specific, not in DESIGN.md. Skip here is a plain text link, not DESIGN.md's `button-skip`.

## States

1. **Step 1, step 2, step 3 (prototyped).** One step shown at a time; the active dot marks the step.
2. **Today's puzzle already in progress or finished (not prototyped).** Skip and "Play your first puzzle" go to Protect for today's puzzle. What happens if today's puzzle is already in progress or finished is an open question.
3. **Puzzle unavailable (not prototyped).** No puzzle today or the fetch fails when leaving the tutorial. Open question.

## Interactions

- Tap "Next" → next step.
- Tap "Play your first puzzle" (step 3) → Protect.
- Tap "Skip" (any step) → Protect.
- The field, pills, dots, rep boxes, list and strip cards are not interactive.
- Swiping between steps and moving back a step are not in the prototypes (open question).
- Keyboard focus order per step: Skip → CTA. Enter activates. No shortcut keys are defined.
- Desktop: Skip is in the top bar, so it still comes first in focus order. Hover on Skip: `ink-green-deep`. The stage field is not interactive.
- When a step changes, move focus to the new step's heading so screen readers announce it.

## Motion

None in the prototypes. Step changes are instant.

## Accessibility

- Each field SVG has `role="img"` with the `aria-label` in Content and copy.
- Each sheet is a `section` (desktop: the panel `aside`) with `aria-label="Step N of 3"`. The dots are `aria-hidden`; the label conveys progress.
- The step heading is an `h2`. Each step needs an `h1` or the heading level raised; the prototype has no `h1` (open question).
- Step 2's list is an `ol`.
- Step 3's strip has `aria-label="Snap, then the result, then run it back"`; its icons and chevrons are `aria-hidden`.
- Contrast: Skip (Cream on Turf) 11.07:1; desktop Skip (Ink Green on Cream) passes; Sage Body on Cream 6.21:1; "LINE OF SCRIMMAGE" `scrimmage-label` on Turf about 6:1; "FIRST DOWN" `first-down-line` on Turf 7.17:1. White on Snap Orange is 3.71:1, and the 19px 900 CTA label is large text, so it passes AA.
- Touch targets: Skip 44px tall on phone; the desktop top-bar Skip needs a hit area of at least 44×44px (extend with padding). CTA 56px (58px desktop).
- Reduced motion: nothing animates.

## Data

None from the puzzle JSON or results API. All content is static.

If first-visit routing is adopted (Landing open question), a "tutorial seen" flag in local storage is written when the player finishes or skips.

## Open questions

- **Back navigation:** is there a way to go back a step (button, swipe, system back)? What does system back do on step 2 or 3?
- **Swipe** between steps?
- **Destination when today's puzzle is in progress or finished:** Skip and the final CTA go to Protect. Should a player who opened "How to play" after finishing today's puzzle return to Landing instead?
- **"Play your first puzzle"** reads wrong for returning players who open the tutorial from Landing. Keep one label for everyone?
- **Example situation:** should the tutorial use today's puzzle instead of a fixed 3rd & 10?
- **Voice pass** on the tutorial copy (optional).
- **Heading levels:** no `h1` in the prototypes (the desktop top-bar "OMAHA" is not a heading either).
- **Result card icon:** the "Result" card in the strip uses the screen-with-play icon, which reads as "replay". Keep it or pick a different icon?

## Acceptance criteria

- [ ] Three steps render at 390×844 matching `prototype-1.html`, `prototype-2.html` and `prototype-3.html`, with sheet heights 398, 428 and 428px.
- [ ] Every string in Content and copy appears exactly as listed, including the field and sheet `aria-label`s.
- [ ] The active progress dot (24×8, Ink Green) matches the current step; the others are 8×8 Sand Border.
- [ ] "Next" on step 1 shows step 2; "Next" on step 2 shows step 3.
- [ ] "Play your first puzzle" and every "Skip" navigate to Protect for today's puzzle.
- [ ] Step 1 shows the situation pill; step 2 shows no pill; step 3 shows the "Rep 1 result" pill with no icon.
- [ ] Step 3's strip reads Snap › Result › Run it back, and its `aria-label` is "Snap, then the result, then run it back".
- [ ] The CTA label is 19px 900 (`button` type) at every width.
- [ ] Field labels and strokes use tokens: `scrimmage-label`, `protection-zigzag`, `sand-strong` chevrons.
- [ ] At ≥900px each step matches its `-desktop` prototype: 64px top bar with wordmark and Skip, field centered on a `turf-stage` stage with pills at 36/36, a 440px panel with the step content, CTA 58px tall with a 10px radius.
- [ ] Below 900px the phone layout is shown.
- [ ] Field art uses DESIGN.md field and player tokens (receiver colors, read gold ring and "1" badge, defense-path lines, football color).
- [ ] Focus order on each step is Skip → CTA; after a step change, focus is on the new heading.
- [ ] Dots and icons are `aria-hidden`; each sheet section is labeled "Step N of 3".
- [ ] The tutorial reads nothing from the puzzle JSON or the results API.
- [ ] Dark theme matches `prototype-N-dark.html` and `prototype-N-desktop-dark.html` for each step; the field art and pills are identical in both themes.
