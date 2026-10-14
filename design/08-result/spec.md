# Result

## Purpose

Tell the player what happened on the rep and why. The field freezes on the final frame with the defense's play art drawn over it (Madden zone colours, drop lines, man, rush and blitz paths, start dots), the dashed ball path and a feedback badge on every receiver. A result sheet gives the verdict, a cause-first line, three stats, the rep count and the next action: run it back, or see how the pros did.

## Prototypes

| File | Shows |
|---|---|
| `prototype.html` | Phone, light. Rep 1 incomplete against Cover 4. Same content as `states/incomplete.html`. |
| `prototype-dark.html` | Phone, dark theme, same rep. Charcoal sheet with a cream headline. |
| `prototype-desktop.html` | Desktop ≥900 px. 64 px top bar, field stage on the left, 440 px result panel on the right, keyboard hints. Same rep. |
| `prototype-desktop-dark.html` | Desktop, dark theme, same rep. |
| `states/incomplete.html` | Rep 1, INCOMPLETE, cream sheet, 3 reps left. |
| `states/short.html` | Rep 2, SHORT (+7), cream sheet with a gold tile, 2 reps left. |
| `states/sack.html` | Rep 3, SACKED (−6), cream sheet, 1 rep left, no ball path, left end's rush path drawn. |
| `states/interception.html` | Rep 1, PICKED OFF, cream sheet, football drawn at the interception point. |
| `states/throwaway.html` | Rep 1, INCOMPLETE after a throwaway, cream sheet, 3 reps left. Read order TE, Right WR, Left WR, all covered; ball path to just past the left sideline; the slot, not in the order, was open. |
| `states/converted.html` | Rep 2, CONVERTED (+12), ink-green sheet, 3.5 px first-down line, key pill "Defense · Cover 4". |
| `states/out-of-reps.html` | Rep 4 failed, OUT OF REPS, charcoal sheet, key pill "Defense · Cover 4". |
| `states/incomplete-dark.html`, `short-dark.html`, `sack-dark.html`, `interception-dark.html`, `throwaway-dark.html`, `converted-dark.html`, `out-of-reps-dark.html` | The seven states in the dark theme. |
| `coverages/cover-4.html` | Play art for Cover 4 (rep 1, no key pill). |
| `coverages/tampa-2.html` | Play art for Tampa 2. |
| `coverages/cover-0-lb-blitz.html` | Play art for Cover 0 with both linebackers blitzing. |
| `coverages/zone-blitz.html` | Play art for a zone blitz. |

## Entry and exit

- **Entry:** the end of the live play reveal (07-live-play), or Skip there. The first frame must match the live play's last frame exactly. Also entered from Replay (09-replay) "back to Result", with no animation.
- **Exit:**
  - Replay square → Replay (09-replay) for this rep, which returns here.
  - RUN IT BACK (cream sheet) → Protect (04-protect) for the next rep, with the previous design kept for editing.
  - SEE HOW THE PROS DID (ink-green and charcoal sheets) → Pros reveal (10-pros-reveal).

## Layout

### Phone (390×844, `prototype.html` and `states/*.html`)

| Region (top to bottom) | Position and size | Notes |
|---|---|---|
| Field | SVG at (0,0), 390×479 px, `viewBox="0 0 403 495"` | Final frame and play art (see Components). |
| Field shade | 390×479 px over the SVG | Field shade `rgba(6,13,10,.22)`. Dims everything in the SVG. |
| Situation pills | `left:12px; right:12px; top:14px`, flex, `space-between` | Two `field-pill`s. |
| Key pill | `left:12px; top:50px` | `field-key-pill`, only on converted and final-rep results. |
| Result sheet | `bottom:0`, full width, 398 px tall | Padding `26px 20px 22px`, top corners 28 px (`rounded.sheet`), Sheet shadow `0 -12px 32px rgba(0,0,0,.45)`. Flex column with `justify-content: space-between` over four groups. The sheet top sits at 446 px, overlapping the field's bottom 33 px. |

Sheet groups, top to bottom:

1. **Header** (column, gap 8 px): headline row (outcome tile 44×44, then a 12 px gap, then the `h1`) and the result line (17 px, 500).
2. **Stat triplet**: flex, gap 12 px, padding `16px 0`, 1 px rule on top and bottom.
3. **Rep row**: rep boxes (gap 6 px) on the left, status text (15 px, 700) on the right, centred vertically.
4. **Action row** (gap 8 px): secondary square 56×56, then the primary CTA (flex-grow, 56 px).

### Dark theme (`prototype-dark.html`, `prototype-desktop-dark.html`, `states/*-dark.html`)

The field and pills are unchanged. Page background Charcoal.

**Cream sheet** (incomplete, short, sack, interception): sheet background Charcoal (#18201C, not Dark Surface). Headline Cream. Result line Dark Muted Strong (#B8C4BD). Rules Dark Border (#34403A). Stat values Cream. Stat labels Dark Muted (#A3B1A9). Rep boxes: unused have a Dark Border border and Dark Muted number. Used and short boxes have a Cream border, `rgba(244,239,228,.14)` fill and Cream ✕ or yards. The next box has a Cream border and number. Status text Cream. Secondary square: Dark Surface (#232C27) fill, Dark Border border, Cream icon. Outcome tiles and CTA unchanged.

**Ink-green sheet** (converted): identical to light.

**Charcoal sheet** (out of reps): identical to light, except the headline row adds the orange ✕ outcome tile (`outcome-tile-fail`, 44×44) with the 12 px gap, and the headline drops to 44 px, so the sheet still reads as the end of the puzzle against the charcoal page.

**Desktop panel:** the cream-sheet mapping at desktop sizes. Panel background Charcoal; headline, stat values and status Cream; result line, stat labels and the hint Dark Muted; rules, panel left border and top-bar border Dark Border; spot and meta Dark Muted; used pip Dark Muted, other pips Dark Border. Rep boxes as on phone. Secondary square Dark Surface with a 2 px Dark Border and Cream icon. The hint's `kbd` is Dark Surface with a 1 px Dark Border and Cream text. Stage, field, "Final · defense revealed" pill, outcome tile and CTA unchanged.

### Desktop (≥900 px, `prototype-desktop.html`)

These values follow DESIGN.md Layout › Desktop control variants: primary button 58 px tall with a 10 px radius and 19 px label; secondary square 58 px with a 10 px radius and 2 px border; field pills 30 px with 13 px text; rep boxes 34 px; result line 18 px 600 Sage Muted. Desktop result screens show the field without the shade and add the "Final · defense revealed" pill.

| Region | Values |
|---|---|
| Top bar | 64 px, padding `0 28px`, gap 16 px, 1 px Sand Border bottom. Left: "OMAHA" 24 px 900, letter-spacing .02em. Centre: "3rd & 10" 20 px 900 uppercase, baseline-aligned 10 px from "own 45" 14 px 800 uppercase Sage Muted. Right (gap 14 px, 14 px 600 Sage Muted, tabular): "#148", "Down 4 · 1:12", and four 9 px rep pips (gap 5 px). The used pip is filled #5A6B62 and the rest Sand Border, `aria-label="Rep 1 used, 3 left"`. |
| Body | Grid `minmax(0,1fr) 440px`. |
| Field stage | Background #0C3322 (Turf stage), padding 24 px, field centred. Field `height: calc(100vh - 112px)`, `width: auto`, `max-width: 100%`, radius 10 px. No field shade and no situation pills on the field. One pill, "Final · defense revealed", at `top:36px; left:36px`: 30 px tall, padding `0 12px`, radius 15 px, 13 px 700. On converted and out-of-reps results the key pill sits directly below it, 8 px apart, at the same left edge and size. |
| Panel (`<aside aria-label="Rep result">`) | 440 px, 1 px Sand Border on the left, padding 28 px, flex column, gap 26 px. Cream background with charcoal text, as the cream sheet. |
| Panel header | Padding-top 12 px, gap 8 px. Outcome tile 52×52, radius 12 px, 24 px ✕. 14 px gap. `h1` 46 px 900. Result line 18 px 600 Sage Muted. |
| Stat triplet | Rule padding `16px 0`, gap 12 px. Values 32 px 900 Charcoal. Labels 13 px 600 Sage Muted. Column gap 6 px. |
| Rep row | Rep boxes 34×34 (gap 8 px, 13 px 800, 14 px ✕). Status "3 reps left" 15 px 800 Ink Green. |
| Spacer | Flex-grow. |
| Actions | Column, gap 10 px. Row (gap 10 px): square 58×58, radius 10 px, 2 px Sand Border, Paper White, Ink Green icon. Then the CTA: 58 px tall, radius 10 px, Snap Orange, 19 px 900 uppercase, "Run it back" followed by `kbd` "Enter" (11 px 700, padding `3px 7px`, radius 5 px, `rgba(255,255,255,.22)`). Hint under it: "`R` watch the replay again", 12 px 600 Sage Muted, centred. The hint's `kbd` is Paper White with a Sand Border and Ink Green text. |

Below 900 px the app uses the phone design (`prototype.html`, `states/*.html`). The desktop prototype's stacked fallback is not shipped.

## Content and copy

Legend: **[P]** puzzle data, **[S]** simulation, **[D]** design state, **[R]** rep history, **[L]** local storage, **[G]** generated or authored per outcome cause.

### Fixed elements

| Element | Copy |
|---|---|
| Situation pills | `3rd & 10 · own 45` [P], `Down 4 · 1:12` [P] |
| Key pill | `Defense · ` + coverage name [P], for example `Defense · Cover 4` (shown uppercase by CSS) |
| Desktop field pill | `Final · defense revealed` |
| Replay square | Icon only, `aria-label="Watch the replay again"` |
| CTA, cream sheet | `RUN IT BACK` |
| CTA, ink-green and charcoal sheets | `SEE HOW THE PROS DID` |
| Desktop hint | `R` + " watch the replay again". The CTA holds the `Enter` hint. |

### States (exact prototype copy; numbers are placeholders from [S], [R], [L])

| State | Sheet | Tile | Headline | Result line (example) [G] | Stats (value / label) | Rep boxes | Status | CTA |
|---|---|---|---|---|---|---|---|---|
| Incomplete (rep 1) | Cream | Orange ✕ | `INCOMPLETE` | "Swatted. The safety was parked on that corner." | `0` yards gained · `2.3s` in the pocket · `TE` 1st read | ✕ · 2 next · 3 · 4 | `3 reps left` | RUN IT BACK |
| Short (rep 2) | Cream | Gold `+7` | `SHORT` | "Seven yards on 3rd & 10. Close doesn't count." | `+7` yards gained · `1.6s` in the pocket · `Slot` 1st read | ✕ · +7 · 3 next · 4 | `2 reps left` | RUN IT BACK |
| Sack (rep 3) | Cream | Orange ✕ | `SACKED` | "Left end won the edge. Your reads took too long to come open." | `−6` yards · `3.6s` in the pocket · `TE` on 2nd read | ✕ · +7 · ✕ · 4 next | `1 rep left` | RUN IT BACK |
| Interception (rep 1) | Cream | Orange ✕ | `PICKED OFF` | "Thrown right to the safety. He says thanks." | `0` yards gained · `2.0s` in the pocket · `Left WR` 1st read | ✕ · 2 next · 3 · 4 | `3 reps left` | RUN IT BACK |
| Throwaway (rep 1) | Cream | Orange ✕ | `INCOMPLETE` | "All three reads covered. The open slot wasn't on your list." | `0` yards gained · `2.9s` in the pocket · `—` thrown away | ✕ · 2 next · 3 · 4 | `3 reps left` | RUN IT BACK |
| Converted (rep 2) | Ink green | none | `CONVERTED` | "Slot out for 12. Take notes, real OC." | `+12` yards gained · `77` points · `4` day streak | ✕ · ✓ · 3 dashed · 4 dashed | `Converted in 2` | SEE HOW THE PROS DID |
| Out of reps (rep 4 failed) | Charcoal | none | `OUT OF REPS` | "Four reps, no first down. Film room. Now." | `0` points · `+7` best rep · `4` reps used | ✕ · +7 · ✕ · ✕ | `No reps left` | SEE HOW THE PROS DID |

Coverage examples (all rep 1, Incomplete, same stats as the first row):

| File | Result line (example) |
|---|---|
| `coverages/cover-4.html` | "Swatted. The safety was parked on that corner." |
| `coverages/tampa-2.html` | "The safety ditched his half to swat it. The go was wide open." |
| `coverages/cover-0-lb-blitz.html` | "Zero safeties deep and you found the covered guy." |
| `coverages/zone-blitz.html` | "The corner jumped it. The go route was waving at you." |

### Copy rules

- **Headline by outcome:** incomplete `INCOMPLETE`, short `SHORT`, sack `SACKED`, interception `PICKED OFF`, converted `CONVERTED`. When rep 4 fails or falls short, the headline is `OUT OF REPS` and replaces the rep's own headline.
- **Result line:** one sentence pair, cause first, jab second (DESIGN.md Voice). It is authored or generated per outcome cause, never per outcome kind alone. Inputs: outcome kind, yards and the distance to gain, the cause code, the decisive defender's role, the targeted receiver and route, any receiver who was open, and the rep count (for out of reps). On a rep where the coverage name is hidden, the line must not name the coverage. The lines above are examples, not final copy.
- **Yards values:** signed, with `+` for gains and U+2212 `−` for losses. Zero is `0`. The sack's label is `yards`; every other label is `yards gained`.
- **Time in the pocket:** seconds with one decimal and a trailing `s` ("2.3s"), from snap to throw, or to the sack.
- **Read stat:** the read the ball went to [S]. The value is the receiver's short name [P]; the label is that read's place in the order, `1st read`, `2nd read` or `3rd read`. A throwaway shows `—` over `thrown away`. A sack shows the read the QB was on over `on 1st read` (`on 2nd read`, `on 3rd read`). The Fit Rule applies: the value must never wrap. The receiver and the place don't fit one value at 26 px in a phone stat column (about 108 px), so they split between value and label. The short name is the text the field draws on that receiver (`WR`, `TE`, `RB`). The receiver's player colour tells the wide receivers apart: colored text fails AA on Cream, so the value shows the receiver's swatch (as on the read options, 14 px, ring colour) before the name, and the name keeps the stat value colour.
- **Status text:** `N reps left` (N ≥ 2), `1 rep left`, `Converted in N` (N = the converting rep), `No reps left`.
- **Converted stats:** yards gained [S], points [engine scoring], day streak [L].
- **Out-of-reps stats:** points (`0`), best rep (the largest yards across reps, signed) [R], reps used (`4`). When no rep gained yards, best rep still shows the actual best value, signed: `0`, or for example `−3` when every rep lost yards. No dash.
- **Short tile:** the rep's yards, signed ("+7").

## Components

- **Field** with **Field glyphs** (players at final positions, Ball, Receiver feedback badges) and defense play art (below).
- **Field shade** over the field (phone only).
- **Situation pill** (`field-pill`) ×2. **Key pill** (`field-key-pill`) on converted and final-rep results.
- **Result sheet:** `result-sheet` (cream), `result-sheet-win` (ink green), `result-sheet-over` (charcoal).
- **Outcome tile** (`outcome-tile-fail`, `outcome-tile-short`).
- **Stat triplet**, **Rep boxes**, **Secondary square** (`button-secondary-square`), **Primary** (`button-primary-result`).

### Sheet variants

| Part | Cream (`result-sheet`) | Ink green (`result-sheet-win`) | Charcoal (`result-sheet-over`) |
|---|---|---|---|
| When | Failed or short rep, reps remain | Converted on any rep | Rep 4 failed or short |
| Background | Cream | Ink Green | Charcoal |
| Headline | Charcoal, 44 px, with tile | Cream, 50 px, no tile | Cream, 50 px, no tile |
| Result line | Sage Body (#4A5C53) | Win Subtext (#D9E3DC) | Dark Muted (#A3B1A9) |
| Rules | Sand Border | `rgba(244,239,228,.2)` | Dark Border (#34403A) |
| Stat values | Charcoal | Read Gold | Snap Orange |
| Stat labels | Sage Muted | Win Muted (#B3C4BA) | Dark Muted |
| Status text | Charcoal | Cream | Cream |
| Secondary square | Paper White, 1 px Sand Border, Ink Green icon | Transparent, 1 px `rgba(244,239,228,.35)` border, Cream icon | Same as ink green |

Headline: 900, letter-spacing −0.01em, line-height 0.9, uppercase text. Display is 50 px; it drops to 44 px beside a tile. Result line: 17 px 500 (Body).

Outcome tile: 44×44 with a 10 px radius (`outcome-tile-fail`, `outcome-tile-short`), `aria-hidden`. Fail: Snap Orange with a white ✕ (20 px icon, stroke 3, round caps). Short: Read Gold with the yards in 17 px 900, On Tile colour (#1E2B22).

Stat triplet: three equal columns, gap 5 px between value and label. Value uses the Stat style: 800, 26 px, tabular numerals (desktop 900 at 32 px). Label 12 px, line-height 1.

Rep boxes: four 30×30 boxes, radius 8 px, 1.5 px border, 12 px 700.

| Box | Cream sheet | Ink-green sheet | Charcoal sheet |
|---|---|---|---|
| Used, no gain (incomplete, sack, interception) | Ink Green border, `rgba(36,74,62,.12)` fill, 12 px Ink Green ✕ (stroke 2) | Cream border, `rgba(244,239,228,.14)` fill, Cream ✕ | Cream border, `rgba(244,239,228,.14)` fill, Cream ✕ |
| Used, short | As above, with the yards ("+7") in 11 px 800 Ink Green | Not prototyped | As above, yards in Cream |
| Next | Ink Green border, Ink Green number | — | — |
| Unused | Sand Border, Sage Muted number | — | `rgba(244,239,228,.3)` border, Dark Muted number |
| Converted | — | Cream fill and border, 14 px Ink Green check (stroke 2.2) | — |
| Not needed | — | Dashed `rgba(244,239,228,.3)` border, Win Muted number | — |

CTA (`button-primary-result`): 56 px, radius 16 px (`rounded.cta-result`), Snap Orange, white uppercase 900 text at 19 px (`typography.button`). Hover Snap Orange Deep.

### Defense play art (drawing rules)

Every rep's result draws the defense's play art from data (`DefensePlayArt`, see Data). Draw order inside the SVG, back to front:

1. Field: turf, stripes, hash marks, yard lines, numbers, first-down line (2 px, or 3.5 px on a converted result), line of scrimmage.
2. **Ball path**, except on a sack. A quadratic curve from the QB's position at the throw through the control point to the end point (DESIGN.md Ball). On a throwaway the end point is the landing spot just past the nearest sideline, so the path runs off the field's edge. Stroke #F2F5F3, opacity .7, width 1.8, `stroke-dasharray="2 5"`, round caps.
3. **Football**, on an interception only (DESIGN.md Ball). Ellipse rx 4.2, ry 2.7, rotated along its flight direction, at the end of the ball path. Fill Football #8B5A2B, white edge 0.8. No other outcome draws the football on this screen.
4. **Zones.** One ellipse per zone (`cx, cy, rx, ry` from data), filled with the zone colour at `fill-opacity .3` and stroked in the same colour at `stroke-opacity .85`, width 1.4. Zone colours: deep → Zone Deep #3D7BFF, flat → Zone Flat #7FD8FF, hook/curl → Zone Hook #FFD84A, curl-flat → Zone Curl-Flat #B57CFF. A zone shows the assigned area; the defender may finish outside it (Tampa 2 safety, Cover 4 safety).
5. **Start dots.** A circle of r 3, no fill, stroke Start Dot #7E8B85 1.2, at the pre-snap spot of every defender that has a drawn path. Defenders without a path get no dot.
6. **Zone drop lines.** A polyline from the pre-snap spot through any waypoints toward the defender's final spot, in that defender's zone colour, width 1.8, round caps and joins, no arrowhead.
7. **Man and rush paths.** The same polyline in Defense Path #C4CFC8, width 1.8, round caps and joins, with an open arrowhead. A lineman's rush path is drawn only when he is the decisive defender on a sack (`cause.decisive`). Every other lineman rushing, edge rushers included, gets no path and no start dot.
8. **Blitz paths.** Every rusher who isn't a lineman. The same polyline in Snap Orange #E05A2B, width 2.4, round caps and joins, with an open arrowhead.
9. **Defenders** at final spots: r 7.5, fill #071710, Cream ring 2.2.
10. **Linemen** at final spots: r 8, fill #A4AAAF, stroke #DADDE0 1.2.
11. **Receivers, RB and QB** at final spots: r 8.5. Receivers are filled #0E2219 with a 2.2 ring in their player colour and a white 6.5 px 700 label at y +2.3. The QB is filled #F2F5F3 with a #0A1410 label.
12. **Receiver feedback badges.**

Path geometry, for all three path kinds:

- Every path ends 10.5 units short of the defender's final centre, measured back along the last segment, so it stops just outside the disc.
- Arrowhead: two open chevron arms, 5 units long, at ±38° from the reversed direction of the last segment, starting at the trimmed end point, in the path's colour and width.

Receiver feedback badges: one per route-running receiver (no badge on a receiver who stayed in to block), r 7.

| Status | Glyph |
|---|---|
| Open | Fill #F2F5F3. Check `M-3.2 0.2L-1 2.5L3.3 -2.3`, stroke #0A1410 1.6, round caps and joins. |
| Contested | Fill #0A1410, stroke #F2F5F3 1.5. Wave `M-3.6 0.6Q-1.8 -2.2 0 0.4T3.6 0`, stroke #F2F5F3 1.5, round caps. |
| Covered | Fill #0A1410, stroke Start Dot #7E8B85 1.5. ✕ `M-2.6 -2.6L2.6 2.6M2.6 -2.6L-2.6 2.6`, stroke #F2F5F3 1.5, round caps. |

Badge placement: centre at (+11, −11) from the receiver's centre (up and right). Use (−11, −11) when the up-right spot would overlap another player disc, the football or another badge, or would leave the field. Keep the badge inside the field. At x 385 the prototypes use (+8, −12), putting the badge at x 393. The prototypes hand-place some badges, so treat those as targets, not a formula.

### Worked examples

All four use the same offense and final offensive frame: left WR (140,229), TE (318,255), slot WR (366,238), right WR (385,196), RB blocking (266,389), QB (201,440), linemen at y 370, and ball path `M201 432 Q246 300 312 257` to the TE. Entries are pre-snap → [waypoints] → final defender centre; drawn lines stop 10.5 short.

**Cover 4** (`coverages/cover-4.html`)

| Kind | Zones (cx, cy, rx, ry) or paths |
|---|---|
| Deep zones | (62,196,34,22), (152,190,34,22), (300,214,34,24), (372,172,30,22) |
| Hook zones | (176,286,26,16), (240,284,26,16) |
| Curl-flat zone | (332,288,26,16) |
| Deep drops | 54,338→62,202 · 144,238→152,196 · 262,238→306,247 · 385,342→372,176 |
| Hook drops | 181,311→176,288 · 237,311→240,286 |
| Curl-flat drop | 321,320→332,290 |
| Rush (grey) | Right end 281,348→277,373 |
| Not drawn | Interior linemen (146,346→152,354; 192,346→190,352; 235,346→228,352): no path, no dot |
| Badges | Left WR contested, TE covered, slot open, right WR covered |

**Tampa 2** (`coverages/tampa-2.html`)

| Kind | Zones or paths |
|---|---|
| Deep zones | Halves (132,168,46,26) and (300,168,46,26). Deep middle (204,214,22,20). |
| Flat zones | (56,298,24,15), (378,300,22,15) |
| Hook zones | (166,290,26,16), (330,292,26,16) |
| Deep drops | 144,238→132,172 · safety 262,238→[294,186]→306,247 (leaves his half) · linebacker 237,311→[222,268]→204,216 |
| Hook drops | 181,311→166,292 · 321,320→330,294 |
| Flat drops | 54,338→56,300 · 385,342→378,302 |
| Rush (grey) | 281,348→277,373 |
| Badges | Left WR contested, TE covered, slot contested, right WR open |

**Cover 0, LB blitz** (`coverages/cover-0-lb-blitz.html`)

| Kind | Paths |
|---|---|
| Zones | None |
| Man (grey, arrowheads) | 54,338→[58,248]→122,246 · 321,320→[326,256]→350,250 · 262,238→[278,274]→304,249 · 385,342→372,214 · 144,238→[170,266]→186,296 |
| Rush (grey) | 281,348→277,373 |
| Blitz (orange) | 181,311→194,350 · 237,311→215,350 |
| Badges | Left WR open, TE covered, slot contested, right WR covered |

**Zone blitz** (`coverages/zone-blitz.html`)

| Kind | Zones or paths |
|---|---|
| Deep zones | (62,196,36,24), (198,172,40,24), (362,196,36,26) |
| Hook zones | (176,284,26,16), (290,296,26,16) |
| Curl-flat zone | (346,268,26,16) |
| Deep drops | 54,338→62,202 · 144,238→198,176 · 385,342→[392,214]→350,226 |
| Hook drops | 181,311→176,286 · right end 281,348→290,298 (a lineman dropping) |
| Curl-flat drop | 262,238→[300,280]→346,270 |
| Blitz (orange) | Linebacker 237,311→236,351 · nickel 321,320→[300,346]→279,373 |
| Badges | Left WR contested, TE covered, slot contested, right WR open |

## States

| State | Field | Sheet | Key pill |
|---|---|---|---|
| Incomplete, reps left | Ball path, play art, badges | Cream, orange ✕ tile | No |
| Short, reps left | Same | Cream, gold yards tile | No |
| Sack, reps left | No ball path. The sacker's rush path is drawn (prototype: left end 146,346→[134,394]→189,434). QB at the sack spot (201,446). | Cream, orange ✕ tile | No |
| Interception, reps left | Ball path plus the football at the interception point | Cream, orange ✕ tile. Interception counts as a failed rep. | No |
| Throwaway, reps left | Ball path to the landing spot past the nearest sideline, play art, badges. Every read in the order is covered; a receiver outside the order may be open. | Cream, orange ✕ tile, headline INCOMPLETE | No |
| Converted (any rep) | First-down line 3.5 px | Ink green | Yes |
| Out of reps (rep 4 failed or short) | The rep-4 frame as for its outcome | Charcoal, headline OUT OF REPS | Yes |
| Converted on rep 1 | As converted | ✓ then three dashed boxes, `Converted in 1` | Yes |
| Converted on rep 4 | As converted | ✕/yards ×3 then ✓, no dashed boxes, `Converted in 4` | Yes |
| Touchdown | Open question (README) | — | — |
| Returned from Replay | As before, no animation | As before | As before |

The key pill shows only on the converted and out-of-reps states, and never on reps 1–3 unless the rep converted. Play art, start dots and badges show on every rep.

## Interactions

| Control | Action |
|---|---|
| Replay square (tap or click) | Open Replay for this rep |
| RUN IT BACK | Go to Protect for the next rep with the current design loaded |
| SEE HOW THE PROS DID | Go to the Pros reveal |
| Desktop `Enter` | Activates the primary CTA (any sheet variant) |
| Desktop `R` | Opens Replay |

- The field is not interactive.
- Focus: when the result appears (from live play or Skip), focus moves to the sheet's `h1` (`tabindex="-1"`). Tab order: replay square, then the primary CTA. The desktop top bar has no focusable elements in the prototype.
- Keyboard hints show only at ≥900 px.

## Motion

None on this screen. The arrival animation belongs to 07-live-play. Returning from Replay shows the result with no animation. The CTA hover changes the colour to Snap Orange Deep.

## Accessibility

- Field SVG: `role="img"` with a generated `aria-label`. Before the final rep or a conversion it reads "Rep N final frame with the defense revealed: …" and never names the coverage. On converted and out-of-reps results it reads "Rep N final frame against {coverage}: …". Prototype examples:
  - Incomplete: "Rep 1 final frame with the defense revealed: the throw to the tight end is broken up by the safety; the slot receiver was open"
  - Short: "Rep 2 final frame with the defense revealed: the slot receiver catches a five-yard out and is tackled by the nickel three yards short of the first-down line"
  - Sack: "Rep 3 final frame with the defense revealed: the quarterback is on his second read when the left end comes around the edge to sack him six yards behind the line"
  - Throwaway: "Rep 1 final frame with the defense revealed: the tight end, right receiver and left receiver are all covered, so the quarterback throws the ball away past the left sideline; the slot receiver, not in the read order, was open"
  - Interception: "Rep 1 final frame with the defense revealed: the throw to the left receiver's in route is intercepted by the safety sitting over it"
  - Converted: "Rep 2 final frame against Cover 4: the slot receiver catches the ten-yard out beyond the first-down line and is chased down two yards later"
  - Out of reps: "Rep 4 final frame against Cover 4: the throw to the tight end is broken up by the safety, ending the puzzle without a first down"
  - Cover 4 board: "Rep 1 final frame with the defense revealed: four deep quarters and three underneath zones; the safety squeezes the tight end's corner and breaks up the pass; the slot receiver was open underneath"
  - Tampa 2 board: "Rep 1 final frame with the defense revealed: two deep halves, the linebacker running the deep middle, corners squatting in the flats; the right safety leaves the deep half to break up the tight end's corner, leaving the right receiver open deep"
  - Cover 0 board: "Rep 1 final frame with the defense revealed: man coverage on every receiver with no deep help; the safety manned on the tight end breaks up the pass; the left receiver beat his man"
  - Zone blitz board: "Rep 1 final frame with the defense revealed: the linebacker and nickel blitz while the right end drops into coverage behind them; three deep and three underneath; the corner leaves the right receiver to break up the tight end's corner, leaving the go route open"
- Sheet: `<section aria-label="Rep result">` on phone, `<aside aria-label="Rep result">` on desktop. The headline is the `h1`.
- Outcome tile: `aria-hidden="true"`. The headline carries the meaning.
- Rep boxes: the group has an `aria-label` in the form "Reps: rep 1 no gain, rep 2 next, rep 3 unused, rep 4 unused". The state words are `no gain` (incomplete, sack, interception), `short`, `converted`, `next`, `unused`, `not needed`. The icons inside are `aria-hidden`.
- Replay square: `aria-label="Watch the replay again"`, icon `aria-hidden`.
- Badges carry meaning by shape (check, wave, ✕), never by colour alone.
- Contrast (measured): Sage Body on Cream 6.2:1, Sage Muted on Cream 4.9:1, Win Muted on Ink Green 5.4:1, Read Gold on Ink Green 5.3:1, Dark Muted on Charcoal 7.5:1, Snap Orange on Charcoal 4.5:1 (26 px stat, large text). White on Snap Orange is 3.7:1, which passes as large text only; the CTA label is therefore 19 px 900 (`typography.button`) on phone and desktop.
- Touch targets: replay square and CTA are 56 px tall.

## Data

| Field | Source |
|---|---|
| Situation strings, coverage name, receiver short names, line to gain | Puzzle data |
| Final frame positions, ball path, outcome, yards, time in the pocket, cause, receiver feedback, play art | Simulation (`RepPlayback`, defined in 07-live-play) |
| Rep number, outcomes of earlier reps, best rep | Rep history (design state store) |
| Points | Engine scoring (base by reps plus a quality bonus; for example 75 + 2 = 77) |
| Day streak | Local storage |
| Result line | The front end's copy deck, one line per cause code (and per `forcedBy` value on the two forced codes), filled from the rep's facts |
| Key pill visibility | Derived: `outcome.kind === 'converted' \|\| repNumber === 4` |

**Proposal for the engine session**, the play-art contract (field units):

```ts
type Point = { x: number; y: number };
type ZoneType = 'deep' | 'flat' | 'hook' | 'curlFlat';

interface Zone { defenderId: string; type: ZoneType; cx: number; cy: number; rx: number; ry: number }

interface DefenderPath {
  defenderId: string;
  kind: 'zone' | 'man' | 'rush' | 'blitz';
  zoneType?: ZoneType;   // required when kind === 'zone'; sets the line colour
  points: Point[];       // pre-snap spot first, final spot last, untrimmed; the renderer trims 10.5 and adds arrowheads
}

interface DefensePlayArt {
  coverageName: string;  // e.g. 'Cover 4'; shown only when the key pill shows
  zones: Zone[];
  paths: DefenderPath[]; // exactly the defenders to draw; start dots come from this list
}
```

The ball path uses `RepPlayback.ball` (`from`, `control`, `to`). On an interception the football is drawn at `ball.to`.

## Open questions

1. **Touchdown result** (README). It needs its own headline and bonus display.
2. **How much a failed rep reveals** (README) beyond the play art already shown.
3. **Back navigation.** What do the browser and OS back actions do on the Result screen?

Resolved (approved by Mike):

- **Result line ownership.** The front end's copy deck writes the line from the cause code and the rep's facts. No line names the coverage.
- **Best rep when nothing gained.** The actual best value, signed (`0`, or `−3` when every rep lost yards). No dash.
- **Read stat short names.** The text the field draws on the receiver (`WR`, `TE`, `RB`), with the receiver's colour swatch before it to tell the wide receivers apart (Copy rules › Read stat).
- **Desktop key pill position.** "Defense · {coverage}" sits directly below the "Final · defense revealed" pill at the stage's top left, with an 8 px gap, in the same desktop pill style (30 px tall, 13 px 700). It shows only on a converted rep or rep 4, as on phone.
- **Rush-path selection.** The front end decides from the `Rep`, with no engine contract change. Every rusher who isn't a lineman (a blitz) gets the orange 2.4 px path. A lineman gets the grey rush path only when he is the decisive defender on a sack (`cause.decisive`). Other linemen engaged at the line get no path and no start dot, and an edge rush that didn't get the sack is not drawn.

Resolved in the build (not separately reviewed):

- **Desktop converted and out-of-reps panels.** The desktop panel takes the sheet's variant: Ink Green for converted and Charcoal for out of reps, with the cream-sheet desktop sizes and the variant's colours from Sheet variants.

## Acceptance criteria

- [ ] All seven states in `states/*.html` render from fixture data with the exact headline, tile, result line, stat values and labels, rep boxes, status text and CTA listed above.
- [ ] Phone layout matches `prototype.html` at 390×844: field 390×479 with `viewBox 0 0 403 495`, shade `rgba(6,13,10,.22)`, pills at 12/14 px, a 398 px sheet overlapping the field by 33 px.
- [ ] Sheet colour follows the rule: cream for failed or short with reps left, ink green for converted, charcoal when rep 4 fails or falls short. Interception uses the cream failed treatment.
- [ ] Cream sheet stat values are Charcoal, ink-green ones Read Gold, charcoal ones Snap Orange.
- [ ] The key pill "Defense · {coverage}" shows on converted and out-of-reps results only, never on an earlier failed or short rep.
- [ ] A converted result draws the first-down line at 3.5 px; all others at 2 px.
- [ ] The four `coverages/*.html` frames render from `DefensePlayArt` data alone: zone colours by type at 30% fill and 85% stroke, same-colour drop lines with no arrowhead, grey man and rush paths with arrowheads, 2.4 px orange blitz paths with arrowheads, r 3 grey start dots only for defenders with a path, every path trimmed 10.5 units, arrowheads 5 units at ±38°. A lineman's rush path appears only when he made the sack.
- [ ] Sack shows no ball path. Interception shows the football at the end of the ball path. No other state draws the football.
- [ ] Throwaway draws the ball path to just past the nearest sideline and shows `—` over `thrown away` in the read stat.
- [ ] Every route-running receiver has a badge whose shape matches its status. Blocking receivers have none.
- [ ] Dark theme matches `prototype-dark.html`, `prototype-desktop-dark.html` and `states/*-dark.html` with the field unchanged: the ink-green sheet is identical to light, and the out-of-reps sheet adds the orange ✕ tile beside a 44 px headline.
- [ ] At ≥900 px the layout matches `prototype-desktop.html`: 64 px top bar, stage on #0C3322 with no shade and the "Final · defense revealed" pill, 440 px panel, 58 px buttons with a 10 px radius, 34 px rep boxes, `Enter` triggers the CTA, `R` opens Replay, hints visible.
- [ ] Below 900 px the phone design renders, not the desktop stack.
- [ ] RUN IT BACK opens Protect with the previous design. SEE HOW THE PROS DID opens the Pros reveal. The replay square opens Replay, which returns here unchanged.
- [ ] Focus lands on the sheet heading on arrival. Tab order is replay square, then CTA.
- [ ] The rep-box group's `aria-label` lists every rep's state using the vocabulary above.
- [ ] Before the final rep or a conversion, the coverage name never appears in visible text or in any accessible name (field `aria-label`, sheet, pills, rep boxes). Field labels on those reps read "Rep N final frame with the defense revealed: …".
- [ ] Primary CTA label is 19 px 900, outcome tiles have a 10 px radius, the short tile text is On Tile #1E2B22, and stats are 800 at 26 px (desktop 900 at 32 px).
