# Puzzles

## Purpose

Lists today's puzzle and earlier puzzles with the player's status on each, so the player can start, resume or revisit any of them. A filter narrows the earlier list to open or converted puzzles.

## Prototypes

| File | Shows |
|---|---|
| `prototype.html` | Phone, 390×844, light theme. Today hero card, filter on "All", five earlier puzzles: one open (3 reps left), three converted (rep 2, rep 1, rep 3), one missed. |
| `prototype-desktop.html` | Desktop (≥900px), light theme. Same content in a single centered column, max 760px wide, under a 64px top bar. |
| `prototype-dark.html` | Phone, dark theme. Same content. |
| `prototype-desktop-dark.html` | Desktop, dark theme. Same content. |

Empty, loading and error states are not prototyped.

## Entry and exit

**Entry**
- "All puzzles" on Landing.

**Exit**
- Header back button → Landing (`01-landing`).
- Today hero card → Protect (`04-protect`) for today's puzzle.
- Earlier row with status "N reps left" → Protect for that puzzle.
- Earlier row with status "✓ Rep N" or "Missed" → Result (`08-result`) for that puzzle (as linked in the prototype; see Open questions).
- System/browser back → Landing.

## Layout

Phone baseline 390×844. Background `cream`, text `ink-green`. Column layout.

1. **Header**, 52px, no shrink, 1px `sand-border` bottom border, padding 0 8px, 4px gap, items centered.
   - Back button: 44×44, 22px chevron-left icon (stroke 2.2, round caps), `aria-label="Back"`.
   - Title "Puzzles": Title type (`title`: 20px, 900, uppercase, 0.01em), `h1`.
2. **Main**, fills the remaining height, padding 16px 16px 0, column, 16px gap. The prototype clips overflow; in the app the main region scrolls vertically (the header stays fixed).
3. **Today hero card**: link, full width (358px), 168px tall, radius 18px, overflow hidden, text Cream.
   - Background SVG 358×168: `turf` with `turf-stripe` bands 42px tall at y 0 and 84; lines at y 42, 84, 126 (`field-line` 25% opacity). First-down line y 74 and line of scrimmage y 122, both drawn from x 190 to 358 (2px, `first-down-line` / `scrimmage-line`). Three routes (2px, 90% opacity, colors `receiver-x`, `receiver-y-route`, `receiver-z`), five linemen r 4.5 (`lineman`) at x 252–300 y 122, QB r 5 (`quarterback`) at 276,146. Static art; path data is in the prototype.
   - Left scrim: 230px wide, full height, `linear-gradient(90deg, rgba(10,30,20,.92) 55%, rgba(10,30,20,0))`.
   - Content, absolute at left 16, top 16, bottom 16; column, space-between:
     - Top group (column, 8px gap): "Today" (12px, 800, uppercase, 0.04em, `snap-orange-on-dark`); down and distance (30px, 900, line-height 1, uppercase) with spot (13px, 800, uppercase, `on-turf-muted`) on one baseline row, 6px gap; puzzle label (13px, `on-turf-muted`).
     - "Play" button look (not a separate control): 36px tall, padding 0 14px, 12px radius, `snap-orange` fill, white 14px 900 uppercase, 14px play triangle, 6px gap, aligned left.
4. **Filter**: segmented control, full width. Track `paper-white`, 1px `sand-border`, 12px radius (`control`), 3px padding, 3px gap. Three equal options 38px tall, 9px radius (`control-inner`), 13px 800 uppercase, `sage-muted` text. Selected: `ink-green` fill, `cream` text. Each option's hit area extends to at least 44px tall without changing the drawing (DESIGN.md Touch targets).
5. **Earlier list**: column.
   - Section label "Earlier": 12px, 800, uppercase, 0.04em, `sage-muted`, 16px top padding.
   - **Row** (link): flex, centered, 12px gap, padding 10px 0, 1px `sand-border` bottom border. Height 76px (56px thumbnail + padding).
     - Thumbnail: 56×56, 10px radius, see below.
     - Text column (grows, `min-width: 0`, 5px gap):
       - Down and distance (17px, 900, uppercase, line-height 1) + spot (12px, 800, uppercase, `sage-muted`), baseline, 6px gap.
       - Label: 13px, `sage-muted`, line-height 1.2, single line, `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`.
     - Status chip: no shrink, 26px tall, padding 0 10px, 13px radius, 5px gap, 12px 800 uppercase, line-height 1. Variants:
       - **Open** ("N reps left"): transparent, 1.5px `snap-orange-text` border, `snap-orange-text` text. (The prototype border is still `snap-orange`; DESIGN.md names `snap-orange-text` for this chip.)
       - **Converted** ("✓ Rep N"): `ink-green` fill, `cream` text, 12×12 check icon (stroke `cream`, 1.8) before the text.
       - **Missed**: transparent, 1.5px `sand-strong` border, `sage-muted` text.
   - **Thumbnail** (56×56 SVG): `turf` background; line of scrimmage at y 44 (`scrimmage-line`, 1.6px); first-down line (`first-down-line`, 1.6px) above it at a distance that grows with yards to go; five linemen r 2.6 (`lineman`) at x 18, 23, 28, 33, 38, y 44; QB r 2.8 (`quarterback`) at 28,51. When the goal line falls inside the frame, draw it at the top as a 3px `cream` line at 50% opacity (the "2nd & 4 · opp 22" row shows it at y 8). The first-down offsets in the prototype are 10 (2 yds), 10 (4 yds), 17 (7 yds), 24 (10 yds) and 33 (14 yds) units; see Open questions for the scale.

### Desktop (`prototype-desktop.html`, ≥900px)

There is no field stage. Per DESIGN.md, Puzzles on desktop is a single centered column.

1. **Top bar**: 64px, padding 0 28px, 1px `sand-border` bottom border, three parts spaced apart, centered vertically.
   - Left (8px gap): back button (44×44, the same chevron, `aria-label="Back"`; `href="#"` in the prototype, goes to Landing) and the "OMAHA" wordmark (24px, 900, 0.02em).
   - Center: "Puzzles", 20px, 900, uppercase. It is a plain `span` in the prototype; it stays the page `h1` (see Accessibility).
   - Right: an empty 120px spacer that keeps the title visually centered.
2. **Main**: full width, max-width 760px, centered (`margin: 0 auto`), padding 32px 32px 48px, column, 20px gap. The page scrolls as a whole.
3. **Today hero card**: as on phone (168px tall, 18px radius, same scrim and content), stretched to the column width (up to 696px). The SVG fills the card with `width="100%" height="100%"` and `preserveAspectRatio="xMaxYMid slice"`, so the field art stays anchored right and is cropped, not stretched.
4. **Filter**: as on phone, but options are 42px tall (13px text).
5. **Earlier list**: identical to the phone (rows, thumbnails, chips, ellipsis labels), at the column width.
6. **Below 900px**: the phone layout (`prototype.html`).

### Dark theme (`prototype-dark.html`, `prototype-desktop-dark.html`)

Only what differs from light:
- Background Charcoal (`dark-bg`); text, back chevron and links Cream; link hover Paper White.
- Header and desktop top-bar border, and row dividers: Dark Border (`dark-border`).
- Spot, row labels and the "Earlier" label: Dark Muted (`dark-muted`).
- Filter: track Dark Surface (`dark-surface`) with a 1px Dark Border; unselected options Dark Muted; selected option Cream fill with Charcoal text.
- Chips: converted is Cream fill with Charcoal text and check; open text and 1.5px border are Snap Orange on Dark (`snap-orange-on-dark`); missed has a 1.5px Sage Muted (`sage-muted`) border and Dark Muted text.
- Unchanged: the today hero card (art, scrim, text colors and Play pill) and the thumbnails.

## Content and copy

**[puzzle]** = authored per puzzle, from puzzle data. **[local]** = from local storage.

| Element | Copy | Source |
|---|---|---|
| Header title | `Puzzles` | static |
| Back button label | `Back` (aria-label) | static |
| Today card eyebrow | `Today` | static |
| Today card situation | `3rd & 10` + `own 45` | **[puzzle]** |
| Today card label | `Field goal won't cut it.` | **[puzzle]** short label |
| Today card button text | `Play` | static |
| Today card aria-label | `Today's puzzle: 3rd and 10, own 45. Field goal won't cut it` | built as `Today's puzzle: ` + down and distance (spoken form) + `, ` + spot + `. ` + short label without its final period |
| Desktop top-bar wordmark | `OMAHA` | static |
| Filter options | `All`, `Open`, `Converted` | static |
| Filter group label | `Show puzzles` (aria-label) | static |
| Section label | `Earlier` | static |
| Row situation | e.g. `4th & 2` + `opp 41` | **[puzzle]** |
| Row label | e.g. `Go for it or go home.` | **[puzzle]** short label, ≤26 characters, trash-talk voice |
| Chip, open | `N reps left` (e.g. `3 reps left`) | **[local]** 4 − reps used |
| Chip, converted | check icon + `Rep N` (e.g. `Rep 2`) | **[local]** rep on which the puzzle was converted |
| Chip, missed | `Missed` | **[local]** all 4 reps used, not converted |

Prototype rows (placeholder content):

| Situation | Label | Chip |
|---|---|---|
| 4th & 2 · opp 41 | Go for it or go home. | 3 reps left |
| 2nd & 4 · opp 22 | Red zone, 38 seconds left. | ✓ Rep 2 |
| 3rd & 7 · own 30 | Tied late. Don't blink. | Missed |
| 1st & 10 · own 20 | Up 1. Milk the clock. | ✓ Rep 1 |
| 3rd & 14 · opp 35 | Kicker is warming up. | ✓ Rep 3 |

Labels truncate with an ellipsis; they never wrap. No label may name a real team or player.

## Components

- **Segmented control** (`segmented-control`, `segmented-option-selected`): options 38px tall on phone and 42px on desktop, 13px text instead of DESIGN.md's 14px. Hit area extended to 44px.
- **Status chip**: three variants above. Not in DESIGN.md.
- **Today hero card**: screen-specific; its "Play" pill is styled like a small Primary button but is part of the card link, so the screen still has one orange action.
- **Puzzle row**: screen-specific list item with a field thumbnail.
- **Field glyphs** (linemen, QB, first-down line, line of scrimmage) at thumbnail scale.

## States

1. **Default, filter All (prototyped).** Today card plus all earlier puzzles.
2. **Filter Open (not prototyped).** Earlier list shows only puzzles with reps remaining and no conversion. The "Earlier" label stays.
3. **Filter Converted (not prototyped).** Earlier list shows only converted puzzles.
   - Missed puzzles match neither Open nor Converted, so they appear only under All.
4. **Filter with no matches (not prototyped).** For example Converted with no conversions. Copy and layout are open questions.
5. **No earlier puzzles (not prototyped).** First day of the season, or the season's puzzle list has only today. The Earlier section has nothing to show; treatment is an open question.
6. **Today in progress or finished (not prototyped).** The today card in the prototype has no status. How it shows reps used, a conversion or a miss, and where it links, is an open question (it should agree with Landing's states).
7. **Puzzle never played (not prototyped).** A past puzzle with no local record. Whether its chip reads "4 reps left" (and so counts as Open) or something else is an open question.
8. **Loading / error (not prototyped).** The puzzle index fails or is pending. No design; open question.

## Interactions

- Tap back → Landing.
- Tap the today card (anywhere) → Protect for today's puzzle.
- Tap a filter option → selects it (single selection) and filters the Earlier list immediately. Default selection is All each time the screen opens; whether the choice persists is an open question.
- Tap a row (anywhere) → destination by status (see Entry and exit).
- Hover: rows keep `ink-green` text; the back link hovers to `ink-green-deep`. The prototype defines no hover background.
- Scroll: on phone the main region scrolls when content exceeds the viewport. On desktop the page scrolls.
- Desktop: same controls and focus order. The back button sits in the top bar before the wordmark.
- Keyboard focus order: back → today card → filter → each row top to bottom. The filter is a radio group: Tab enters it at the selected option, Left/Right arrows move and select, Tab leaves it. Rows and the card activate with Enter.

## Motion

None.

## Accessibility

- Header title is the `h1` on phone and desktop. The desktop prototype marks it up as a `span`; use an `h1` with the same styling.
- Today card link has a descriptive `aria-label` built from down, distance, spot and label (spoken as "3rd and 10, own 45"). Its SVG is `aria-hidden`.
- Filter: `role="radiogroup"` with `aria-label="Show puzzles"`; options are `role="radio"` with `aria-checked`.
- Thumbnails and the check icon are `aria-hidden`. Each row's accessible name must include situation, label and status (for example "4th and 2, opp 41. Go for it or go home. 3 reps left"); the converted chip must read "Converted on rep 2" or similar since the check is hidden. The exact accessible wording is not in the prototype; any phrasing that includes all three parts satisfies this.
- Status never relies on color alone: each chip has text, the converted chip also has a check.
- Contrast: open chip text `snap-orange-text` on Cream 4.84:1, Sage Muted on Cream 4.93:1, "Today" `snap-orange-on-dark` on the scrim about 5.9:1, `on-turf-muted` on the scrim about 7:1. All pass AA. The missed chip border (`sand-strong`) is 1.91:1 against Cream; it is decorative because the text carries the status.
- Touch targets: back 44×44, rows 76px tall, filter options drawn at 38px (42px desktop) with hit areas of at least 44px.
- Reduced motion: nothing animates.

## Data

| Field | Source |
|---|---|
| List of published puzzles this season: ID/number, date, down, distance, spot, short label | static host. PRODUCT.md ships one JSON file per daily puzzle; listing them needs an index of some kind (form not specified, see Open questions) |
| Goal-line distance for the thumbnail | derived from spot (yard line + side) |
| Today's puzzle ID | date in US Eastern time |
| Per puzzle: reps used, converted flag and rep number | local storage, keyed by puzzle |

## Open questions

- **Archive conflict:** PRODUCT.md lists "Archive" as post-MVP, and this screen lets players open and play earlier puzzles, which is effectively an archive. Is this screen in the MVP, and if so does PRODUCT.md change? Not resolved here.
- **Finished-puzzle destination:** the prototype links converted and missed rows to Result. Which result (the final rep?), or Pros reveal, or Share? Should agree with Landing's finished state.
- **Playing earlier puzzles:** do results on past puzzles count toward score, streak or the "% beat the pros" stat? Are they submitted to the results API?
- **Never-played chip:** "4 reps left", or a different chip?
- **Today card states** for in progress and finished, and whether the filter applies to it.
- **Sort order and dates:** the prototype shows no dates. Newest first? Show dates or puzzle numbers?
- **List length:** whole season in one scroll, or paged? Season-bound per PRODUCT.md.
- **Puzzle index:** how the client learns which past puzzles exist (an index JSON, a build-time manifest, or an API call).
- **Empty states** (no matches, no earlier puzzles), loading and error.
- **Filter persistence** across visits.
- **Missed puzzles** have no filter of their own; intended?
- **Thumbnail scale:** the 7, 10 and 14-yard rows use about 2.4 units per yard, but the 2-yard row uses 10 units (5 per yard) and the 4-yard row also 10 units. Define the scale, and the rule for drawing the goal line.

## Acceptance criteria

- [ ] At 390×844 the screen matches `prototype.html`: 52px header, 168px today card with 18px radius, segmented filter, "Earlier" label, rows 76px tall.
- [ ] Header back button has `aria-label="Back"` and navigates to Landing.
- [ ] Today card renders down, distance, spot and short label from puzzle data and navigates to Protect for today's puzzle.
- [ ] Each earlier row renders down, distance, spot and label from puzzle data, and a status chip from local storage.
- [ ] A label longer than the available width truncates to one line with an ellipsis.
- [ ] Chip variants match: "N reps left" (`snap-orange-text` outline and text), check + "Rep N" (`ink-green` fill, `cream` text), "Missed" (`sand-strong` outline, `sage-muted` text).
- [ ] The today card's "Today" label is `snap-orange-on-dark` and its spot and label are `on-turf-muted`. Its `aria-label` reads "Today's puzzle: 3rd and 10, own 45. Field goal won't cut it" for the prototype fixture.
- [ ] Each filter option has a hit area at least 44px tall.
- [ ] At ≥900px the layout matches `prototype-desktop.html`: 64px top bar (back + wordmark left, "Puzzles" centered), a single column max 760px wide with 32px side padding, the today card art anchored right and cropped (not stretched), filter options 42px tall.
- [ ] Below 900px the phone layout is shown.
- [ ] Rows with reps left go to Protect for that puzzle; converted and missed rows go to that puzzle's Result (until the open question changes it).
- [ ] Filter All shows every earlier puzzle; Open shows only rows with reps left; Converted shows only converted rows.
- [ ] Filter is a radio group operable with Tab and arrow keys; `aria-checked` tracks the selection.
- [ ] Thumbnails draw the first-down line above the line of scrimmage by a distance that grows with yards to go, and draw the goal line when it is in frame.
- [ ] The main region scrolls when the list overflows; the header stays fixed.
- [ ] No real team or player name appears in any fixture.
- [ ] Each row's accessible name includes situation, label and status.
- [ ] Dark theme matches `prototype-dark.html` and `prototype-desktop-dark.html`; the today card and thumbnails are identical in both themes.
